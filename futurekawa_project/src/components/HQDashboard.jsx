import { useState, useMemo } from "react";
import { useLiveReadings } from "../hooks/useLiveReadings";
import WarehouseChart from "./WarehouseChart";
import { COUNTRY_CONDITIONS, TEMP_TOLERANCE, HUMIDITY_TOLERANCE, daysInStorage, EXPIRY_DAYS } from "../api/constants";
import { StatusPill, Spinner, EmptyState, Banner } from "./ui";

const COUNTRY_LABELS = { brazil: "Brésil", ecuador: "Équateur", colombia: "Colombie" };
const COUNTRY_TO_CODE = { brazil: "BR", ecuador: "EC", colombia: "CO" };
const COUNTRIES = ["brazil", "ecuador", "colombia"];

/**
 * Contenu central de la page : soit l'accueil Siège (3 pays + stats
 * globales), soit le détail d'un pays (entrepôts, relevés live,
 * courbes température/humidité, lots, alertes du pays).
 *
 * Contrôlé par App.jsx : overview/health/openCountry sont passés en
 * props pour que la Sidebar, le sélecteur de pays et le panneau
 * Alertes restent synchronisés.
 */
export default function HQDashboard({ overview, health, loading, openCountry, onOpenCountry }) {
  if (openCountry) {
    return (
      <CountryDetail
        country={openCountry}
        data={overview[openCountry]}
        onBack={() => onOpenCountry(null)}
      />
    );
  }

  return (
  <div className="hq-panel">
    {loading && <Spinner label="Chargement des données pays…" />}

    <GlobalStats overview={overview} />

    <section>
      <h3 className="hq-detail-subtitle">Stocks par pays</h3>
      <div className="hq-overview-grid">
        {COUNTRIES.map((country) => (
          <CountryOverviewCard
            key={country}
            country={country}
            data={overview[country]}
            onClick={() => onOpenCountry(country)}
          />
        ))}
      </div>
    </section>

    <GlobalAlerts overview={overview} onSelectCountry={onOpenCountry} />
  </div>
);
}

// ── Bloc 1 : stats globales (CDC §II — centraliser le suivi) ───
function GlobalStats({ overview }) {
  const stats = useMemo(() => {
    let totalLots = 0;
    let totalAlerts = 0;
    let expiredOrAtRisk = 0;
    let countriesOnline = 0;

    COUNTRIES.forEach((country) => {
      const data = overview[country];
      if (!data) return;
      if (data.status === "ok") countriesOnline += 1;
      totalLots += data.lots?.length || 0;
      totalAlerts += data.alerts?.length || 0;
      (data.lots || []).forEach((lot) => {
        if (daysInStorage(lot.storageDate) >= EXPIRY_DAYS || lot.status === "expired") {
          expiredOrAtRisk += 1;
        }
      });
    });

    return { totalLots, totalAlerts, expiredOrAtRisk, countriesOnline };
  }, [overview]);

  return (
    <section className="hq-stats-row">
      <StatCard label="Lots — tous pays" value={stats.totalLots} />
      <StatCard
        label="Alertes actives"
        value={stats.totalAlerts}
        tone={stats.totalAlerts > 0 ? "danger" : "ok"}
      />
      <StatCard
        label="Lots à risque (≥365 j)"
        value={stats.expiredOrAtRisk}
        tone={stats.expiredOrAtRisk > 0 ? "warn" : "ok"}
      />
      <StatCard
        label="Pays connectés"
        value={`${stats.countriesOnline} / 3`}
        tone={stats.countriesOnline < 3 ? "warn" : "ok"}
      />
    </section>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className="hq-stat-card">
      <span className="hq-stat-card__label">{label}</span>
      <strong className={`hq-stat-card__value ${tone ? `hq-stat-card__value--${tone}` : ""}`}>
        {value}
      </strong>
    </div>
  );
}

