// Minimal stroke-icon set (lucide-style geometry) rendered inline to avoid a dependency.
import React from "react";

const paths = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  ask: <><path d="M12 3a9 9 0 0 0-9 9c0 1.6.42 3.1 1.15 4.4L3 21l4.8-1.1A9 9 0 1 0 12 3Z" /><path d="M8.5 11.5h7M8.5 14h4.5" /></>,
  explorer: <><path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h4l2 2h7A1.5 1.5 0 0 1 19 7.5" /><path d="M3 6.5v11A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 19.5 8H4.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>,
  graph: <><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="18" r="2.5" /><path d="m8 7 2.5 9M16 9l-3 7M8 6h7.5" /></>,
  impact: <><path d="M12 3v4M12 3 9 6M12 3l3 3" /><circle cx="12" cy="11" r="2.4" /><path d="M12 13.4V16m0 0-4 3m4-3 4 3M8 19v0M16 19v0" /><circle cx="6" cy="20" r="1.6" /><circle cx="18" cy="20" r="1.6" /></>,
  repo: <><path d="M6 3h11a2 2 0 0 1 2 2v14.5a.5.5 0 0 1-.5.5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M5 17.5A2 2 0 0 1 7 16h12" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  command: <><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" /></>,
  settings: <><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.8 19.5l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9 4.6a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 15 4.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" /></>,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  arrowDown: <><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></>,
  check: <path d="m5 12 5 5L20 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  file: <><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2Z" /></>,
  fileCode: <><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2Z" /><path d="m10 12-2 2 2 2M14 12l2 2-2 2" /></>,
  folder: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h3.8l1.7 1.7H19.5A1.5 1.5 0 0 1 21 8.2v9.3A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5Z" />,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 4v4h-4" /></>,
  thumbUp: <><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" /><path d="M7 11l4-7a2 2 0 0 1 2 1.5V9h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 18.8 19H7" /></>,
  thumbDown: <><path d="M17 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1Z" /><path d="M17 13l-4 7a2 2 0 0 1-2-1.5V15H6a2 2 0 0 1-2-2.3l1.2-6A2 2 0 0 1 7.2 5H17" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  box: <><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9L12 3Z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  zap: <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" />,
  code: <><path d="m9 8-5 4 5 4M15 8l5 4-5 4" /></>,
  hash: <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />,
  activity: <path d="M3 12h4l2 7 4-16 2 9h6" />,
  cpu: <><rect x="7" y="7" width="10" height="10" rx="1.5" /><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" /></>,
  server: <><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 8v4l3 2" /></>,
  arrowUpRight: <path d="M7 17 17 7M8 7h9v9" />,
  send: <path d="M4 12 20 4l-7 16-2.5-6.5L4 12Z" />,
  branch: <><circle cx="6" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="7" r="2.4" /><path d="M6 8.4v7.2M6 12h6a3 3 0 0 0 3-3v-.6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M10.3 4 3.4 16a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  filter: <path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" />,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  sidebar: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></>,
  dot: <circle cx="12" cy="12" r="3" />,
};

export function Icon({ name, size = 16, strokeWidth = 1.7, className, style }) {
  const p = paths[name];
  if (!p) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {p}
    </svg>
  );
}

export default Icon;
