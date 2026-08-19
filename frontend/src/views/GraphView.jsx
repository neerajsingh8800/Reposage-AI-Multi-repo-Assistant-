import React, { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { api, ApiError } from "../lib/api.js";
import { parseNode } from "../lib/format.js";
import { StateBlock, Thinking } from "../components/common.jsx";

function NodePill({ node, side, onClick }) {
  const n = parseNode(node);
  return (
    <button className="gnode" data-side={side} onClick={() => onClick?.(n.symbol)} type="button" title={n.raw}>
      <span className="gnode-sym mono">{n.symbol}</span>
      {n.file ? <span className="gnode-file mono">{n.file}</span> : null}
    </button>
  );
}

export default function GraphView({ symbolTarget, openInImpact }) {
  const { selectedRepoIds, repos } = useWorkspace();
  const [repoId, setRepoId] = useState(selectedRepoIds[0] || repos[0]?.repo_id || "");
  const [fn, setFn] = useState("");
  const [state, setState] = useState({ status: "idle", data: null, error: null, fn: "" });
  const inputRef = useRef(null);

  useEffect(() => {
    if (!repoId && selectedRepoIds[0]) setRepoId(selectedRepoIds[0]);
  }, [selectedRepoIds, repoId]);

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

  // Cross-view navigation: run automatically when a symbol target arrives.
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

  const data = state.data;
  const callers = data?.callers || [];
  const callees = data?.callees || [];

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
          <Icon name="graph" size={16} className="muted" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Function or method name — e.g. process_payment"
            value={fn}
            onChange={(e) => setFn(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!repoId}
          />
        </div>
        <button className="btn btn-primary" onClick={() => run()} disabled={!fn.trim() || !repoId} type="button">
          Trace
        </button>
      </div>

      {state.status === "idle" ? (
        <StateBlock icon="graph" title="Trace a function's relationships">
          Enter a function or method name to see everything that calls into it and everything it calls. Node ids follow the backend&apos;s <span className="mono">file.py::Symbol</span> format.
        </StateBlock>
      ) : null}

      {state.status === "loading" ? (
        <div className="panel"><div className="pad"><Thinking label={`Building call graph for ${state.fn}`} /></div></div>
      ) : null}

      {state.status === "error" ? (
        <StateBlock icon="alert" tone="danger" title="Could not build the graph">{state.error}</StateBlock>
      ) : null}

      {state.status === "done" ? (
        <>
          <div className="graph-canvas">
            <div className="gcol">
              <div className="gcol-head"><Icon name="arrowRight" size={14} /> Callers <span className="badge">{callers.length}</span></div>
              <div className="gcol-list">
                {callers.length ? callers.map((c, i) => <NodePill key={i} node={c} side="caller" onClick={(s) => run(s)} />)
                  : <div className="empty-mini"><span>No callers found</span></div>}
              </div>
            </div>

            <div className="gcenter">
              <div className="gcenter-lines" aria-hidden="true"><span /><span /></div>
              <div className="gtarget">
                <div className="gtarget-badge"><Icon name="target" size={16} /></div>
                <div className="gtarget-sym mono">{state.fn}</div>
                <div className="gtarget-repo">{repoId}</div>
                <button className="btn btn-secondary btn-sm mt-10" onClick={() => openInImpact(state.fn, repoId)} type="button">
                  <Icon name="impact" size={13} /> Impact
                </button>
              </div>
            </div>

            <div className="gcol">
              <div className="gcol-head">Callees <span className="badge">{callees.length}</span> <Icon name="arrowRight" size={14} /></div>
              <div className="gcol-list">
                {callees.length ? callees.map((c, i) => <NodePill key={i} node={c} side="callee" onClick={(s) => run(s)} />)
                  : <div className="empty-mini"><span>No callees found</span></div>}
              </div>
            </div>
          </div>

          <div className="graph-legend muted">
            <span><span className="dot dot-caller" /> Callers depend on this symbol</span>
            <span><span className="dot dot-target" /> Selected symbol</span>
            <span><span className="dot dot-callee" /> This symbol depends on callees</span>
            <span className="graph-legend-hint">Click any node to re-trace from it.</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
