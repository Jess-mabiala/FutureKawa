import { useEffect, useRef, useState } from "react";
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
import { hqApi } from "../api/hqClient";
import { TEMP_TOLERANCE, HUMIDITY_TOLERANCE } from "../api/constants";
import { Spinner, EmptyState } from "./ui";

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

// Plugin : bande de tolérance horizontale (idéal ± tolérance) — repris de LotDetail
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

/**
 * Courbes température/humidité d'un entrepôt sur les dernières heures,
 * avec bande de tolérance. Répond à CDC §III.3 :
 * "afficher les courbes de température et d'humidité enregistrées".
 *
 * Utilise l'historique exposé par le backend pays (via le siège),
 * sur une fenêtre glissante (par défaut les dernières 24h).
 */
export default function WarehouseChart({ country, warehouseId, conditions, hoursWindow = 24 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [readings, setReadings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setReadings(null);
    setError(null);

    const to = new Date();
    const from = new Date(to.getTime() - hoursWindow * 60 * 60 * 1000);

    hqApi
      .getLatestReadings(country, warehouseId)
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        // Filtre sur la fenêtre demandée si le backend retourne plus large
        const filtered = list.filter((r) => {
          const t = new Date(r.recordedAt).getTime();
          return t >= from.getTime() && t <= to.getTime();
        });
        setReadings(filtered.length > 0 ? filtered : list);
      })
      .catch((e) => {
        if (!cancelled) setError(e);
      });

    return () => {
      cancelled = true;
    };
  }, [country, warehouseId, hoursWindow]);

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
          x: { type: "time", time: { unit: "hour" }, grid: { display: false } },
          yTemp: {
            type: "linear",
            position: "left",
            title: { display: true, text: "°C" },
            suggestedMin: (conditions?.idealTemp ?? 25) - TEMP_TOLERANCE - 4,
            suggestedMax: (conditions?.idealTemp ?? 25) + TEMP_TOLERANCE + 4,
          },
          yHum: {
            type: "linear",
            position: "right",
            title: { display: true, text: "%" },
            grid: { display: false },
            suggestedMin: (conditions?.idealHumidity ?? 60) - HUMIDITY_TOLERANCE - 6,
            suggestedMax: (conditions?.idealHumidity ?? 60) + HUMIDITY_TOLERANCE + 6,
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
      plugins: conditions
        ? [
            tolerancePlugin(() => [
              {
                axis: "yTemp",
                min: conditions.idealTemp - TEMP_TOLERANCE,
                max: conditions.idealTemp + TEMP_TOLERANCE,
                color: css("--tolerance-band"),
              },
            ]),
          ]
        : [],
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [readings, conditions]);

  const anomalyCount = readings?.filter((r) => r.isAnomaly).length ?? 0;

  if (error) {
    return (
      <EmptyState title="Mesures indisponibles">{error.message}</EmptyState>
    );
  }

  if (readings === null) {
    return <Spinner label="Chargement des mesures…" />;
  }

  if (readings.length === 0) {
    return (
      <EmptyState title="Aucune mesure enregistrée">
        Aucun relevé capteur disponible pour cet entrepôt.
      </EmptyState>
    );
  }

  return (
    <div className="chart-wrap">
      <div className="lotdetail__stats">
        <Stat label="Relevés" value={readings.length} />
        <Stat
          label="Anomalies"
          value={anomalyCount}
          tone={anomalyCount > 0 ? "danger" : "ok"}
        />
        {conditions && (
          <Stat
            label="Idéal"
            value={`${conditions.idealTemp}°C / ${conditions.idealHumidity}%`}
          />
        )}
      </div>
      <p className="chart-wrap__caption">
        Conditions de l'entrepôt sur les dernières {hoursWindow}h. La bande verte
        indique la plage de température tolérée
        {conditions && ` (${conditions.idealTemp}±${TEMP_TOLERANCE}°C)`}.
      </p>
      <div className="chart-canvas">
        <canvas ref={canvasRef} />
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
