import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import { VIEWS } from "../lib/nav.js";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

export default function CommandPalette({ onClose, onNavigate, onAddRepo, onOpenSettings }) {
  const { repos, selectOnly, toggleRepo, selectedRepoIds } = useWorkspace();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = useMemo(() => {
    const nav = VIEWS.map((v) => ({
      group: "Go to",
      id: `nav:${v.id}`,
      label: v.label,
      hint: "View",
      icon: v.icon,
      run: () => onNavigate(v.id),
    }));
    const actions = [
      { group: "Actions", id: "act:connect", label: "Connect repository", hint: "Index", icon: "plus", run: onAddRepo },
      { group: "Actions", id: "act:ask", label: "Ask RepoSage a question", hint: "Query", icon: "ask", run: () => onNavigate("ask") },
      { group: "Actions", id: "act:impact", label: "Run impact analysis", hint: "Graph", icon: "impact", run: () => onNavigate("impact") },
      { group: "Actions", id: "act:settings", label: "Open settings", hint: "Config", icon: "settings", run: onOpenSettings },
    ];
    const repoCmds = repos.map((r) => ({
      group: "Repositories",
      id: `repo:${r.repo_id}`,
      label: r.repo_id,
      hint: selectedRepoIds.includes(r.repo_id) ? "In context" : "Focus",
      icon: "repo",
      run: () => selectOnly(r.repo_id),
      alt: () => toggleRepo(r.repo_id),
    }));
    return [...nav, ...actions, ...repoCmds];
  }, [repos, selectedRepoIds, onNavigate, onAddRepo, onOpenSettings, selectOnly, toggleRepo]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(s) || c.group.toLowerCase().includes(s));
  }, [q, commands]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => inputRef.current?.focus(), []);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((c, i) => {
      (g[c.group] = g[c.group] || []).push({ ...c, index: i });
    });
    return g;
  }, [filtered]);

  const runAt = (i) => {
    const cmd = filtered[i];
    if (!cmd) return;
    cmd.run?.();
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(active);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="cmdk-input">
          <Icon name="search" size={18} style={{ color: "var(--text-faint)" }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search views, repositories and commands…"
            aria-label="Command search"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="cmdk-empty">No matching commands</div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="cmdk-group-label">{group}</div>
                {items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="cmdk-item"
                    data-idx={c.index}
                    data-active={c.index === active}
                    onMouseEnter={() => setActive(c.index)}
                    onClick={() => runAt(c.index)}
                  >
                    <Icon name={c.icon} size={16} className="ic" />
                    <span>{c.label}</span>
                    <span className="sub">{c.hint}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
