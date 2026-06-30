import { useState, useEffect, useRef } from "react";
import { hqApi } from "../api/hqClient";

/**
 * Polling périodique des derniers relevés IoT d'un entrepôt via le siège.
 * S'arrête automatiquement si le composant est démonté ou si country/warehouseId changent.
 *
 * @param {string} country - "brazil" | "ecuador" | "colombia"
 * @param {number} warehouseId
 * @param {number} intervalMs - fréquence de rafraîchissement (def: 5000ms)
 */
export function useLiveReadings(country, warehouseId, intervalMs = 5000) {
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!country || !warehouseId) return;

    let cancelled = false;

    async function fetchReadings() {
      try {
        const data = await hqApi.getLatestReadings(country, warehouseId);
        if (!cancelled) {
          setReadings(Array.isArray(data) ? data : []);
          setError(null);
          setLastUpdate(new Date());
        }
      } catch (e) {
        if (!cancelled) setError(e);
      }
    }

    fetchReadings(); // premier appel immédiat
    timerRef.current = setInterval(fetchReadings, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [country, warehouseId, intervalMs]);

  // Dernier relevé reçu (le plus récent)
  const latest = readings.length > 0
    ? [...readings].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))[0]
    : null;

  return { readings, latest, error, lastUpdate };
}