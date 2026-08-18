import os
import re
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq

from ingestion.embedder import collection_exists, embed_chunks
from ingestion.hybrid_search import HybridIndex, hybrid_search
from ingestion.repo_walker import chunk_repo

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def _safe_repo_id(repo_id: str | None, repo_path: str | Path | None) -> str:
    if repo_id:
        return repo_id
    if repo_path:
        return str(Path(repo_path).name)
    return "default_repo"


def _extract_citations(text: str) -> list[str]:
    pattern = r"(?:[A-Za-z0-9_./\\-]+\.py|[A-Za-z0-9_./\\-]+\.js):\d+(?:-\d+)?"
    return list(dict.fromkeys(re.findall(pattern, text)))


def _build_context_prompt(results: list[dict]) -> str:
    if not results:
        return "No code context found."

    lines: list[str] = []
    for item in results:
        lines.append(
            f"- {item['qualified_name']} | {item['file_path']}:{item['start_line']}-{item['end_line']} | {item['chunk_type']}"
        )
    return "\n".join(lines)


def answer_question(question: str, repo_path: str | Path, repo_id: str | None = None, top_k: int = 5) -> dict:
    """Retrieve repo context and ask Groq for a citation-grounded answer."""
    repo_id = _safe_repo_id(repo_id, repo_path)
    repo_path = str(repo_path)

    if not Path(repo_path).exists():
        raise FileNotFoundError(f"Repository path not found: {repo_path}")

    chunks = chunk_repo(repo_path, verbose=False)
    if not chunks:
        return {
            "answer": "Not found in repository",
            "citations": [],
            "confidence": 0.0,
        }

    if not collection_exists(repo_id):
        embed_chunks(chunks, repo_id)
    index = HybridIndex(chunks, repo_id)
    hits = hybrid_search(question, repo_id, top_k=top_k, index=index)

    if not hits:
        return {
            "answer": "Not found in repository",
            "citations": [],
            "confidence": 0.0,
        }

    context = _build_context_prompt(hits)
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is not set. Add it to your .env file.")

    client = Groq(api_key=api_key)
    system_prompt = (
        "You are RepoSage, a code-aware repository assistant. "
        "Answer only from the repository context below. "
        "Every factual claim must include an explicit file:line citation in the format [path:line-start-line-end]. "
        "If the answer is not supported by the retrieved code, say 'Not found in repository'. "
        "Do not invent APIs, behaviors, or files."
    )
    user_prompt = (
        f"Question: {question}\n\n"
        f"Repository context:\n{context}\n\n"
        "Return JSON with keys: answer, citations, confidence. "
        "The answer should be concise but grounded in the context."
    )

    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        temperature=0.1,
        max_tokens=800,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )

    content = response.choices[0].message.content.strip()
    citations = []
    for hit in hits:
        citations.append(f"{hit['file_path']}:{hit['start_line']}-{hit['end_line']}")

    answer_text = content
    if answer_text.startswith("```"):
        answer_text = re.sub(r"^```(json|\w+)?\s*|```\s*$", "", answer_text, flags=re.MULTILINE).strip()

    parsed = {}
    try:
        parsed = __import__("json").loads(answer_text)
    except Exception:
        parsed = {
            "answer": answer_text,
            "citations": citations,
            "confidence": 0.75,
        }

    return {
        "answer": parsed.get("answer", answer_text),
        "citations": parsed.get("citations", citations),
        "confidence": float(parsed.get("confidence", 0.75)),
    }


if __name__ == "__main__":
    import sys

    repo_path = sys.argv[1] if len(sys.argv) > 1 else "../sample_repo"
    question = sys.argv[2] if len(sys.argv) > 2 else "how does refunding work"
    result = answer_question(question, repo_path, repo_id="demo")
    print(result)
