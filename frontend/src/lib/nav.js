export const VIEWS = [
  { id: "overview", label: "Overview", icon: "overview", title: "Overview", subtitle: "Engineering workspace status" },
  { id: "ask", label: "Ask RepoSage", icon: "ask", title: "Ask RepoSage", subtitle: "Understand your codebase across repositories" },
  { id: "explorer", label: "Code Explorer", icon: "explorer", title: "Code Explorer", subtitle: "Browse files referenced by RepoSage" },
  { id: "search", label: "Search", icon: "search", title: "Code Search", subtitle: "Source-aware retrieval across repositories" },
  { id: "graph", label: "Dependency Graph", icon: "graph", title: "Dependency Graph", subtitle: "Callers, callees and relationships" },
  { id: "impact", label: "Impact Analysis", icon: "impact", title: "Impact Analysis", subtitle: "Blast radius of a change" },
];

export const VIEW_MAP = Object.fromEntries(VIEWS.map((v) => [v.id, v]));
