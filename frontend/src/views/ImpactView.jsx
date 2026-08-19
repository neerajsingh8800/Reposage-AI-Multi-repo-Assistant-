import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { api, ApiError } from "../lib/api.js";
import { parseNode } from "../lib/format.js";
import { StateBlock, Thinking } from "../components/common.jsx";

export default function ImpactView({ symbolTarget, openInGraph }) {
  const { selectedRepoIds, repos } = useWorkspace();
  const [repoId, setRepoId] = useState(selectedRepoIds[0] || repos[0]?.repo_id || "");
  const [fn, setFn] = useState("");
  const [state, setState] = useState({ status: "idle", data: null, error: null, fn: "" });
  const inputRef = useRef(null);

  const run = async (name, repo) => {
    const target = (name ?? fn).trim();
    const r = repo ?? repoId;
    if (!target || !r) return;
    setFn(target);
    setState({ status: "loading", data: null, error: null, fn: target });
    try {
      const data = await api.graph(r, target);
      setState({ status: "done", data, error: null, fn: target });
    } catch (err) {
      setState({ status: "error", data: null, error: err instanceof ApiError ? err.message : "Error", fn: target });
    }
  };

  useEffect(() => {
    if (symbolTarget?.symbol) {
      const r = symbolTarget.repoId || repoId;
      setRepoId(r);
      run(symbolTarget.symbol, r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolTarget]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      run();
    }
  };

  const blast = state.data?.blast_radius || {};
  const entries = useMemo(() => Object.entries(blast), [blast]);
  const total = entries.length;
  const maxDepth = entries.reduce((m, [, d]) => Math.max(m, Number(d) || 0), 0);

  const byDepth = useMemo(() => {
    const groups = new Map();
    for (const [node, depth] of entries) {
      const d = Number(depth) || 0;
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d).push(node);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]);
  }, [entries]);

  const severity = total === 0 ? "none" : total <= 3 ? "low" : total <= 10 ? "medium" : "high";
  const severityLabel = { none: "Isolated", low: "Low", medium: "Moderate", high: "High" }[severity];

  return (
    <div className="page">
      <div className="graph-controls">
        <div className="graph-repo">
          <label className="muted">Repository</label>
          <select className="select" value={repoId} onChange={(e) => setRepoId(e.target.value)}>
            {repos.length === 0 ? <option value="">No repositories</option> : null}
            {repos.map((r) => (
              <option key={r.repo_id} value={r.repo_id}>{r.repo_id}</option>
            ))}
          </select>
        </div>
        <div className="graph-fn">
          <Icon name="impact" size={16} className="muted" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Symbol to analyze — e.g. validate_amount"
            value={fn}
            onChange={(e) => setFn(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!repoId}
          />
        </div>
        <button className="btn btn-primary" onClick={() => run()} disabled={!fn.trim() || !repoId} type="button">
          Analyze
        </button>
      </div>

      {state.status === "idle" ? (
        <StateBlock icon="impact" title="Estimate the blast radius of a change">
          RepoSage walks the dependency graph outward from a symbol and reports every node reachable from it, along with how many hops away each one is.
        </StateBlock>
      ) : null}

      {state.status === "loading" ? (
        <div className="panel"><div className="pad"><Thinking label={`Computing blast radius for ${state.fn}`} /></div></div>
      ) : null}

      {state.status === "error" ? (
        <StateBlock icon="alert" tone="danger" title="Could not compute impact">{state.error}</StateBlock>
      ) : null}

      {state.status === "done" ? (
        <div className="impact">
          <div className="impact-summary">
            <div className="impact-gauge" data-sev={severity}>
              <div className="impact-gauge-num mono">{total}</div>
              <div className="impact-gauge-label">affected nodes</div>
            </div>
            <div className="impact-facts">
              <div className="impact-head">
                <div>
                  <div className="impact-target mono">{state.fn}</div>
                  <div className="muted">{repoId}</div>
                </div>
                <span className="sev-pill" data-sev={severity}>{severityLabel} impact</span>
              </div>
              <div className="impact-metrics">
                <div className="metric"><span className="metric-v mono">{total}</span><span className="metric-l">Reachable nodes</span></div>
                <div className="metric"><span className="metric-v mono">{maxDepth}</span><span className="metric-l">Max depth</span></div>
                <div className="metric"><span className="metric-v mono">{byDepth[0] ? byDepth[0][1].length : 0}</span><span className="metric-l">Direct (depth {byDepth[0] ? byDepth[0][0] : 0})</span></div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => openInGraph(state.fn, repoId)} type="button">
                <Icon name="graph" size={13} /> Open in dependency graph
              </button>
            </div>
          </div>

          {total === 0 ? (
            <StateBlock icon="check" tone="success" title="No downstream dependencies">
              Nothing in the graph depends on <span className="mono">{state.fn}</span>. Changing it should be safe from a call-graph perspective.
            </StateBlock>
          ) : (
            <div className="impact-depths">
              {byDepth.map(([depth, nodes]) => (
                <div className="depth-band" key={depth}>
                  <div className="depth-band-head">
                    <span className="depth-ring" style={{ opacity: 1 - depth / (maxDepth + 1) * 0.6 }}>{depth}</span>
                    <span className="depth-title">{depth === 0 ? "Direct dependents" : `${depth} hop${depth > 1 ? "s" : ""} away`}</span>
                    <span className="badge">{nodes.length}</span>
                  </div>
                  <div className="depth-nodes">
                    {nodes.map((node, i) => {
                      const n = parseNode(node);
                      return (
                        <button className="impact-node" key={i} onClick={() => openInGraph(n.symbol, repoId)} type="button" title={n.raw}>
                          <Icon name="box" size={13} />
                          <span className="mono impact-node-sym">{n.symbol}</span>
                          {n.file ? <span className="impact-node-file mono">{n.file}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
