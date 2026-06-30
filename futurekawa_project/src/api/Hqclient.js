// ─────────────────────────────────────────────────────────────
// FutureKawa — Client API Siège (HQ)
// Cible le backend central qui agrège les 3 pays.
// Base configurable via .env :
//   VITE_HQ_BASE_URL=http://localhost:3000
// ─────────────────────────────────────────────────────────────

import { ApiError } from "./client";

const HQ_BASE_URL =
  "http://localhost:3000"; //import.meta.env.VITE_HQ_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

async function hqRequest(path, options = {}) {
  const url = `${HQ_BASE_URL}${path}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch (networkError) {
    throw new ApiError(
      "Le backend siège ne répond pas. Vérifiez qu'il est démarré (port 3000).",
      0,
      networkError
    );
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* corps non-JSON */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ─── Vue consolidée tous pays ──────────────────────────────────
export const hqApi = {
  // Statut de chaque backend pays (ok / unavailable)
  getHealth: () => hqRequest("/api/central/health"),

  // Vue globale : lots + alertes par pays, avec statut de disponibilité
  getConsolidation: () => hqRequest("/api/central/consolidation"),

  // Tous les lots tous pays confondus, triés FIFO global
  getAllLots: () => hqRequest("/api/central/lots"),

  // Lots d'un pays spécifique (ex: "brazil", "ecuador", "colombia")
  getLotsByCountry: (country) => hqRequest(`/api/central/lots/${country}`),

  // Lots d'un entrepôt précis dans un pays
  getLotsByWarehouse: (country, warehouseId) =>
    hqRequest(`/api/central/lots/${country}/warehouse/${warehouseId}`),

  // Toutes les alertes actives, tous pays confondus
  getAllAlerts: () => hqRequest("/api/central/alerts"),

  // Alertes actives d'un pays
  getAlertsByCountry: (country) => hqRequest(`/api/central/alerts/${country}`),

  // Derniers relevés IoT d'un entrepôt
  getLatestReadings: (country, warehouseId) =>
    hqRequest(`/api/central/readings/${country}/warehouse/${warehouseId}`),
};

export { HQ_BASE_URL };