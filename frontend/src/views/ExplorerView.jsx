import React, { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { fileName, fileDir, lineLabel } from "../lib/format.js";
import { StateBlock, CopyButton } from "../components/common.jsx";

// Build a lightweight tree from a flat list of "repoId/file" references.
function buildTree(refs) {
  const root = {};
  for (const ref of refs) {
    const segs = [ref.repoId, ...ref.file.split("/")];
    let node = root;
    segs.forEach((seg, idx) => {
      const isLeaf = idx === segs.length - 1;
      node[seg] = node[seg] || { __meta: isLeaf ? ref : null, __children: {} };
      if (isLeaf) node[seg].__meta = ref;
      node = node[seg].__children;
    });
  }
  return root;
}

function TreeNode({ name, node, depth, onSelect, activeKey }) {
  const [open, setOpen] = useState(true);
  const children = Object.entries(node.__children || {});
  const isFile = children.length === 0 && node.__meta;
  if (isFile) {
    const ref = node.__meta;
    const active = ref.key === activeKey;
    return (
      <button
        className="tree-file"
        data-active={active}
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => onSelect(ref)}
        type="button"
      >
        <Icon name="fileCode" size={14} />
        <span>{name}</span>
        {ref.line ? <span className="tree-lines mono">{ref.line}</span> : null}
      </button>
    );
  }
  return (
    <div className="tree-group">
      <button className="tree-dir" style={{ paddingLeft: 10 + depth * 14 }} onClick={() => setOpen((o) => !o)} type="button">
        <Icon name={open ? "chevronDown" : "chevronRight"} size={13} />
        <Icon name={depth === 0 ? "repo" : "folder"} size={14} />
        <span>{name}</span>
      </button>
      {open
        ? children.map(([childName, child]) => (
            <TreeNode key={childName} name={childName} node={child} depth={depth + 1} onSelect={onSelect} activeKey={activeKey} />
          ))
        : null}
    </div>
  );
}

export default function ExplorerView({ explorerTarget, openInGraph, openInImpact }) {
  const { repos } = useWorkspace();
  const [refs, setRefs] = useState([]);
  const [active, setActive] = useState(null);

  // Add any incoming target (from Ask/Search) to the referenced-file list.
  useEffect(() => {
    if (!explorerTarget) return;
    const key = `${explorerTarget.repoId}:${explorerTarget.file}:${explorerTarget.start ?? ""}`;
    const ref = {
      key,
      repoId: explorerTarget.repoId,
      file: explorerTarget.file,
      start: explorerTarget.start,
      end: explorerTarget.end,
      line: lineLabel(explorerTarget),
    };
    setRefs((cur) => (cur.some((r) => r.key === key) ? cur : [ref, ...cur]));
    setActive(ref);
  }, [explorerTarget]);

  const tree = useMemo(() => buildTree(refs), [refs]);
  const treeEntries = Object.entries(tree);

  const symbolGuess = active ? fileName(active.file).replace(/\.[^.]+$/, "") : "";

  return (
    <div className="page explorer">
      <div className="explorer-layout">
        <aside className="explorer-tree">
          <div className="explorer-tree-head">
            <span>Referenced files</span>
            {refs.length ? <span className="badge">{refs.length}</span> : null}
          </div>
          {refs.length === 0 ? (
            <div className="explorer-tree-empty">
              <Icon name="folder" size={18} />
              <p>Open a citation from Ask or Search and it will appear here.</p>
            </div>
          ) : (
            <div className="tree">
              {treeEntries.map(([name, node]) => (
                <TreeNode key={name} name={name} node={node} depth={0} onSelect={setActive} activeKey={active?.key} />
              ))}
            </div>
          )}
        </aside>

        <section className="explorer-main">
          {!active ? (
            <div className="explorer-placeholder">
              <StateBlock icon="explorer" title="No file selected">
                RepoSage grounds every answer in specific source locations. Open a cited reference from the Ask or Search views to inspect it here.
              </StateBlock>
            </div>
          ) : (
            <>
              <div className="explorer-file-head">
                <div className="explorer-file-title">
                  <Icon name="fileCode" size={16} />
                  <span className="mono">{active.file}</span>
                  {active.line ? <span className="badge badge-accent">{active.line}</span> : null}
                </div>
                <div className="row gap-8">
                  <CopyButton text={active.file} label="Copy path" />
                </div>
              </div>
              <div className="explorer-file-meta">
                <div className="kv"><span className="muted">Repository</span><span className="mono">{active.repoId}</span></div>
                <div className="kv"><span className="muted">Directory</span><span className="mono">{fileDir(active.file) || "(root)"}</span></div>
                <div className="kv"><span className="muted">Lines</span><span className="mono">{active.start ? `${active.start}–${active.end}` : "not specified"}</span></div>
              </div>

              <div className="explorer-region">
                <div className="explorer-region-bar">
                  <Icon name="code" size={14} />
                  <span>Cited region</span>
                </div>
                <div className="explorer-region-body">
                  {active.start ? (
                    <div className="linecol">
                      {Array.from({ length: (active.end - active.start) + 1 }).slice(0, 40).map((_, i) => (
                        <div className="linecol-row" key={i}>
                          <span className="linecol-n mono">{active.start + i}</span>
                          <span className="linecol-bar" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">This citation references the whole file without a specific line range.</p>
                  )}
                  <p className="explorer-note">
                    <Icon name="info" size={13} />
                    The RepoSage API returns citation locations rather than raw file text, so line contents aren&apos;t rendered here. Use these coordinates to open <span className="mono">{active.file}</span> in your editor.
                  </p>
                </div>
              </div>

              <div className="explorer-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openInGraph(symbolGuess, active.repoId)} type="button">
                  <Icon name="graph" size={14} /> View in dependency graph
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => openInImpact(symbolGuess, active.repoId)} type="button">
                  <Icon name="impact" size={14} /> Analyze impact
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
