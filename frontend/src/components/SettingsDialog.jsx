import React, { useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { getApiBaseUrl, setApiBaseUrl } from "../lib/api.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

export default function SettingsDialog({ onClose }) {
  const { backend, refreshHealth, repos, removeRepo } = useWorkspace();
  const [url, setUrl] = useState(getApiBaseUrl());
  const [saved, setSaved] = useState(false);

  const save = () => {
    setApiBaseUrl(url.trim());
    setSaved(true);
    refreshHealth();
    setTimeout(() => setSaved(false), 1400);
  };

  const state = backend.status === "online" ? "online" : backend.status === "offline" ? "offline" : "checking";

  return (
    <Modal title="Settings" subtitle="Backend connection & workspace" onClose={onClose} width={520}>
      <div className="col gap-16">
        <div>
          <label className="field-label" htmlFor="api-url">Backend API URL</label>
          <div className="row gap-6">
            <input
              id="api-url"
              className="input mono"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:8000"
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            <button className="btn" onClick={save} type="button">{saved ? "Saved" : "Save"}</button>
          </div>
          <div className="row gap-6 mt-10" style={{ fontSize: 12 }}>
            <span className="status-dot" data-state={state} />
            <span className="muted">
              {backend.status === "online"
                ? `Connected to ${backend.project || "RepoSage"} API`
                : backend.status === "offline"
                ? backend.error || "Backend unreachable"
                : "Checking connection…"}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={refreshHealth} type="button" style={{ marginLeft: "auto" }}>
              <Icon name="refresh" size={13} /> Retry
            </button>
          </div>
        </div>

        <div className="divider" style={{ margin: "2px 0" }} />

        <div>
          <div className="field-label">Connected repositories</div>
          <div className="col gap-6">
            {repos.length === 0 && <span className="faint" style={{ fontSize: 12.5 }}>No repositories tracked.</span>}
            {repos.map((r) => (
              <div key={r.repo_id} className="row gap-10" style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                <Icon name="repo" size={15} style={{ color: "var(--text-muted)" }} />
                <div className="col" style={{ minWidth: 0 }}>
                  <span className="mono" style={{ fontSize: 12.5 }}>{r.repo_id}</span>
                  <span className="faint mono" style={{ fontSize: 10.5 }}>{r.repo_path}</span>
                </div>
                <button className="btn btn-danger btn-sm" style={{ marginLeft: "auto" }} onClick={() => removeRepo(r.repo_id)} type="button" title="Remove & delete index">
                  <Icon name="trash" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="row gap-6 faint" style={{ fontSize: 11.5, alignItems: "flex-start" }}>
          <Icon name="info" size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            RepoSage runs against the existing FastAPI backend. In this preview the Python backend may not be
            running — connection errors are expected until it is reachable at the URL above.
          </span>
        </div>
      </div>
    </Modal>
  );
}
