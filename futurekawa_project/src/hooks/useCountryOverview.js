import { useState, useEffect, useRef, useCallback } from "react";
import { hqApi } from "../api/hqClient";

const COUNTRIES = ["brazil", "ecuador", "colombia"];

/**
 * Récupère, pour chaque pays, les entrepôts (dérivés des lots) et
 * le dernier relevé température/humidité de leur premier entrepôt actif.
 * Rafraîchi périodiquement (polling) + rafraîchissement manuel via refresh().
 */
export function useCountryOverview(intervalMs = 5000) {
  const [overview, setOverview] = useState({});
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      const healthStatus = await hqApi.getHealth();
      if (!cancelledRef.current) setHealth(healthStatus || {});

      const results = await Promise.all(
        COUNTRIES.map(async (country) => {
          try {
            const lots = await hqApi.getLotsByCountry(country);
            const alerts = await hqApi.getAlertsByCountry(country);

            const warehouseMap = new Map();
            (lots || []).forEach((lot) => {
              if (!warehouseMap.has(lot.warehouseId)) {
                warehouseMap.set(lot.warehouseId, {
                  id: lot.warehouseId,
                  name: lot.warehouseName,
                  exploitationName: lot.exploitationName,
                });
              }
            });
            const warehouses = Array.from(warehouseMap.values());

            let latestReading = null;
            if (warehouses.length > 0) {
              try {
                const readings = await hqApi.getLatestReadings(
                  country,
                  warehouses[0].id
                );
                if (Array.isArray(readings) && readings.length > 0) {
                  latestReading = [...readings].sort(
                    (a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)
                  )[0];
                }
              } catch {
                /* pas de relevé disponible, on ignore */
              }
            }

            return {
              country,
              status: "ok",
              lots: lots || [],
              alerts: alerts || [],
              warehouses,
              latestReading,
            };
          } catch (e) {
            return {
              country,
              status: "unavailable",
              lots: [],
              alerts: [],
              warehouses: [],
              latestReading: null,
            };
          }
        })
      );

      if (!cancelledRef.current) {
        const map = {};
        results.forEach((r) => { map[r.country] = r; });
        setOverview(map);
        setLoading(false);
      }
    } catch {
      if (!cancelledRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    fetchAll();
    timerRef.current = setInterval(fetchAll, intervalMs);

    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll, intervalMs]);

  return { overview, health, loading, refresh: fetchAll };
}