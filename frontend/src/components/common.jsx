import React, { useState } from "react";
import Icon from "./Icon.jsx";
import { parseCitation, fileName, fileDir, lineLabel } from "../lib/format.js";

export function StateBlock({ icon = "info", tone, title, children, action }) {
  return (
    <div className="state" data-tone={tone}>
      <div className="state-ic">
        <Icon name={icon} size={20} />
      </div>
      <h4>{title}</h4>
      {children ? <p>{children}</p> : null}
      {action ? <div className="mt-10">{action}</div> : null}
    </div>
  );
}

export function Thinking({ label = "Analyzing repository" }) {
  return (
    <span className="row gap-10" role="status">
      <span className="thinking" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="muted" style={{ fontSize: 13 }}>
        {label}
      </span>
    </span>
  );
}

export function Skeleton({ height = 12, width = "100%", style }) {
  return <div className="skeleton" style={{ height, width, ...style }} />;
}

export function Confidence({ value }) {
  const pct = Math.max(0, Math.min(1, Number(value) || 0));
  const tone = pct >= 0.7 ? "var(--success)" : pct >= 0.4 ? "var(--warning)" : "var(--danger)";
  return (
    <span className="confidence" title="Model-reported confidence">
      <span>Confidence</span>
      <span className="bar">
        <i style={{ width: `${pct * 100}%`, background: tone }} />
      </span>
      <span className="mono tabnums" style={{ color: "var(--text)" }}>
        {Math.round(pct * 100)}%
      </span>
    </span>
  );
}

export function CopyButton({ text, label = "Copy", small = true }) {
  const [done, setDone] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch {
      /* ignore */
    }
  };
  return (
    <button className={`btn btn-ghost ${small ? "btn-sm" : ""}`} onClick={onCopy} type="button">
      <Icon name={done ? "check" : "copy"} size={14} />
      {done ? "Copied" : label}
    </button>
  );
}

// A clickable code reference derived from a citation string (e.g. "payments.py:14-28").
export function CodeRef({ citation, onOpen }) {
  const cit = typeof citation === "string" ? parseCitation(citation) : citation;
  const line = lineLabel(cit);
  return (
    <button className="coderef" type="button" onClick={() => onOpen?.(cit)}>
      <Icon name="fileCode" size={14} className="ic" />
      <span className="file">{cit.file}</span>
      {line ? <span className="lines">{line}</span> : null}
    </button>
  );
}

export function SourceItem({ citation, repoId, onOpen }) {
  const cit = typeof citation === "string" ? parseCitation(citation) : citation;
  const line = lineLabel(cit);
  const dir = fileDir(cit.file);
  return (
    <div className="source-item" role="button" tabIndex={0} onClick={() => onOpen?.(cit)}
      onKeyDown={(e) => (e.key === "Enter" ? onOpen?.(cit) : null)}>
      <div className="top">
        <Icon name="fileCode" size={14} style={{ color: "var(--text-faint)" }} />
        <span className="fname">{fileName(cit.file)}</span>
        {line ? <span className="lines" style={{ marginLeft: "auto" }}>{line}</span> : null}
      </div>
      <div className="meta">
        {dir ? <span className="mono">{dir}/</span> : <span>&nbsp;</span>}
        {repoId ? <span className="badge">{repoId}</span> : null}
      </div>
    </div>
  );
}
