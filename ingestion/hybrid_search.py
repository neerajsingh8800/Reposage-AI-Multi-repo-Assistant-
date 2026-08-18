"""
Hybrid retrieval for RepoSage (Phase 3b).

Combines BM25 keyword search + semantic search (ChromaDB) + graph
boosting (callers/callees of the top hit), fused with Reciprocal Rank
Fusion (RRF).
"""

import re
import sys

from rank_bm25 import BM25Okapi

from ingestion.chunker import CodeChunk
from ingestion.embedder import search_semantic
from ingestion.graph_builder import build_graph, callers_of, callees_of


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z_][a-zA-Z0-9_]*", text.lower())


class HybridIndex:
    def __init__(self, chunks: list[CodeChunk], repo_id: str):
        self.chunks = chunks
        self.repo_id = repo_id
        self.qualified_names = []
        corpus = []
        for c in chunks:
            qn = f"{c.file_path}::{c.parent_class}.{c.name}" if c.parent_class else f"{c.file_path}::{c.name}"
            self.qualified_names.append(qn)
            text = (c.docstring + " " if c.docstring else "") + c.code
            corpus.append(_tokenize(text))
        self.bm25 = BM25Okapi(corpus) if corpus else None
        self.graph = build_graph(chunks)
        self._by_qualified = {qn: c for qn, c in zip(self.qualified_names, chunks)}

    def bm25_search(self, query: str, top_k: int = 5) -> list[str]:
        if self.bm25 is None:
            return []
        scores = self.bm25.get_scores(_tokenize(query))
        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        return [self.qualified_names[i] for i in ranked[:top_k] if scores[i] > 0]


def _rrf_merge(ranked_lists: list[list[str]], k: int = 60) -> list[str]:
    scores: dict[str, float] = {}
    for ranked in ranked_lists:
        for rank, item in enumerate(ranked):
            scores[item] = scores.get(item, 0.0) + 1.0 / (k + rank + 1)
    return sorted(scores.keys(), key=lambda item: scores[item], reverse=True)


def hybrid_search(query: str, repo_id: str, top_k: int = 5, index: "HybridIndex | None" = None) -> list[dict]:
    if index is None:
        raise ValueError("hybrid_search requires a prebuilt HybridIndex -- build one with HybridIndex(chunks, repo_id)")

    bm25_names = index.bm25_search(query, top_k=top_k * 2)
    semantic_hits = search_semantic(query, repo_id, top_k=top_k * 2)
    semantic_names = [h["qualified_name"] for h in semantic_hits]

    fused = _rrf_merge([bm25_names, semantic_names])

    boosted = list(fused)
    if fused:
        top_hit = fused[0]
        neighbors = callers_of(index.graph, top_hit) + callees_of(index.graph, top_hit)
        for n in neighbors:
            if n not in boosted:
                boosted.append(n)

    results = []
    for qn in boosted[:top_k]:
        chunk = index._by_qualified.get(qn)
        if chunk is None:
            continue
        results.append({
            "qualified_name": qn,
            "file_path": chunk.file_path,
            "chunk_type": chunk.chunk_type,
            "start_line": chunk.start_line,
            "end_line": chunk.end_line,
        })
    return results


if __name__ == "__main__":
    from repo_walker import chunk_repo
    from embedder import embed_chunks

    repo_path = sys.argv[1] if len(sys.argv) > 1 else "../sample_repo"
    query = sys.argv[2] if len(sys.argv) > 2 else "how does refunding work"
    repo_id = sys.argv[3] if len(sys.argv) > 3 else "demo"

    print(f"Chunking {repo_path} ...")
    chunks = chunk_repo(repo_path, verbose=False)

    print(f"Embedding {len(chunks)} chunks (repo_id='{repo_id}') ...")
    embed_chunks(chunks, repo_id)

    print("Building BM25 index + dependency graph ...")
    index = HybridIndex(chunks, repo_id)

    print(f"\nHybrid search: '{query}'\n")
    results = hybrid_search(query, repo_id, top_k=5, index=index)
    for r in results:
        print(f"  {r['qualified_name']}  ({r['file_path']}:{r['start_line']}-{r['end_line']})  [{r['chunk_type']}]")
