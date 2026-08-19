import React, { useMemo, useRef, useState } from "react";
import Icon from "../components/Icon.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { api, ApiError } from "../lib/api.js";
import { renderBlocks } from "../lib/format.js";
import { StateBlock, Thinking, Confidence, CopyButton, SourceItem, CodeRef } from "../components/common.jsx";

const SUGGESTIONS = [
  "How does authentication work in this codebase?",
  "Where is the payment amount validated?",
  "What happens when a new repository is connected?",
  "Explain the retrieval pipeline end to end.",
];

function Blocks({ text }) {
  const blocks = useMemo(() => renderBlocks(text), [text]);
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        if (b.type === "code") {
          return (
            <pre className="codeblock" key={i}>
              <div className="codeblock-bar">
                <span className="mono">{b.lang || "code"}</span>
                <CopyButton text={b.text} />
              </div>
              <code>{b.text}</code>
            </pre>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i}>
              {b.items.map((it, j) => (
                <li key={j}>{it}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{b.text}</p>;
      })}
    </div>
  );
}

function RepoAnswer({ result, onOpen, onGraph }) {
  const { repoId, data, error } = result;
  return (
    <div className="repo-answer">
      <div className="repo-answer-head">
        <Icon name="repo" size={14} />
        <span className="repo-answer-name">{repoId}</span>
        {data ? <Confidence value={data.confidence} /> : null}
      </div>
      {error ? (
        <div className="repo-answer-body">
          <StateBlock icon="alert" tone="danger" title="This repository could not answer">
            {error}
          </StateBlock>
        </div>
      ) : (
        <div className="repo-answer-body">
          <Blocks text={data.answer} />
          {Array.isArray(data.citations) && data.citations.length ? (
            <div className="sources">
              <div className="sources-head">
                <Icon name="layers" size={13} />
                <span>{data.citations.length} sources</span>
              </div>
              <div className="sources-list">
                {data.citations.map((c, i) => (
                  <SourceItem key={i} citation={c} repoId={repoId} onOpen={(cit) => onOpen(cit, repoId)} />
                ))}
              </div>
              <div className="row gap-8 wrap mt-10">
                {data.citations.map((c, i) => (
                  <CodeRef key={i} citation={c} onOpen={(cit) => onOpen(cit, repoId)} />
                ))}
              </div>
            </div>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>No citations were returned for this answer.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AskView({ openInExplorer, onAddRepo }) {
  const { selectedRepos, selectedRepoIds, backend, addRecent } = useWorkspace();
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState([]); // { id, question, repoIds, results, loading }
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const canAsk = selectedRepoIds.length > 0 && question.trim().length > 0 && !loading;

  const ask = async (q) => {
    const text = (q ?? question).trim();
    if (!text || !selectedRepoIds.length || loading) return;
    setQuestion("");
    setLoading(true);
    const entryId = crypto.randomUUID?.() || String(Date.now());
    const repoIds = [...selectedRepoIds];
    setThread((t) => [...t, { id: entryId, question: text, repoIds, results: null, loading: true }]);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));

    const results = await Promise.all(
      repoIds.map(async (repoId) => {
        try {
          const data = await api.query(repoId, text);
          return { repoId, data, error: null };
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : "Unexpected error";
          return { repoId, data: null, error: msg };
        }
      })
    );

    const ok = results.some((r) => r.data);
    setThread((t) => t.map((e) => (e.id === entryId ? { ...e, results, loading: false } : e)));
    addRecent({ question: text, repoIds, ok });
    setLoading(false);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: "smooth" }));
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      e.preventDefault();
      if (canAsk) ask();
    }
  };

  const empty = thread.length === 0;

  return (
    <div className="ask">
      <div className="ask-scroll" ref={scrollRef}>
        <div className="ask-inner">
          {selectedRepoIds.length === 0 ? (
            <StateBlock
              icon="repo"
              title="Select at least one repository"
              action={
                <button className="btn btn-primary btn-sm" onClick={onAddRepo} type="button">
                  <Icon name="plus" size={14} /> Connect a repository
                </button>
              }
            >
              Use the repository selector in the top bar to choose which codebases RepoSage should reason over. You can select more than one to compare answers side by side.
            </StateBlock>
          ) : null}

          {empty && selectedRepoIds.length > 0 ? (
            <div className="ask-hero">
              <div className="ask-hero-badge">
                <Icon name="ask" size={22} />
              </div>
              <h2>Ask across {selectedRepos.length === 1 ? "1 repository" : `${selectedRepos.length} repositories`}</h2>
              <p className="muted">
                RepoSage retrieves the most relevant code and answers with grounded citations you can open directly in the Code Explorer.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="suggestion" onClick={() => ask(s)} type="button" disabled={backend.status === "offline"}>
                    <Icon name="arrowUpRight" size={14} />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
              {backend.status === "offline" ? (
                <p className="muted mt-10" style={{ fontSize: 12.5 }}>
                  The backend is currently offline, so questions cannot be answered yet. Configure the API URL in Settings.
                </p>
              ) : null}
            </div>
          ) : null}

          {thread.map((entry) => (
            <div className="turn" key={entry.id}>
              <div className="turn-q">
                <div className="avatar">You</div>
                <div className="turn-q-body">
                  <p>{entry.question}</p>
                  <div className="turn-q-meta">
                    {entry.repoIds.map((r) => (
                      <span className="chip chip-mini" key={r}>
                        <Icon name="repo" size={11} /> {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="turn-a">
                {entry.loading ? (
                  <div className="turn-a-loading">
                    <Thinking label={`Querying ${entry.repoIds.length} ${entry.repoIds.length === 1 ? "repository" : "repositories"}`} />
                  </div>
                ) : (
                  <div className={`answers ${entry.results.length > 1 ? "answers-multi" : ""}`}>
                    {entry.results.map((r) => (
                      <RepoAnswer key={r.repoId} result={r} onOpen={openInExplorer} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="composer">
        <div className="composer-inner">
          <textarea
            ref={inputRef}
            className="composer-input"
            placeholder={selectedRepoIds.length ? "Ask anything about the selected repositories…" : "Select a repository to begin…"}
            value={question}
            rows={1}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={selectedRepoIds.length === 0}
          />
          <div className="composer-actions">
            <span className="muted composer-hint">
              {selectedRepoIds.length} selected · Enter to send
            </span>
            <button className="btn btn-primary btn-sm" onClick={() => ask()} disabled={!canAsk} type="button">
              <Icon name="send" size={14} /> Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
