import { ALERT_TYPE } from "../api/constants";
import { EmptyState } from "./ui";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "il y a moins d'1 h";
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default function AlertPanel({ alerts, onResolve }) {
  return (
    <div className="alertpanel">
      <div className="alertpanel__head">
        <h2>Alertes actives</h2>
        <span className="alertpanel__badge">{alerts.length}</span>
      </div>

      {alerts.length === 0 ? (
        <EmptyState title="Tout est conforme">
          Aucune dérive de conditions ni lot périmé en attente.
        </EmptyState>
      ) : (
        <ul className="alertlist">
          {alerts.map((a) => {
            const meta = ALERT_TYPE[a.type] || { label: a.type };
            return (
              <li key={a.id} className={`alertcard alertcard--${a.type}`}>
                <div className="alertcard__top">
                  <span className="alertcard__type">{meta.label}</span>
                  <span className="alertcard__time">{timeAgo(a.triggeredAt)}</span>
                </div>
                <p className="alertcard__detail">{a.details}</p>
                <div className="alertcard__meta">
                  <span>{a.warehouseName}</span>
                  {a.lotCode && <span className="mono">· {a.lotCode}</span>}
                </div>
                <div className="alertcard__foot">
                  <span
                    className={`mailflag ${a.emailSent ? "is-sent" : ""}`}
                    title={
                      a.emailSent
                        ? "Email envoyé au responsable d'exploitation"
                        : "Email non envoyé"
                    }
                  >
                    {a.emailSent ? "✓ Email envoyé" : "Email en attente"}
                  </span>
                  <button
                    className="btn btn--small"
                    onClick={() => onResolve(a.id)}
                  >
                    Marquer résolue
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