// ── Bloc 2 : accès rapide aux alertes (CDC §III.3 + §III.4) ────
function GlobalAlerts({ overview, onSelectCountry }) {
  const allAlerts = useMemo(() => {
    const list = [];
    COUNTRIES.forEach((country) => {
      const data = overview[country];
      (data?.alerts || []).forEach((alert) => {
        list.push({ ...alert, country });
      });
    });
    return list.sort(
      (a, b) => new Date(b.triggeredAt) - new Date(a.triggeredAt)
    );
  }, [overview]);

  if (allAlerts.length === 0) {
    return (
      <section className="hq-alerts-section hq-alerts-section--empty">
        <h3 className="hq-detail-subtitle">Alertes actives</h3>
        <p className="hq-overview-card__hint">Aucune alerte active actuellement.</p>
      </section>
    );
  }

  return (
    <section className="hq-alerts-section">
      <h3 className="hq-detail-subtitle">
        Alertes actives <span className="hq-alerts-count">{allAlerts.length}</span>
      </h3>
      <ul className="hq-alerts-list">
        {allAlerts.slice(0, 6).map((alert) => (
          <li key={`${alert.country}-${alert.id}`} className="hq-alert-row">
            <span className="hq-alert-row__country">{COUNTRY_LABELS[alert.country]}</span>
            <span className="hq-alert-row__detail">{alert.details}</span>
            <button
              className="btn btn--ghost btn--small"
              onClick={() => onSelectCountry(alert.country)}
            >
              Voir
            </button>
          </li>
        ))}
      </ul>
      {allAlerts.length > 6 && (
        <p className="hq-alerts-more">
          + {allAlerts.length - 6} autre{allAlerts.length - 6 > 1 ? "s" : ""} alerte
          {allAlerts.length - 6 > 1 ? "s" : ""}
        </p>
      )}
    </section>
  );
}

// ── Bloc 3 : carte résumé par pays (point d'entrée vers le détail) ─
function CountryOverviewCard({ country, data, onClick }) {
  const label = COUNTRY_LABELS[country];
  const code = COUNTRY_TO_CODE[country];
  const conditions = COUNTRY_CONDITIONS[code];
  const isDown = !data || data.status === "unavailable";
  const reading = data?.latestReading;

  const tempOut =
    reading && conditions && Math.abs(reading.temperature - conditions.idealTemp) > TEMP_TOLERANCE;
  const humOut =
    reading && conditions && Math.abs(reading.humidity - conditions.idealHumidity) > HUMIDITY_TOLERANCE;
  const hasAnomaly = reading?.isAnomaly || tempOut || humOut;

  const alertCount = data?.alerts?.length || 0;

  return (
    <button
      className={`hq-overview-card ${isDown ? "hq-overview-card--down" : ""} ${
        hasAnomaly ? "hq-overview-card--anomaly" : ""
      }`}
      onClick={onClick}
    >
      <div className="hq-overview-card__head">
        <h2>{label}</h2>
        <span
          className={`hq-overview-card__status hq-overview-card__status--${
            isDown ? "unavailable" : "ok"
          }`}
        >
          {isDown ? "Hors ligne" : "En ligne"}
        </span>
      </div>

      {isDown ? (
        <p className="hq-overview-card__hint">Backend pays injoignable</p>
      ) : reading ? (
        <>
          <div className="hq-overview-card__values">
            <div className={`hq-overview-card__metric ${tempOut ? "is-out" : ""}`}>
              <span>{Number(reading.temperature).toFixed(1)}°C</span>
              <small>idéal {conditions?.idealTemp}°C</small>
            </div>
            <div className={`hq-overview-card__metric ${humOut ? "is-out" : ""}`}>
              <span>{Number(reading.humidity).toFixed(1)}%</span>
              <small>idéal {conditions?.idealHumidity}%</small>
            </div>
          </div>
          {hasAnomaly && (
            <p className="hq-overview-card__warning">⚠ Conditions hors plage</p>
          )}
        </>
      ) : (
        <p className="hq-overview-card__hint">Aucun relevé disponible</p>
      )}

      <div className="hq-overview-card__footer">
        <span>{data?.lots?.length || 0} lot{(data?.lots?.length || 0) > 1 ? "s" : ""}</span>
        <span className={alertCount > 0 ? "is-danger" : ""}>
          {alertCount} alerte{alertCount > 1 ? "s" : ""}
        </span>
      </div>
    </button>
  );
}

