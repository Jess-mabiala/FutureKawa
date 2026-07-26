export default function MultiCountrySidebar({ groups, onSelectCountry, activeAlertCount, isOpen, onClose }) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
      {/* Bouton de fermeture — visible uniquement sur mobile */}
      <button className="sidebar__close" onClick={onClose} aria-label="Fermer le menu">✕</button>

      <div className="brand">
        <span className="brand__mark">◗</span>
        <span className="brand__name">FutureKawa</span>
      </div>

      <div className="sidebar__section">
        <p className="sidebar__label">Exploitations — tous pays</p>
        <nav className="navlist">
          {groups.map((group) => (
            <div key={group.country} className="navlist__group">
              <button
                className="navlist__group-head"
                onClick={() => onSelectCountry(group.country)}
              >
                <span>{group.label}</span>
                {group.status === "unavailable" && (
                  <span className="navlist__group-flag">Hors ligne</span>
                )}
              </button>
              {group.exploitations.length === 0 ? (
                <p className="sidebar__hint sidebar__hint--nested">Aucune donnée chargée.</p>
              ) : (
                group.exploitations.map((exp) => (
                  <button
                    key={exp.name}
                    className="navlist__item navlist__item--nested"
                    onClick={() => onSelectCountry(group.country)}
                  >
                    {exp.name}
                    <span className="navlist__count">{exp.warehouses.length}</span>
                  </button>
                ))
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="sidebar__spacer" />

      <div className="alert-tally">
        <span className="alert-tally__dot" />
        {activeAlertCount} alerte{activeAlertCount > 1 ? "s" : ""} active{activeAlertCount > 1 ? "s" : ""}
      </div>
    </aside>
  );
}
