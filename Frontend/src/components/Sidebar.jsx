import { TEMP_TOLERANCE, HUMIDITY_TOLERANCE } from "../api/constants";

export default function Sidebar({
  country,
  conditions,
  exploitations,
  selectedExploitation,
  selectedWarehouse,
  onSelectExploitation,
  onSelectWarehouse,
  activeAlertCount,
}) {
  const current = exploitations.find((e) => e.name === selectedExploitation);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand__mark">◗</span>
        <span className="brand__name">FutureKawa</span>
      </div>

      <div className="sidebar__section">
        <p className="sidebar__label">Exploitation</p>
        <nav className="navlist">
          <button
            className={`navlist__item ${!selectedExploitation ? "is-active" : ""}`}
            onClick={() => onSelectExploitation(null)}
          >
            Toutes les exploitations
          </button>
          {exploitations.map((exp) => (
            <button
              key={exp.name}
              className={`navlist__item ${
                selectedExploitation === exp.name ? "is-active" : ""
              }`}
              onClick={() => onSelectExploitation(exp.name)}
            >
              {exp.name}
              <span className="navlist__count">{exp.warehouses.length}</span>
            </button>
          ))}
          {exploitations.length === 0 && (
            <p className="sidebar__hint">Aucune donnée chargée.</p>
          )}
        </nav>
      </div>

      {current && (
        <div className="sidebar__section">
          <p className="sidebar__label">Entrepôt</p>
          <nav className="navlist">
            <button
              className={`navlist__item ${!selectedWarehouse ? "is-active" : ""}`}
              onClick={() => onSelectWarehouse(null)}
            >
              Tous les entrepôts
            </button>
            {current.warehouses.map((wh) => (
              <button
                key={wh.id}
                className={`navlist__item ${
                  selectedWarehouse === wh.id ? "is-active" : ""
                }`}
                onClick={() => onSelectWarehouse(wh.id)}
              >
                {wh.name}
              </button>
            ))}
          </nav>
        </div>
      )}

      <div className="sidebar__spacer" />

      <div className="conditions-card">
        <p className="sidebar__label">Conditions idéales · {country}</p>
        <div className="conditions-card__row">
          <span>Température</span>
          <strong>
            {conditions.idealTemp}°C <em>±{TEMP_TOLERANCE}</em>
          </strong>
        </div>
        <div className="conditions-card__row">
          <span>Humidité</span>
          <strong>
            {conditions.idealHumidity}% <em>±{HUMIDITY_TOLERANCE}</em>
          </strong>
        </div>
      </div>

      <div className="alert-tally">
        <span className="alert-tally__dot" />
        {activeAlertCount} alerte{activeAlertCount > 1 ? "s" : ""} active
        {activeAlertCount > 1 ? "s" : ""}
      </div>
    </aside>
  );
}
