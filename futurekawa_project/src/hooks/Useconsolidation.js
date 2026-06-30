import { useState, useEffect, useCallback } from "react";
import { hqApi } from "../api/hqClient";

/**
 * Vue consolidée siège : agrège lots + alertes des 3 pays,
 * avec le statut de disponibilité de chaque backend pays.
 */
export function useConsolidation() {
  const [data, setData] = useState([]);
  const [health, setHealth] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [consolidation, healthStatus] = await Promise.all([
        hqApi.getConsolidation(),
        hqApi.getHealth(),
      ]);
      setData(Array.isArray(consolidation) ? consolidation : []);
      setHealth(healthStatus || {});
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, health, loading, error, reload: load };
}