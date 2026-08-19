// RepoSage API client.
// Talks to the existing FastAPI backend. No contracts are changed here — this
// only mirrors the real endpoints exposed by backend/main.py:
//   GET    /health
//   POST   /repos/connect   { repo_path, repo_id? }        -> { repo_id, repo_path, chunks }
//   POST   /query           { repo_id, question }           -> { answer, citations[], confidence }
//   GET    /graph/{repo_id}/{function_name}                 -> { callers[], callees[], blast_radius{} }
//   DELETE /repos/{repo_id}                                 -> { deleted }

const STORAGE_KEY = "reposage.apiBaseUrl";

function defaultBaseUrl() {
  const env = import.meta.env?.VITE_API_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  return "http://localhost:8000";
}

export function getApiBaseUrl() {
  try {
    return (localStorage.getItem(STORAGE_KEY) || defaultBaseUrl()).replace(/\/$/, "");
  } catch {
    return defaultBaseUrl();
  }
}

export function setApiBaseUrl(url) {
  try {
    localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ""));
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(message, { status, kind } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    // kind: "network" (backend unreachable) | "http" (backend responded with error)
    this.kind = kind || "http";
  }
}

async function request(path, { method = "GET", body, signal, timeout = 45000 } = {}) {
  const url = `${getApiBaseUrl()}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener("abort", onAbort);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
    // Fetch throwing means the backend is unreachable (network / CORS / down).
    throw new ApiError(
      "Could not reach the RepoSage backend. Make sure the FastAPI server is running and the API URL is correct.",
      { kind: "network" }
    );
  }
  clearTimeout(timer);
  if (signal) signal.removeEventListener("abort", onAbort);

  let payload = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }

  if (!res.ok) {
    const detail =
      (payload && (payload.detail || payload.message)) || `Request failed (${res.status})`;
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), {
      status: res.status,
      kind: "http",
    });
  }
  return payload;
}

export const api = {
  health: (opts) => request("/health", opts),
  connectRepo: (repo_path, repo_id, opts) =>
    request("/repos/connect", { method: "POST", body: { repo_path, repo_id: repo_id || undefined }, ...opts }),
  query: (repo_id, question, opts) =>
    request("/query", { method: "POST", body: { repo_id, question }, ...opts }),
  graph: (repo_id, function_name, opts) =>
    request(`/graph/${encodeURIComponent(repo_id)}/${encodeURIComponent(function_name)}`, opts),
  deleteRepo: (repo_id, opts) =>
    request(`/repos/${encodeURIComponent(repo_id)}`, { method: "DELETE", ...opts }),
};
