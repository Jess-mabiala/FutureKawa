import { useState, useMemo } from "react";
import { useCountryOverview } from "./hooks/useCountryOverview";
import { useAllExploitations } from "./hooks/UseAllExploitations";
import MultiCountrySidebar from "./components/MultiCountrySidebar";
import HQDashboard from "./components/HQDashboard";
import AlertPanel from "./components/AlertPanel";
import "./App.css";
import "./hq-dashboard.css";

const COUNTRY_LABELS = { brazil: "Brésil", ecuador: "Équateur", colombia: "Colombie" };
const COUNTRIES = ["brazil", "ecuador", "colombia"];
const COUNTRY_API_PORTS = { brazil: 3001, ecuador: 3002, colombia: 3003 };

export default function App() {
  const { overview, health, loading, refresh } = useCountryOverview();
  const exploitationGroups = useAllExploitations(overview);
  const [openCountry, setOpenCountry] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allAlerts = useMemo(() => {
    const list = [];
    Object.entries(overview).forEach(([country, data]) => {
      (data?.alerts || []).forEach((alert) => {
        list.push({ ...alert, country });
      });
    });
    return list.sort((a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt));
  }, [overview]);

  async function handleResolveAlert(alertId, country) {
    const port = COUNTRY_API_PORTS[country];
    if (!port) return;
    try {
      await fetch(`http://localhost:${port}/api/alerts/${alertId}/resolve`, { method: "PATCH" });
      refresh?.();
    } catch (e) {
      console.error("Échec résolution alerte :", e);
    }
  }

  function handleSelectCountry(country) {
    setOpenCountry(country);
    setSidebarOpen(false);
  }

  const pageTitle = openCountry ? COUNTRY_LABELS[openCountry] : "Vue Siège — tous pays";
  const pageEyebrow = openCountry
    ? `Suivi des stocks · ${COUNTRY_LABELS[openCountry]}`
    : "Pilotage centralisé";

  return (
    <div className="app">
      {/* Overlay mobile pour fermer la sidebar */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <MultiCountrySidebar
        groups={exploitationGroups}
        onSelectCountry={handleSelectCountry}
        activeAlertCount={allAlerts.length}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main">
        <header className="main__head">
          <div className="main__head-left">
            {/* Bouton hamburger — visible uniquement sur mobile */}
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <span /><span /><span />
            </button>
            <div>
              <p className="eyebrow">{pageEyebrow}</p>
              <h1>{pageTitle}</h1>
            </div>
          </div>

          <div className="main__head-actions">
            <button
              className={`btn ${!openCountry ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setOpenCountry(null)}
            >
              ◗ Siège
            </button>
            <select
              className="select country-select"
              value={openCountry || ""}
              onChange={(e) => setOpenCountry(e.target.value || null)}
              aria-label="Sélectionner un pays"
            >
              <option value="">Choisir un pays…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{COUNTRY_LABELS[c]}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid">
          <section className="panel">
            <HQDashboard
              overview={overview}
              health={health}
              loading={loading}
              openCountry={openCountry}
              onOpenCountry={setOpenCountry}
            />
          </section>

          <aside className="rail">
            <AlertPanel alerts={allAlerts} onResolve={handleResolveAlert} />
          </aside>
        </div>
      </main>
    </div>
  );
}
