import { useLiveReadings } from "../hooks/useLiveReadings";
import { TEMP_TOLERANCE, HUMIDITY_TOLERANCE, COUNTRY_CONDITIONS } from "../api/constants";
import { Spinner, EmptyState } from "./ui";

const COUNTRY_TO_CODE = { brazil: "BR", ecuador: "EC", colombia: "CO" };

export default function LiveReadingWidget({ country, warehouseId, intervalMs = 5000 }) {
  const { latest, readings, error, lastUpdate } = useLiveReadings(
    country,
    warehouseId,
    intervalMs
  );

  const code = COUNTRY_TO_CODE[country];
  const conditions = COUNTRY_CONDITIONS[code];

  if (error) {
    return (
      <EmptyState title="Capteur indisponible">
        Impossible de récupérer les relevés en direct. {error.message}
      </EmptyState>
    );
  }

  if (!latest) {
    return <Spinner label="En attente du premier relevé…" />;
  }

  const tempOut =
    conditions && Math.abs(latest.temperature - conditions.idealTemp) > TEMP_TOLERANCE;
  const humOut =
    conditions &&
    Math.abs(latest.humidity - conditions.idealHumidity) > HUMIDITY_TOLERANCE;
  const isAnomaly = latest.isAnomaly || tempOut || humOut;

  return (
    <div className={`live-widget ${isAnomaly ? "live-widget--anomaly" : ""}`}>
      <div className="live-widget__head">
        <span className="live-widget__pulse" aria-hidden="true" />
        <span className="live-widget__label">Relevé en direct</span>
        {lastUpdate && (
          <span className="live-widget__time">
            {lastUpdate.toLocaleTimeString("fr-FR")}
          </span>
        )}
      </div>

      <div className="live-widget__values">
        <div className={`live-widget__metric ${tempOut ? "is-out" : ""}`}>
          <span className="live-widget__metric-label">Température</span>
          <strong className="live-widget__metric-value">
            {Number(latest.temperature).toFixed(1)}°C
          </strong>
          {conditions && (
            <span className="live-widget__metric-ideal">
              idéal {conditions.idealTemp}±{TEMP_TOLERANCE}°C
            </span>
          )}
        </div>
        <div className={`live-widget__metric ${humOut ? "is-out" : ""}`}>
          <span className="live-widget__metric-label">Humidité</span>
          <strong className="live-widget__metric-value">
            {Number(latest.humidity).toFixed(1)}%
          </strong>
          {conditions && (
            <span className="live-widget__metric-ideal">
              idéal {conditions.idealHumidity}±{HUMIDITY_TOLERANCE}%
            </span>
          )}
        </div>
      </div>

      {isAnomaly && (
        <p className="live-widget__warning">
          ⚠ Conditions hors plage acceptable pour ce pays
        </p>
      )}

      <p className="live-widget__count">
        {readings.length} relevé{readings.length > 1 ? "s" : ""} reçu
        {readings.length > 1 ? "s" : ""} récemment
      </p>
    </div>
  );
}