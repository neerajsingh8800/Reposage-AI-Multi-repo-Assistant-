import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../lib/api.js";

const WorkspaceContext = createContext(null);

// The backend has no "list repos" endpoint, so the frontend tracks the set of
// repositories the user has connected this session. We seed with the known demo
// repo recorded in backend/repo_store.json (sample_demo -> sample_repo) so the
// workspace is usable immediately without fabricating anything.
const REPOS_KEY = "reposage.repos";
const DEFAULT_REPOS = [{ repo_id: "sample_demo", repo_path: "sample_repo", chunks: null, seeded: true }];

function loadRepos() {
  try {
    const raw = localStorage.getItem(REPOS_KEY);
    if (!raw) return DEFAULT_REPOS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_REPOS;
  } catch {
    return DEFAULT_REPOS;
  }
}

function saveRepos(repos) {
  try {
    localStorage.setItem(REPOS_KEY, JSON.stringify(repos));
  } catch {
    /* ignore */
  }
}

export function WorkspaceProvider({ children }) {
  const [repos, setRepos] = useState(loadRepos);
  const [selectedRepoIds, setSelectedRepoIds] = useState(() => {
    const initial = loadRepos();
    return initial.length ? [initial[0].repo_id] : [];
  });
  const [backend, setBackend] = useState({ status: "checking", project: null, error: null });
  const [recent, setRecent] = useState([]); // { id, question, repoIds, ts, ok }

  useEffect(() => saveRepos(repos), [repos]);

  // Health polling.
  const checkHealth = useCallback(async () => {
    setBackend((b) => (b.status === "checking" ? b : { ...b, status: b.status === "online" ? "online" : "checking" }));
    try {
      const res = await api.health({ timeout: 8000 });
      setBackend({ status: "online", project: res?.project || "RepoSage", error: null });
    } catch (err) {
      setBackend({
        status: "offline",
        project: null,
        error: err instanceof ApiError ? err.message : "Backend unreachable",
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, 20000);
    return () => clearInterval(t);
  }, [checkHealth]);

  const selectedRepos = useMemo(
    () => repos.filter((r) => selectedRepoIds.includes(r.repo_id)),
    [repos, selectedRepoIds]
  );

  const toggleRepo = useCallback((id) => {
    setSelectedRepoIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    );
  }, []);

  const selectOnly = useCallback((id) => setSelectedRepoIds([id]), []);

  const connectRepo = useCallback(async (repoPath, repoId) => {
    const res = await api.connectRepo(repoPath, repoId);
    setRepos((cur) => {
      const without = cur.filter((r) => r.repo_id !== res.repo_id);
      return [...without, { repo_id: res.repo_id, repo_path: res.repo_path, chunks: res.chunks, seeded: false }];
    });
    setSelectedRepoIds((cur) => (cur.includes(res.repo_id) ? cur : [...cur, res.repo_id]));
    return res;
  }, []);

  const removeRepo = useCallback(async (id) => {
    // Try the backend; regardless, drop it from local workspace tracking.
    try {
      await api.deleteRepo(id);
    } catch {
      /* keep local removal even if backend is unavailable */
    }
    setRepos((cur) => cur.filter((r) => r.repo_id !== id));
    setSelectedRepoIds((cur) => cur.filter((x) => x !== id));
  }, []);

  const addRecent = useCallback((entry) => {
    setRecent((cur) => [{ id: crypto.randomUUID?.() || String(Date.now()), ts: Date.now(), ...entry }, ...cur].slice(0, 25));
  }, []);

  const value = useMemo(
    () => ({
      repos,
      selectedRepoIds,
      selectedRepos,
      backend,
      recent,
      toggleRepo,
      selectOnly,
      setSelectedRepoIds,
      connectRepo,
      removeRepo,
      addRecent,
      refreshHealth: checkHealth,
    }),
    [repos, selectedRepoIds, selectedRepos, backend, recent, toggleRepo, selectOnly, connectRepo, removeRepo, addRecent, checkHealth]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
