import { useState, useMemo } from "react";
import { useCountryOverview } from "./hooks/useCountryOverview";
import { useAllExploitations } from "./hooks/useAllExploitations";
import MultiCountrySidebar from "./components/MultiCountrySidebar";
import HQDashboard from "./components/HQDashboard";
import AlertPanel from "./components/AlertPanel";
import "./App.css";
import "./hq-dashboard.css";

const COUNTRY_LABELS = { brazil: "Brésil", ecuador: "Équateur", colombia: "Colombie" };
const COUNTRIES = ["brazil", "ecuador", "colombia"];

// Ports des backends pays, pour router la résolution d'alerte au bon endroit
// (le backend siège n'expose que de la lecture, pas d'écriture).
const COUNTRY_API_PORTS = { brazil: 3001, ecuador: 3002, colombia: 3003 };

export default function App() {
  const { overview, health, loading, refresh } = useCountryOverview();
  const exploitationGroups = useAllExploitations(overview);

  // Pays actuellement ouvert en détail (null = page d'accueil Siège)
  const [openCountry, setOpenCountry] = useState(null);

  // Toutes les alertes actives, tous pays confondus (panneau de droite)
  const allAlerts = useMemo(() => {
    const list = [];
    Object.entries(overview).forEach(([country, data]) => {
      (data?.alerts || []).forEach((alert) => {
        list.push({ ...alert, country });
      });
    });
    return list.sort(
      (a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt)
    );
  }, [overview]);

  async function handleResolveAlert(alertId, country) {
  const port = COUNTRY_API_PORTS[country];
  if (!port) return;
  try {
    await fetch(`http://localhost:${port}/api/alerts/${alertId}/resolve`, {
      method: "PATCH",
    });
    refresh?.();
  } catch (e) {
    console.error("Échec résolution alerte :", e);
  }
}

  const pageTitle = openCountry
    ? COUNTRY_LABELS[openCountry]
    : "Vue Siège — tous pays";
  const pageEyebrow = openCountry
    ? `Suivi des stocks · ${COUNTRY_LABELS[openCountry]}`
    : "Pilotage centralisé";

  return (
    <div className="app">
      <MultiCountrySidebar
        groups={exploitationGroups}
        onSelectCountry={setOpenCountry}
        activeAlertCount={allAlerts.length}
      />

      <main className="main">
        <header className="main__head">
          <div>
            <p className="eyebrow">{pageEyebrow}</p>
            <h1>{pageTitle}</h1>
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
                <option key={c} value={c}>
                  {COUNTRY_LABELS[c]}
                </option>
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