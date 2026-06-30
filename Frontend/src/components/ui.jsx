import { LOT_STATUS } from "../api/constants";

export function StatusPill({ status }) {
  const meta = LOT_STATUS[status] || { label: status, tone: "ok" };
  return <span className={`pill pill--${meta.tone}`}>{meta.label}</span>;
}

export function Banner({ tone = "warn", title, children }) {
  return (
    <div className={`banner banner--${tone}`} role="status">
      {title && <strong className="banner__title">{title}</strong>}
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ label = "Chargement…" }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__dot" />
      <span className="spinner__dot" />
      <span className="spinner__dot" />
      <span className="spinner__label">{label}</span>
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
