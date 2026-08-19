import React, { useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { api, ApiError } from "../lib/api.js";
import { parseCitation, fileName, fileDir, lineLabel } from "../lib/format.js";
import { StateBlock, Thinking, Confidence } from "../components/common.jsx";

export default function SearchView({ openInExplorer, openInGraph }) {
  const { selectedRepoIds, backend } = useWorkspace();
  const [q, setQ] = useState("");
  const [state, setState] = useState({ status: "idle", groups: [], query: "" });
  const inputRef = useRef(null);

  const run = async () => {
    const query = q.trim();
    if (!query || !selectedRepoIds.length) return;
    setState({ status: "loading", groups: [], query });
    const groups = await Promise.all(
      selectedRepoIds.map(async (repoId) => {
        try {
          const data = await api.query(repoId, query);
          const results = (data.citations || []).map((c) => parseCitation(c));
          return { repoId, results, answer: data.answer, confidence: data.confidence, error: null };
        } catch (err) {
          return { repoId, results: [], error: err instanceof ApiError ? err.message : "Error" };
        }
      })
    );
    setState({ status: "done", groups, query });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      run();
    }
  };

  const totalResults = state.groups.reduce((a, g) => a + g.results.length, 0);

  return (
    <div className="page">
      <div className="search-bar">
        <div className="search-field">
          <Icon name="search" size={17} className="muted" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search code semantically — e.g. 'where are webhooks verified'"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!selectedRepoIds.length}
          />
          {q ? (
            <button className="icon-btn" onClick={() => { setQ(""); inputRef.current?.focus(); }} type="button" aria-label="Clear">
              <Icon name="x" size={15} />
            </button>
          ) : null}
        </div>
        <button className="btn btn-primary" onClick={run} disabled={!q.trim() || !selectedRepoIds.length} type="button">
          Search
        </button>
      </div>

      <p className="search-note muted">
        Search is powered by RepoSage&apos;s retrieval pipeline: results are the source chunks the model cites as most relevant.
      </p>

      {!selectedRepoIds.length ? (
        <StateBlock icon="repo" title="Select a repository">Pick one or more repositories from the top bar to search across them.</StateBlock>
      ) : null}

      {state.status === "loading" ? (
        <div className="panel"><div className="pad"><Thinking label="Retrieving relevant sources" /></div></div>
      ) : null}

      {state.status === "done" ? (
        <div className="search-results">
          <div className="search-summary">
            <span className="mono tabnums">{totalResults}</span> results for
            <span className="search-q">&ldquo;{state.query}&rdquo;</span>
            across {state.groups.length} {state.groups.length === 1 ? "repository" : "repositories"}
          </div>

          {state.groups.map((g) => (
            <div className="search-group" key={g.repoId}>
              <div className="search-group-head">
                <Icon name="repo" size={14} />
                <span className="mono">{g.repoId}</span>
                {g.error ? <span className="badge badge-danger">error</span> : <span className="muted">{g.results.length} sources</span>}
                {g.confidence != null ? <Confidence value={g.confidence} /> : null}
              </div>

              {g.error ? (
                <StateBlock icon="alert" tone="danger" title="Search failed for this repository">{g.error}</StateBlock>
              ) : g.results.length === 0 ? (
                <div className="empty-mini"><Icon name="search" size={16} /><span>No sources returned.</span></div>
              ) : (
                <ul className="result-list">
                  {g.results.map((cit, i) => {
                    const dir = fileDir(cit.file);
                    const line = lineLabel(cit);
                    return (
                      <li className="result" key={i}>
                        <div className="result-rank mono">{String(i + 1).padStart(2, "0")}</div>
                        <div className="result-main">
                          <div className="result-top">
                            <Icon name="fileCode" size={14} className="muted" />
                            <button className="result-file" onClick={() => openInExplorer(cit, g.repoId)} type="button">
                              {fileName(cit.file)}
                            </button>
                            {line ? <span className="result-lines mono">{line}</span> : null}
                          </div>
                          {dir ? <div className="result-path mono">{dir}/</div> : null}
                          <div className="result-actions">
                            <button className="btn btn-ghost btn-sm" onClick={() => openInExplorer(cit, g.repoId)} type="button">
                              <Icon name="fileCode" size={13} /> Open
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => openInGraph(fileName(cit.file).replace(/\.[^.]+$/, ""), g.repoId)} type="button">
                              <Icon name="graph" size={13} /> Graph
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {state.status === "idle" && selectedRepoIds.length ? (
        <div className="search-hints">
          <div className="search-hints-title muted">Try searching for</div>
          <div className="row gap-8 wrap">
            {["error handling", "database connection", "input validation", "rate limiting", "authentication flow"].map((h) => (
              <button key={h} className="chip chip-btn" onClick={() => { setQ(h); }} type="button">
                <Icon name="search" size={12} /> {h}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
