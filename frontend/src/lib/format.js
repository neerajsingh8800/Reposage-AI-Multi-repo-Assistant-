// Helpers for parsing the string shapes returned by the backend.

// Citations look like "payments.py:14-28" or "models/payment.py:31" or bare "utils.py".
export function parseCitation(raw) {
  if (typeof raw !== "string") return { file: String(raw), start: null, end: null, raw: String(raw) };
  const m = raw.match(/^(.*?):(\d+)(?:-(\d+))?$/);
  if (!m) return { file: raw.trim(), start: null, end: null, raw };
  return {
    file: m[1].trim(),
    start: Number(m[2]),
    end: m[3] ? Number(m[3]) : Number(m[2]),
    raw,
  };
}

export function fileName(path) {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1];
}

export function fileDir(path) {
  if (!path) return "";
  const parts = path.split("/");
  parts.pop();
  return parts.join("/");
}

export function lineLabel(cit) {
  if (cit.start == null) return null;
  return cit.start === cit.end ? `L${cit.start}` : `L${cit.start}–${cit.end}`;
}

// Graph node ids look like "payments.py::PaymentService.process_payment" or "utils.py::helper".
export function parseNode(raw) {
  if (typeof raw !== "string") return { file: "", symbol: String(raw), raw: String(raw) };
  const idx = raw.indexOf("::");
  if (idx === -1) return { file: "", symbol: raw, raw };
  return {
    file: raw.slice(0, idx),
    symbol: raw.slice(idx + 2),
    raw,
  };
}

// Extract a bare symbol name from various inputs ("Class.method" -> "method-ish" kept whole).
export function symbolFromNode(raw) {
  return parseNode(raw).symbol;
}

// Very small, safe markdown -> HTML-ish renderer replacement is avoided; instead we
// return structured tokens for React rendering (paragraphs + inline code + fenced code).
export function renderBlocks(text) {
  if (!text) return [];
  const blocks = [];
  const lines = String(text).split("\n");
  let i = 0;
  let para = [];
  let list = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ") });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "ul", items: list });
      list = null;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      flushPara();
      flushList();
      const lang = line.trim().replace(/```/g, "").trim();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({ type: "code", lang, text: code.join("\n") });
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet || ordered) {
      flushPara();
      list = list || [];
      list.push((bullet ? bullet[1] : ordered[1]).trim());
      i++;
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      flushList();
      i++;
      continue;
    }
    flushList();
    para.push(line.trim());
    i++;
  }
  flushPara();
  flushList();
  return blocks;
}
