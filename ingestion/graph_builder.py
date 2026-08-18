"""
Dependency graph builder for RepoSage (Phase 2).

Takes the list of CodeChunk objects produced by repo_walker.py and builds
a directed graph: one node per function/method/class, one edge per "calls"
relationship. This is what powers "what calls X" and blast-radius queries.
"""

import networkx as nx

from ingestion.chunker import CodeChunk


def _qualified_name(chunk: CodeChunk) -> str:
    base_name = f"{chunk.parent_class}.{chunk.name}" if chunk.parent_class else chunk.name
    return f"{chunk.file_path}::{base_name}"


def build_graph(chunks: list[CodeChunk]) -> nx.DiGraph:
    graph = nx.DiGraph()
    name_to_qualified: dict[str, list[str]] = {}

    for chunk in chunks:
        qualified_name = _qualified_name(chunk)
        graph.add_node(
            qualified_name,
            file_path=chunk.file_path,
            chunk_type=chunk.chunk_type,
            start_line=chunk.start_line,
            end_line=chunk.end_line,
        )
        name_to_qualified.setdefault(chunk.name, []).append(qualified_name)

    for chunk in chunks:
        caller = _qualified_name(chunk)
        for called_name in chunk.calls:
            targets = name_to_qualified.get(called_name, [])
            for target in targets:
                if target != caller:
                    graph.add_edge(caller, target)

    return graph


def callers_of(graph: nx.DiGraph, name: str) -> list[str]:
    matches = [n for n in graph.nodes if n == name or n.endswith(f".{name}")]
    callers = set()
    for m in matches:
        callers.update(graph.predecessors(m))
    return sorted(callers)


def callees_of(graph: nx.DiGraph, name: str) -> list[str]:
    matches = [n for n in graph.nodes if n == name or n.endswith(f".{name}")]
    callees = set()
    for m in matches:
        callees.update(graph.successors(m))
    return sorted(callees)


def blast_radius(graph: nx.DiGraph, name: str, max_depth: int = 2) -> dict[str, int]:
    matches = [n for n in graph.nodes if n == name or n.endswith(f".{name}")]
    affected: dict[str, int] = {}
    for start in matches:
        lengths = nx.single_source_shortest_path_length(
            graph.reverse(copy=False), start, cutoff=max_depth
        )
        for node, dist in lengths.items():
            if node != start:
                affected[node] = min(dist, affected.get(node, dist))
    return dict(sorted(affected.items(), key=lambda kv: kv[1]))


if __name__ == "__main__":
    import sys
    from repo_walker import chunk_repo

    target_repo = sys.argv[1] if len(sys.argv) > 1 else "../sample_repo"
    chunks = chunk_repo(target_repo, verbose=False)
    graph = build_graph(chunks)

    print(f"\nGraph built from {target_repo}")
    print(f"  nodes: {graph.number_of_nodes()}")
    print(f"  edges: {graph.number_of_edges()}")

    if len(sys.argv) > 2:
        query_name = sys.argv[2]
        print(f"\nWho calls '{query_name}'?  -> {callers_of(graph, query_name)}")
        print(f"What does '{query_name}' call?  -> {callees_of(graph, query_name)}")
        print(f"Blast radius of '{query_name}' (2 hops): {blast_radius(graph, query_name)}")
