import React from "react";
import Icon from "./Icon.jsx";
import RepoSelector from "./RepoSelector.jsx";
import { VIEW_MAP } from "../lib/nav.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

export default function TopBar({ activeView, onToggleSidebar, onOpenCommand, onOpenSettings, onAddRepo }) {
  const view = VIEW_MAP[activeView] || VIEW_MAP.overview;
  const { backend } = useWorkspace();
  const state = backend.status === "online" ? "online" : backend.status === "offline" ? "offline" : "checking";

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onToggleSidebar} title="Toggle sidebar" type="button" aria-label="Toggle sidebar">
        <Icon name="sidebar" size={18} />
      </button>
      <div className="topbar-title">
        <h2>{view.title}</h2>
        <span>{view.subtitle}</span>
      </div>

      <div className="topbar-spacer" />

      <RepoSelector onAddRepo={onAddRepo} />

      <button className="cmdk-btn" onClick={onOpenCommand} type="button" title="Command palette">
        <Icon name="search" size={15} />
        <span className="search-hint">Search & commands</span>
        <kbd>⌘K</kbd>
      </button>

      <button className="icon-btn" title={`API status: ${state}`} type="button" aria-label="API status" onClick={onOpenSettings}>
        <span className="status-dot" data-state={state} />
      </button>

      <button className="icon-btn" onClick={onOpenSettings} title="Settings" type="button" aria-label="Settings">
        <Icon name="settings" size={17} />
      </button>
    </header>
  );
}
