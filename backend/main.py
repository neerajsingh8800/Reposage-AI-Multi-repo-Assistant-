import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ingestion.embedder import delete_collection, embed_chunks
from ingestion.graph_builder import blast_radius, build_graph, callers_of, callees_of
from ingestion.repo_walker import chunk_repo
from backend.generator import answer_question

app = FastAPI(title="RepoSage API")

STORE_PATH = Path(__file__).resolve().parent / "repo_store.json"


class RepoConnectRequest(BaseModel):
    repo_path: str
    repo_id: str | None = None


class QueryRequest(BaseModel):
    repo_id: str
    question: str


def _load_store() -> dict:
    if not STORE_PATH.exists():
        return {}
    try:
        return json.loads(STORE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _save_store(store: dict) -> None:
    STORE_PATH.write_text(json.dumps(store, indent=2), encoding="utf-8")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "project": "RepoSage"}


@app.post("/repos/connect")
def connect_repo(request: RepoConnectRequest) -> dict:
    repo_path = request.repo_path
    repo_id = request.repo_id or Path(repo_path).name

    if not Path(repo_path).exists():
        raise HTTPException(status_code=404, detail=f"Repository path not found: {repo_path}")

    chunks = chunk_repo(repo_path, verbose=False)
    embed_chunks(chunks, repo_id)

    store = _load_store()
    store[repo_id] = {"repo_path": repo_path}
    _save_store(store)

    return {
        "repo_id": repo_id,
        "repo_path": repo_path,
        "chunks": len(chunks),
    }


@app.post("/query")
def query_repo(request: QueryRequest) -> dict:
    store = _load_store()
    repo_meta = store.get(request.repo_id)
    if not repo_meta:
        raise HTTPException(status_code=404, detail=f"Unknown repo_id: {request.repo_id}")

    result = answer_question(request.question, repo_meta["repo_path"], repo_id=request.repo_id)
    return result


@app.get("/graph/{repo_id}/{function_name}")
def graph_for_function(repo_id: str, function_name: str) -> dict:
    store = _load_store()
    repo_meta = store.get(repo_id)
    if not repo_meta:
        raise HTTPException(status_code=404, detail=f"Unknown repo_id: {repo_id}")

    chunks = chunk_repo(repo_meta["repo_path"], verbose=False)
    graph = build_graph(chunks)

    return {
        "callers": callers_of(graph, function_name),
        "callees": callees_of(graph, function_name),
        "blast_radius": blast_radius(graph, function_name, max_depth=2),
    }


@app.delete("/repos/{repo_id}")
def delete_repo(repo_id: str) -> dict:
    store = _load_store()
    if repo_id not in store:
        raise HTTPException(status_code=404, detail=f"Unknown repo_id: {repo_id}")

    del store[repo_id]
    _save_store(store)

    delete_collection(repo_id)

    return {"deleted": repo_id}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
