import React, { useMemo } from "react";
import Icon from "../components/Icon.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { StateBlock } from "../components/common.jsx";
import { fileName } from "../lib/format.js";

function StatCard({ icon, label, value, hint, tone }) {
  return (
    <div className="stat" data-tone={tone}>
      <div className="stat-ic">
        <Icon name={icon} size={18} />
      </div>
      <div className="stat-body">
        <div className="stat-value mono tabnums">{value}</div>
        <div className="stat-label">{label}</div>
        {hint ? <div className="stat-hint">{hint}</div> : null}
      </div>
    </div>
  );
}

export default function Overview({ navigate, onAddRepo }) {
  const { repos, selectedRepoIds, backend, recent, selectOnly } = useWorkspace();

  const totalChunks = useMemo(
    () => repos.reduce((acc, r) => acc + (Number(r.chunks) || 0), 0),
    [repos]
  );
  const indexedCount = repos.filter((r) => r.chunks != null).length;

  return (
    <div className="page">
      <div className="overview-grid">
        <section className="panel col-span-2">
          <div className="panel-head">
            <h3>Workspace</h3>
            <button className="btn btn-primary btn-sm" onClick={onAddRepo} type="button">
              <Icon name="plus" size={14} /> Connect repository
            </button>
          </div>
          <div className="stats">
            <StatCard icon="repo" label="Repositories" value={repos.length} hint={`${selectedRepoIds.length} selected`} />
            <StatCard icon="hash" label="Indexed chunks" value={totalChunks ? totalChunks.toLocaleString() : "—"} hint={indexedCount ? `${indexedCount} indexed this session` : "connect to index"} />
            <StatCard
              icon="server"
              label="Backend"
              value={backend.status === "online" ? "Online" : backend.status === "checking" ? "Checking" : "Offline"}
              hint={backend.project || backend.error || ""}
              tone={backend.status === "online" ? "success" : backend.status === "offline" ? "danger" : undefined}
            />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Backend health</h3>
            <span className={`status-dot ${backend.status}`} aria-hidden="true" />
          </div>
          <div className="health">
            <div className="health-row">
              <span className="muted">Status</span>
              <span className="mono">{backend.status}</span>
            </div>
            <div className="health-row">
              <span className="muted">Project</span>
              <span className="mono">{backend.project || "—"}</span>
            </div>
            {backend.error ? (
              <p className="health-note">{backend.error}</p>
            ) : (
              <p className="health-note ok">FastAPI reachable. Queries and graph lookups are available.</p>
            )}
          </div>
        </section>

        <section className="panel col-span-2">
          <div className="panel-head">
            <h3>Connected repositories</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("ask")} type="button">
              Ask RepoSage <Icon name="arrowRight" size={14} />
            </button>
          </div>
          {repos.length === 0 ? (
            <StateBlock icon="repo" title="No repositories connected">
              Connect a local repository path to start querying it.
            </StateBlock>
          ) : (
            <div className="repo-cards">
              {repos.map((r) => {
                const active = selectedRepoIds.includes(r.repo_id);
                return (
                  <button
                    key={r.repo_id}
                    className="repo-card"
                    data-active={active}
                    type="button"
                    onClick={() => { selectOnly(r.repo_id); navigate("ask"); }}
                  >
                    <div className="repo-card-top">
                      <Icon name="repo" size={16} />
                      <span className="repo-card-id">{r.repo_id}</span>
                      {active ? <span className="badge badge-accent">selected</span> : null}
                    </div>
                    <div className="repo-card-path mono">{r.repo_path}</div>
                    <div className="repo-card-foot">
                      <span>{r.chunks != null ? `${Number(r.chunks).toLocaleString()} chunks` : "chunks unknown"}</span>
                      {r.seeded ? <span className="badge">from store</span> : <span className="badge">this session</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Recent questions</h3>
            <Icon name="history" size={15} className="muted" />
          </div>
          {recent.length === 0 ? (
            <div className="empty-mini">
              <Icon name="ask" size={18} />
              <span>Your questions will appear here.</span>
            </div>
          ) : (
            <ul className="recent">
              {recent.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <button className="recent-item" onClick={() => navigate("ask")} type="button">
                    <span className={`recent-dot ${r.ok ? "ok" : "bad"}`} />
                    <span className="recent-q">{r.question}</span>
                    <span className="recent-repos">{r.repoIds.map((x) => fileName(x)).join(", ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel col-span-3">
          <div className="panel-head">
            <h3>Capabilities</h3>
          </div>
          <div className="cap-grid">
            {[
              { icon: "ask", view: "ask", title: "Ask RepoSage", body: "Grounded answers with citations across one or many repositories." },
              { icon: "search", view: "search", title: "Code Search", body: "Source-aware retrieval that surfaces the exact files backing a result." },
              { icon: "graph", view: "graph", title: "Dependency Graph", body: "Inspect callers and callees for any function or method." },
              { icon: "impact", view: "impact", title: "Impact Analysis", body: "See the blast radius of changing a symbol before you touch it." },
            ].map((c) => (
              <button key={c.view} className="cap" onClick={() => navigate(c.view)} type="button">
                <div className="cap-ic"><Icon name={c.icon} size={18} /></div>
                <div className="cap-title">{c.title}</div>
                <div className="cap-body">{c.body}</div>
                <div className="cap-go"><Icon name="arrowRight" size={15} /></div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