// ── Détail d'un pays : entrepôts, relevés live, courbes, lots ──
function CountryDetail({ country, data, onBack }) {
  const label = COUNTRY_LABELS[country];
  const code = COUNTRY_TO_CODE[country];
  const conditions = COUNTRY_CONDITIONS[code];
  const [openWarehouse, setOpenWarehouse] = useState(null);
  const isDown = !data || data.status === "unavailable";
  const warehouses = data?.warehouses || [];
  const alerts = data?.alerts || [];

  return (
    <div className="hq-panel">
      <button className="btn btn--ghost btn--back" onClick={onBack}>
        ← Tous les pays
      </button>
      <h2 className="hq-panel__title">{label}</h2>

      {isDown && (
        <Banner tone="danger" title="Backend pays injoignable">
          Impossible de récupérer les données de {label}. Vérifiez que le backend est démarré.
        </Banner>
      )}

      {!isDown && (
        <>
          {conditions && (
            <div className="hq-conditions-row">
              <span>Conditions idéales</span>
              <strong>
                {conditions.idealTemp}°C <em>±{TEMP_TOLERANCE}</em>
              </strong>
              <strong>
                {conditions.idealHumidity}% <em>±{HUMIDITY_TOLERANCE}</em>
              </strong>
            </div>
          )}

          {alerts.length > 0 && (
            <section className="hq-detail-alerts">
              <h3>Alertes récentes — {label}</h3>
              <ul>
                {alerts.slice(0, 5).map((alert) => (
                  <li key={alert.id} className="hq-alert-line">
                    ⚠ {alert.details}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="hq-detail-subtitle">Entrepôts</h3>
            {warehouses.length === 0 && (
              <EmptyState title="Aucun entrepôt">
                Aucun lot enregistré pour {label} pour l'instant.
              </EmptyState>
            )}
            <div className="hq-warehouse-grid">
              {warehouses.map((wh) => (
                <button
                  key={wh.id}
                  className={`hq-warehouse-card ${
                    openWarehouse === wh.id ? "is-active" : ""
                  }`}
                  onClick={() =>
                    setOpenWarehouse(openWarehouse === wh.id ? null : wh.id)
                  }
                >
                  <strong>{wh.name}</strong>
                  <span>{wh.exploitationName}</span>
                </button>
              ))}
            </div>
          </section>

          {openWarehouse && (
            <section>
              <h3 className="hq-detail-subtitle">
                Conditions de stockage — {warehouses.find((w) => w.id === openWarehouse)?.name}
              </h3>
              <WarehouseLiveBadge country={country} warehouseId={openWarehouse} />
              <WarehouseChart
                country={country}
                warehouseId={openWarehouse}
                conditions={conditions}
              />
            </section>
          )}

          <section>
            <h3 className="hq-detail-subtitle">Lots ({data.lots?.length || 0})</h3>
            <LotsList lots={data.lots || []} />
          </section>
        </>
      )}
    </div>
  );
}

// ── Badge "relevé en direct" au-dessus du graphique ─────────────
function WarehouseLiveBadge({ country, warehouseId }) {
  const { latest, error } = useLiveReadings(country, warehouseId);

  if (error || !latest) return null;

  return (
    <div className="hq-warehouse-reading">
      <div>
        <span className="hq-warehouse-reading__label">Température actuelle</span>
        <strong>{Number(latest.temperature).toFixed(1)}°C</strong>
      </div>
      <div>
        <span className="hq-warehouse-reading__label">Humidité actuelle</span>
        <strong>{Number(latest.humidity).toFixed(1)}%</strong>
      </div>
      <div>
        <span className="hq-warehouse-reading__label">Dernier relevé</span>
        <strong>{new Date(latest.recordedAt).toLocaleTimeString("fr-FR")}</strong>
      </div>
    </div>
  );
}

function LotsList({ lots }) {
  if (lots.length === 0) {
    return <EmptyState title="Aucun lot">Aucun lot enregistré.</EmptyState>;
  }

  // Tri FIFO : lots les plus anciens en premier (CDC §III.1)
  const sorted = [...lots].sort(
    (a, b) => new Date(a.storageDate) - new Date(b.storageDate)
  );

  return (
    <ul className="hq-country-card__lots">
      {sorted.map((lot) => {
        const age = daysInStorage(lot.storageDate);
        return (
          <li key={lot.id} className="hq-lot-row">
            <span className="mono">{lot.lotCode}</span>
            <span className="hq-lot-row__warehouse">{lot.warehouseName}</span>
            <span className={age >= EXPIRY_DAYS ? "is-danger" : ""}>{age} j</span>
            <StatusPill status={lot.status} />
          </li>
        );
      })}
    </ul>
  );
}