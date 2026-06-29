// ─────────────────────────────────────────────────────────────
// FutureKawa — Client API
// Cible le backend pays (Spring Boot). Base configurable via .env :
//   VITE_API_BASE_URL=http://localhost:3002
// ─────────────────────────────────────────────────────────────

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3002";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch (networkError) {
    throw new ApiError(
      "Le serveur ne répond pas. Vérifiez que le backend est démarré (port 3002).",
      0,
      networkError
    );
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* corps non-JSON, on garde le message par défaut */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}

export class ApiError extends Error {
  constructor(message, status, cause) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.cause = cause;
  }
}

// ─── Lots ───────────────────────────────────────────────────
export const lotsApi = {
  getAll: () => request("/api/lots"),
  getById: (id) => request(`/api/lots/${id}`),
  getByWarehouse: (warehouseId) => request(`/api/lots/warehouse/${warehouseId}`),
  getByExploitation: (exploitationId) =>
    request(`/api/lots/exploitation/${exploitationId}`),
  create: (lotRequest) =>
    request("/api/lots", { method: "POST", body: JSON.stringify(lotRequest) }),
  updateStatus: (id, status) =>
    request(`/api/lots/${id}/status?status=${encodeURIComponent(status)}`, {
      method: "PATCH",
    }),
};

// ─── Relevés capteurs ───────────────────────────────────────
export const readingsApi = {
  getLatest: (warehouseId) =>
    request(`/api/readings/warehouse/${warehouseId}/latest`),
  // from / to : objets Date ou chaînes ISO
  getHistory: (warehouseId, from, to) => {
    const f = from instanceof Date ? from.toISOString() : from;
    const t = to instanceof Date ? to.toISOString() : to;
    const qs = `?from=${encodeURIComponent(f)}&to=${encodeURIComponent(t)}`;
    return request(`/api/readings/warehouse/${warehouseId}/history${qs}`);
  },
};

// ─── Alertes ────────────────────────────────────────────────
export const alertsApi = {
  getActive: () => request("/api/alerts"),
  getByWarehouse: (warehouseId) => request(`/api/alerts/warehouse/${warehouseId}`),
  resolve: (id) => request(`/api/alerts/${id}/resolve`, { method: "PATCH" }),
};

export { BASE_URL };
