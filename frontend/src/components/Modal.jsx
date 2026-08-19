import React, { useEffect } from "react";
import Icon from "./Icon.jsx";

export default function Modal({ title, subtitle, onClose, children, footer, width = 460 }) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="cmdk"
        style={{ top: "18vh", width: `min(${width}px, calc(100vw - 32px))` }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cmdk-input" style={{ justifyContent: "space-between" }}>
          <div className="col" style={{ gap: 2 }}>
            <strong style={{ fontSize: 14.5, fontWeight: 600 }}>{title}</strong>
            {subtitle && <span className="faint" style={{ fontSize: 12 }}>{subtitle}</span>}
          </div>
          <button className="icon-btn" onClick={onClose} type="button" aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
        {footer && (
          <div className="row" style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", justifyContent: "flex-end", gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
