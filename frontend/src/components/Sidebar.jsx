import React from "react";
import Icon from "./Icon.jsx";
import { VIEWS } from "../lib/nav.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

export default function Sidebar({ activeView, onNavigate, collapsed, onAddRepo, onOpenSettings, onOpenCommand }) {
  const { repos, selectedRepoIds, toggleRepo, backend } = useWorkspace();

  const statusState =
    backend.status === "online" ? "online" : backend.status === "offline" ? "offline" : "checking";
  const statusLabel =
    backend.status === "online" ? "Backend online" : backend.status === "offline" ? "Backend offline" : "Connecting…";

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar-head">
        <span className="brand-mark" aria-hidden="true">
          <Icon name="branch" size={16} />
        </span>
        {!collapsed && (
          <span className="brand-word">
            Repo<b>Sage</b>
          </span>
        )}
      </div>

      <div className="sidebar-scroll">
        <div className="nav-group">
          {!collapsed && <div className="nav-label">Workspace</div>}
          {VIEWS.map((v) => (
            <button
              key={v.id}
              className="nav-item"
              data-active={activeView === v.id}
              onClick={() => onNavigate(v.id)}
              title={v.label}
              type="button"
            >
              <Icon name={v.icon} size={17} />
              {!collapsed && <span className="nav-text">{v.label}</span>}
            </button>
          ))}
        </div>

        <div className="nav-group">
          {!collapsed && (
            <div className="nav-label row" style={{ justifyContent: "space-between" }}>
              <span>Repositories</span>
              <span className="mono" style={{ color: "var(--text-faint)" }}>
                {selectedRepoIds.length}/{repos.length}
              </span>
            </div>
          )}
          {repos.map((r) => {
            const selected = selectedRepoIds.includes(r.repo_id);
            return (
              <button
                key={r.repo_id}
                className="repo-nav-item"
                data-selected={selected}
                onClick={() => toggleRepo(r.repo_id)}
                title={`${r.repo_id} — ${selected ? "in context" : "click to add to context"}`}
                type="button"
              >
                <span className="repo-dot" />
                {!collapsed && (
                  <>
                    <span className="repo-nav-name">{r.repo_id}</span>
                    {r.chunks != null && <span className="chunks">{r.chunks}</span>}
                  </>
                )}
              </button>
            );
          })}
          <button className="repo-nav-item" onClick={onAddRepo} title="Connect repository" type="button">
            <span style={{ width: 7, display: "grid", placeItems: "center", color: "var(--text-faint)" }}>
              <Icon name="plus" size={13} />
            </span>
            {!collapsed && <span className="repo-nav-name" style={{ color: "var(--text-muted)" }}>Connect repository</span>}
          </button>
        </div>

        <div className="nav-group">
          {!collapsed && <div className="nav-label">Utilities</div>}
          <button className="nav-item" onClick={onOpenCommand} title="Command palette" type="button">
            <Icon name="command" size={17} />
            {!collapsed && (
              <>
                <span className="nav-text">Command Palette</span>
                <kbd className="nav-badge">⌘K</kbd>
              </>
            )}
          </button>
          <button className="nav-item" onClick={onOpenSettings} title="Settings" type="button">
            <Icon name="settings" size={17} />
            {!collapsed && <span className="nav-text">Settings</span>}
          </button>
        </div>
      </div>

      <div className="sidebar-foot">
        {collapsed ? (
          <div className="row" style={{ justifyContent: "center" }} title={statusLabel}>
            <span className="status-dot" data-state={statusState} />
          </div>
        ) : (
          <div className="status-row">
            <span className="status-dot" data-state={statusState} />
            <span className="label">{statusLabel}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
