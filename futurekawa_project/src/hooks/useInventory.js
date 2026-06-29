import { useState, useEffect, useCallback, useMemo } from "react";
import { lotsApi } from "../api/client";

// Charge tous les lots et en dérive les exploitations + entrepôts,
// puisque le backend pays n'expose pas de route de listing dédiée.
export function useInventory() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await lotsApi.getAll();
      setLots(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Exploitations dérivées (nom -> entrepôts associés)
  const exploitations = useMemo(() => {
    const map = new Map();
    for (const lot of lots) {
      const expName = lot.exploitationName || "Exploitation inconnue";
      if (!map.has(expName)) map.set(expName, new Map());
      const warehouses = map.get(expName);
      if (!warehouses.has(lot.warehouseId)) {
        warehouses.set(lot.warehouseId, {
          id: lot.warehouseId,
          name: lot.warehouseName,
        });
      }
    }
    return Array.from(map.entries()).map(([name, whMap]) => ({
      name,
      warehouses: Array.from(whMap.values()),
    }));
  }, [lots]);

  return { lots, exploitations, loading, error, reload: load };
}
