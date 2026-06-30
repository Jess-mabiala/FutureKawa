// ─────────────────────────────────────────────────────────────
// FutureKawa — Référentiel métier (issu du cahier des charges)
// ─────────────────────────────────────────────────────────────

// Conditions idéales par pays (CDC §III.2) + tolérances ±3°C / ±2%
export const COUNTRY_CONDITIONS = {
  BR: { name: "Brésil", idealTemp: 29, idealHumidity: 55 },
  EC: { name: "Équateur", idealTemp: 31, idealHumidity: 60 },
  CO: { name: "Colombie", idealTemp: 26, idealHumidity: 80 },
};

export const TEMP_TOLERANCE = 3; // °C
export const HUMIDITY_TOLERANCE = 2; // %

// Code pays du backend ciblé (cf. application.properties → country.code)
// Modifiable via .env : VITE_COUNTRY_CODE
export const COUNTRY_CODE =
  import.meta.env.VITE_COUNTRY_CODE || "CO";

export function getConditions(code = COUNTRY_CODE) {
  return COUNTRY_CONDITIONS[code] || COUNTRY_CONDITIONS.CO;
}

// Statuts de lot (enum LotStatus)
export const LOT_STATUS = {
  compliant: { label: "Conforme", tone: "ok" },
  alert: { label: "En alerte", tone: "warn" },
  expired: { label: "Périmé", tone: "danger" },
};

// Types d'alerte (enum AlertType)
export const ALERT_TYPE = {
  temperature: { label: "Température", icon: "thermometer" },
  humidity: { label: "Humidité", icon: "droplet" },
  expiration: { label: "Péremption", icon: "clock" },
};

// Seuil de péremption FIFO (CDC §III.4 : 365 jours)
export const EXPIRY_DAYS = 365;

export function daysInStorage(storageDate) {
  const start = new Date(storageDate);
  const now = new Date();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}
