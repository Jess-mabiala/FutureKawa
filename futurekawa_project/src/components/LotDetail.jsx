import { useEffect, useState, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { readingsApi } from "../api/client";
import {
  TEMP_TOLERANCE,
  HUMIDITY_TOLERANCE,
  daysInStorage,
  EXPIRY_DAYS,
} from "../api/constants";
import { StatusPill, Spinner, EmptyState } from "./ui";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler
);

const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// Plugin : bande de tolérance horizontale (idéal ± tolérance)
function tolerancePlugin(getBands) {
  return {
    id: "toleranceBands",
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const bands = getBands();
      bands.forEach(({ axis, min, max, color }) => {
        const scale = scales[axis];
        if (!scale) return;
        const yMin = scale.getPixelForValue(max);
        const yMax = scale.getPixelForValue(min);
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(chartArea.left, yMin, chartArea.right - chartArea.left, yMax - yMin);
        ctx.restore();
      });
    },
  };
}

export default function LotDetail({ lot, conditions, onClose, onStatusChange }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [readings, setReadings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setReadings(null);
    setError(null);

    // Historique de l'entrepôt du lot, depuis sa date de stockage (CDC §III.3)
    const from = new Date(lot.storageDate);
    const to = new Date();

    readingsApi
      .getHistory(lot.warehouseId, from, to)
      .then((data) => {
        if (!cancelled) setReadings(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });

    return () => {
      cancelled = true;
    };
  }, [lot]);

  useEffect(() => {
    if (!readings || readings.length === 0 || !canvasRef.current) return;

    const sorted = [...readings].sort(
      (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)
    );

    const tempData = sorted.map((r) => ({
      x: new Date(r.recordedAt),
      y: Number(r.temperature),
    }));
    const humData = sorted.map((r) => ({
      x: new Date(r.recordedAt),
      y: Number(r.humidity),
    }));

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        datasets: [
          {
            label: "Température (°C)",
            data: tempData,
            borderColor: css("--temp"),
            backgroundColor: css("--temp"),
            yAxisID: "yTemp",
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
          {
            label: "Humidité (%)",
            data: humData,
            borderColor: css("--humidity"),
            backgroundColor: css("--humidity"),
            yAxisID: "yHum",
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { type: "time", time: { unit: "day" }, grid: { display: false } },
          yTemp: {
            type: "linear",
            position: "left",
            title: { display: true, text: "°C" },
            suggestedMin: conditions.idealTemp - TEMP_TOLERANCE - 4,
            suggestedMax: conditions.idealTemp + TEMP_TOLERANCE + 4,
          },
          yHum: {
            type: "linear",
            position: "right",
            title: { display: true, text: "%" },
            grid: { display: false },
            suggestedMin: conditions.idealHumidity - HUMIDITY_TOLERANCE - 6,
            suggestedMax: conditions.idealHumidity + HUMIDITY_TOLERANCE + 6,
          },
        },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, usePointStyle: true } },
          tooltip: {
            callbacks: {
              title: (items) =>
                new Date(items[0].parsed.x).toLocaleString("fr-FR"),
            },
          },
        },
      },
      plugins: [
        tolerancePlugin(() => [
          {
            axis: "yTemp",
            min: conditions.idealTemp - TEMP_TOLERANCE,
            max: conditions.idealTemp + TEMP_TOLERANCE,
            color: css("--tolerance-band"),
          },
        ]),
      ],
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [readings, conditions]);

  const age = daysInStorage(lot.storageDate);
  const anomalyCount = readings?.filter((r) => r.isAnomaly).length ?? 0;

  return (
    <div className="lotdetail" role="region" aria-label={`Détail du lot ${lot.lotCode}`}>
      <div className="lotdetail__head">
        <div>
          <p className="eyebrow">Lot</p>
          <h2 className="mono lotdetail__code">{lot.lotCode}</h2>
          <p className="lotdetail__sub">
            {lot.exploitationName} · {lot.warehouseName} · {age} j en stock
            {age >= EXPIRY_DAYS && (
              <span className="tag tag--danger">Dépasse 365 j</span>
            )}
          </p>
        </div>
        <div className="lotdetail__actions">
          <StatusPill status={lot.status} />
          <select
            className="select"
            value={lot.status}
            onChange={(e) => onStatusChange(lot.id, e.target.value)}
            aria-label="Modifier le statut du lot"
          >
            <option value="compliant">Conforme</option>
            <option value="alert">En alerte</option>
            <option value="expired">Périmé</option>
          </select>
          <button className="btn btn--ghost" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>

      <div className="lotdetail__stats">
        <Stat label="Relevés" value={readings ? readings.length : "—"} />
        <Stat label="Anomalies" value={readings ? anomalyCount : "—"} tone={anomalyCount > 0 ? "danger" : "ok"} />
        <Stat label="Idéal" value={`${conditions.idealTemp}°C / ${conditions.idealHumidity}%`} />
      </div>

      <div className="chart-wrap">
        {error && (
          <EmptyState title="Mesures indisponibles">
            {error.message}
          </EmptyState>
        )}
        {!error && readings === null && <Spinner label="Chargement des mesures…" />}
        {!error && readings?.length === 0 && (
          <EmptyState title="Aucune mesure enregistrée">
            Aucun relevé capteur depuis l'entrée en stock de ce lot.
          </EmptyState>
        )}
        {!error && readings?.length > 0 && (
          <>
            <p className="chart-wrap__caption">
              Conditions de l'entrepôt depuis le{" "}
              {new Date(lot.storageDate).toLocaleDateString("fr-FR")}. La bande
              verte indique la plage de température tolérée ({conditions.idealTemp}±
              {TEMP_TOLERANCE}°C).
            </p>
            <div className="chart-canvas">
              <canvas ref={canvasRef} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className={`stat__value ${tone ? `stat__value--${tone}` : ""}`}>
        {value}
      </span>
    </div>
  );
}
