import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

export default function RepoSelector({ onAddRepo }) {
  const { repos, selectedRepoIds, selectedRepos, toggleRepo, setSelectedRepoIds } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const summary =
    selectedRepos.length === 0
      ? "No repositories"
      : selectedRepos.length === 1
      ? selectedRepos[0].repo_id
      : `${selectedRepos.length} repositories`;

  return (
    <div className="pop-wrap" ref={ref}>
      <button className="cmdk-btn" onClick={() => setOpen((o) => !o)} type="button" aria-expanded={open}>
        <Icon name="repo" size={15} />
        <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {summary}
        </span>
        <Icon name="chevronDown" size={14} style={{ color: "var(--text-faint)" }} />
      </button>

      {open && (
        <div className="pop" style={{ minWidth: 300 }}>
          <div className="pop-title">Repository context</div>
          {repos.map((r) => {
            const active = selectedRepoIds.includes(r.repo_id);
            return (
              <button key={r.repo_id} className="pop-item" onClick={() => toggleRepo(r.repo_id)} type="button">
                <span className="status-dot" data-state={active ? "online" : undefined} style={{ width: 7, height: 7 }} />
                <span className="mono" style={{ fontSize: 12.5 }}>{r.repo_id}</span>
                <span className="faint mono" style={{ fontSize: 10.5 }}>{r.repo_path}</span>
                {active && <Icon name="check" size={15} className="check" />}
              </button>
            );
          })}
          <div className="pop-sep" />
          <div className="row" style={{ padding: "2px 4px", gap: 6 }}>
            <button className="btn btn-ghost btn-sm grow" onClick={() => setSelectedRepoIds(repos.map((r) => r.repo_id))} type="button">
              Select all
            </button>
            <button className="btn btn-ghost btn-sm grow" onClick={() => setSelectedRepoIds([])} type="button">
              Clear
            </button>
          </div>
          <div className="pop-sep" />
          <button className="pop-item" onClick={() => { setOpen(false); onAddRepo?.(); }} type="button">
            <Icon name="plus" size={15} className="ic" style={{ color: "var(--accent)" }} />
            Connect repository
          </button>
        </div>
      )}
    </div>
  );
}
