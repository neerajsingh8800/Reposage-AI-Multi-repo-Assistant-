import React, { useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icon.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { ApiError } from "../lib/api.js";

export default function AddRepoDialog({ onClose }) {
  const { connectRepo } = useWorkspace();
  const [path, setPath] = useState("");
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  const submit = async () => {
    if (!path.trim() || busy) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await connectRepo(path.trim(), id.trim() || undefined);
      setOk(res);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to connect repository.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Connect repository"
      subtitle="Index a repository through the RepoSage backend"
      onClose={onClose}
      width={480}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || !path.trim()} type="button">
            {busy ? "Indexing…" : "Connect & index"}
          </button>
        </>
      }
    >
      <div className="col gap-16">
        <div>
          <label className="field-label" htmlFor="repo-path">Repository path <span className="faint">(required)</span></label>
          <input
            id="repo-path"
            className="input mono"
            placeholder="e.g. sample_repo"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
        </div>
        <div>
          <label className="field-label" htmlFor="repo-id">Repository ID <span className="faint">(optional)</span></label>
          <input
            id="repo-id"
            className="input mono"
            placeholder="Defaults to the folder name"
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        <div className="row gap-6 faint" style={{ fontSize: 11.5, alignItems: "flex-start" }}>
          <Icon name="info" size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>
            The path is resolved on the machine running the FastAPI backend. RepoSage will chunk and embed the
            repository — this may take a moment on first index.
          </span>
        </div>

        {error && (
          <div className="row gap-10" style={{ padding: "10px 12px", borderRadius: 8, background: "var(--danger-soft)", border: "1px solid rgba(240,98,90,0.3)", color: "var(--danger)", fontSize: 12.5, alignItems: "flex-start" }}>
            <Icon name="alert" size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {ok && (
          <div className="row gap-10" style={{ padding: "10px 12px", borderRadius: 8, background: "var(--success-soft)", border: "1px solid rgba(63,185,80,0.3)", color: "var(--success)", fontSize: 12.5 }}>
            <Icon name="check" size={15} />
            <span>Indexed <b className="mono">{ok.repo_id}</b> — {ok.chunks} chunks.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
