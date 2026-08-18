"""
Repo-level ingestion for RepoSage.

Walks an entire repository, finds every relevant source file, and runs
the AST-aware chunker (chunker.py) on each one.
"""

import os
from pathlib import Path

from ingestion.chunker import CodeChunk, chunk_python_file

SKIP_DIRS = {
    ".git", "__pycache__", "node_modules", "venv", "env", ".venv",
    "dist", "build", ".mypy_cache", ".pytest_cache", "site-packages",
}

LANGUAGE_HANDLERS = {
    ".py": chunk_python_file,
}


def find_source_files(repo_path: str) -> list[str]:
    matches = []
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for filename in files:
            ext = Path(filename).suffix
            if ext in LANGUAGE_HANDLERS:
                matches.append(os.path.join(root, filename))
    return matches


def chunk_repo(repo_path: str, verbose: bool = True) -> list[CodeChunk]:
    """Chunk every supported source file in a repository.

    Files that fail to parse are skipped (not fatal) so one bad file
    doesn't kill ingestion of the other 500.
    """
    all_chunks: list[CodeChunk] = []
    files = find_source_files(repo_path)
    skipped: list[tuple[str, str]] = []

    for file_path in files:
        ext = Path(file_path).suffix
        handler = LANGUAGE_HANDLERS[ext]
        try:
            chunks = handler(file_path)
            all_chunks.extend(chunks)
        except Exception as e:
            skipped.append((file_path, str(e)))

    if verbose:
        print(f"Walked {repo_path}")
        print(f"  files found:   {len(files)}")
        print(f"  files skipped: {len(skipped)}")
        print(f"  total chunks:  {len(all_chunks)}")
        if skipped:
            print("  skipped files:")
            for path, err in skipped[:10]:
                print(f"    - {path}: {err}")

    return all_chunks


if __name__ == "__main__":
    import sys
    from collections import Counter

    target_repo = sys.argv[1] if len(sys.argv) > 1 else "sample_repo"
    chunks = chunk_repo(target_repo)

    print("\nBreakdown by chunk type:")
    counts = Counter(c.chunk_type for c in chunks)
    for chunk_type, n in counts.items():
        print(f"  {chunk_type}: {n}")

    print("\nBreakdown by file:")
    file_counts = Counter(c.file_path for c in chunks)
    for path, n in sorted(file_counts.items()):
        print(f"  {path}: {n} chunks")
