# RepoSage

RAG-based multi-repository engineering assistant using hybrid semantic/BM25
search, AST-aware code chunking, and dependency graph analysis.

## IMPORTANT — keep this as your ONLY project folder

Extract this zip to ONE location and work only from there — for example:
`D:\Users\reposage_starter\reposage`

Do not create a second copy anywhere else (e.g. via Claude Code opening a
different folder). If you ever lose track of where your files are, run:
```powershell
Get-ChildItem -Path D:\ -Recurse -Filter "chunker.py" -ErrorAction SilentlyContinue
```
That tells you exactly where your real project lives.

## Setup — Windows (PowerShell)

Run these one line at a time, from inside this extracted folder:

```powershell
py -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Your terminal prompt should now start with `(venv)`.

## Setup — Mac/Linux

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Try it — run these in order, from inside the `ingestion` folder

```powershell
cd ingestion

# Phase 1: AST-aware chunking on one file
python chunker.py ../sample_repo/payments.py

# Phase 1: chunk an entire repo
python repo_walker.py ../sample_repo

# Phase 2: dependency graph + impact analysis
python graph_builder.py ../sample_repo process_payment

# Phase 1+2 combined, one clean demo run
python demo_progress.py ../sample_repo process_payment

# Phase 3: hybrid search (BM25 + semantic + graph boost)
# NOTE: first run downloads a ~90MB embedding model (one-time, needs internet)
python hybrid_search.py ../sample_repo "how does refunding work" demo
```

## Testing against a real repo (recommended for demos)

```powershell
cd ..
git clone --depth 1 https://github.com/psf/requests.git test_repo
cd ingestion
python demo_progress.py ../test_repo/src/requests set_cookie
```

Expected: 19 files, 312 chunks, 292 graph nodes, 495 edges, and a real
blast-radius result for `set_cookie` (5 direct callers, 20+ affected within
2 hops).

## Status

- [x] Phase 0 — project scaffolding
- [x] Phase 1 — AST-aware chunker (`chunker.py`) + repo walker (`repo_walker.py`)
      — validated on psf/requests, 24 files, 0 skipped
- [x] Phase 2 — dependency graph (`graph_builder.py`) — 292 nodes, 495 edges
      on psf/requests; callers/callees/blast-radius all working
- [x] Phase 3 — hybrid retrieval (`embedder.py` + `hybrid_search.py`) —
      ChromaDB semantic search + BM25 keyword search + graph boosting,
      fused with Reciprocal Rank Fusion
- [ ] Phase 4 — RAG prompt assembly + LLM call (backend/generator.py)
- [ ] Phase 5 — FastAPI backend, React frontend
- [ ] Phase 6 — evaluation harness
- [ ] Deployment

## Folder structure

```
reposage/
├── ingestion/
│   ├── chunker.py         # Phase 1: AST-aware chunking
│   ├── repo_walker.py     # Phase 1: batch-processes a whole repo
│   ├── graph_builder.py   # Phase 2: dependency graph + impact analysis
│   ├── embedder.py        # Phase 3: ChromaDB embeddings
│   ├── hybrid_search.py   # Phase 3: BM25 + semantic + graph fusion
│   ├── demo_progress.py   # Combined Phase 1+2 demo script
│   └── spot_check.py      # Manual verification tool for one file
├── sample_repo/           # small test files used during development
└── requirements.txt
```

## Next session — pick up here

Phase 4: RAG generation. Get a free Groq API key (console.groq.com), store it
in a `.env` file (add `.env` to `.gitignore` immediately), then build
`backend/generator.py` — takes a question + hybrid_search results, builds a
prompt instructing the LLM to answer ONLY from retrieved code with file:line
citations, calls the Groq API, returns the answer.
