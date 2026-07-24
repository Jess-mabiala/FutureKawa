import { describe, it, expect } from "vitest";
import {
  COUNTRY_CONDITIONS, TEMP_TOLERANCE, HUMIDITY_TOLERANCE,
  EXPIRY_DAYS, LOT_STATUS, ALERT_TYPE, getConditions, daysInStorage,
} from "./constants";

function ilYAJours(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function estAnomalie(temperature, humidite, conditions) {
  return (
    Math.abs(temperature - conditions.idealTemp) > TEMP_TOLERANCE ||
    Math.abs(humidite - conditions.idealHumidity) > HUMIDITY_TOLERANCE
  );
}
function trierFifo(lots) {
  return [...lots].sort((a, b) => new Date(a.storageDate) - new Date(b.storageDate));
}

describe("Conditions ideales par pays", () => {
  it("definit les seuils du Bresil : 29 C et 55 %", () => {
    expect(COUNTRY_CONDITIONS.BR.idealTemp).toBe(29);
    expect(COUNTRY_CONDITIONS.BR.idealHumidity).toBe(55);
  });
  it("definit les seuils de l'Equateur : 31 C et 60 %", () => {
    expect(COUNTRY_CONDITIONS.EC.idealTemp).toBe(31);
    expect(COUNTRY_CONDITIONS.EC.idealHumidity).toBe(60);
  });
  it("definit les seuils de la Colombie : 26 C et 80 %", () => {
    expect(COUNTRY_CONDITIONS.CO.idealTemp).toBe(26);
    expect(COUNTRY_CONDITIONS.CO.idealHumidity).toBe(80);
  });
  it("applique les tolerances du cahier des charges", () => {
    expect(TEMP_TOLERANCE).toBe(3);
    expect(HUMIDITY_TOLERANCE).toBe(2);
  });
  it("retourne les conditions du pays demande", () => {
    expect(getConditions("BR").name).toBe("Brésil");
    expect(getConditions("EC").name).toBe("Équateur");
  });
  it("retourne la Colombie par defaut si code inconnu", () => {
    expect(getConditions("ZZ").name).toBe("Colombie");
  });
});

describe("Calcul de l'anciennete d'un lot", () => {
  it("compte 0 jour pour un lot stocke aujourd'hui", () => {
    expect(daysInStorage(ilYAJours(0))).toBe(0);
  });
  it("compte 30 jours pour un lot stocke il y a un mois", () => {
    expect(daysInStorage(ilYAJours(30))).toBe(30);
  });
  it("compte 392 jours pour un lot de plus d'un an", () => {
    expect(daysInStorage(ilYAJours(392))).toBe(392);
  });
});

describe("Detection des lots perimes", () => {
  const estPerime = (date) => daysInStorage(date) >= EXPIRY_DAYS;
  it("fixe le seuil de peremption a 365 jours", () => {
    expect(EXPIRY_DAYS).toBe(365);
  });
  it("ne signale pas un lot de 364 jours", () => {
    expect(estPerime(ilYAJours(364))).toBe(false);
  });
  it("signale un lot atteignant 365 jours", () => {
    expect(estPerime(ilYAJours(365))).toBe(true);
  });
  it("signale un lot de 392 jours", () => {
    expect(estPerime(ilYAJours(392))).toBe(true);
  });
});

describe("Detection d'anomalie des conditions", () => {
  const colombie = COUNTRY_CONDITIONS.CO;
  it("accepte une mesure conforme", () => {
    expect(estAnomalie(26, 80, colombie)).toBe(false);
  });
  it("accepte les bornes de tolerance (23 et 29 C)", () => {
    expect(estAnomalie(23, 80, colombie)).toBe(false);
    expect(estAnomalie(29, 80, colombie)).toBe(false);
  });
  it("signale une temperature trop haute", () => {
    expect(estAnomalie(30.4, 80, colombie)).toBe(true);
  });
  it("signale une temperature trop basse", () => {
    expect(estAnomalie(18, 80, colombie)).toBe(true);
  });
  it("signale une humidite hors plage", () => {
    expect(estAnomalie(26, 84.6, colombie)).toBe(true);
  });
  it("applique les seuils propres a chaque pays", () => {
    expect(estAnomalie(30, 55, COUNTRY_CONDITIONS.BR)).toBe(false);
    expect(estAnomalie(30, 80, COUNTRY_CONDITIONS.CO)).toBe(true);
  });
});

describe("Tri FIFO des lots", () => {
  const lots = [
    { lotCode: "CO-2025-0355", storageDate: ilYAJours(19) },
    { lotCode: "CO-2024-0412", storageDate: ilYAJours(392) },
    { lotCode: "CO-2025-0233", storageDate: ilYAJours(121) },
  ];
  it("place le lot le plus ancien en premier", () => {
    expect(trierFifo(lots)[0].lotCode).toBe("CO-2024-0412");
  });
  it("place le lot le plus recent en dernier", () => {
    const t = trierFifo(lots);
    expect(t[t.length - 1].lotCode).toBe("CO-2025-0355");
  });
  it("ordonne tous les lots par anciennete", () => {
    expect(trierFifo(lots).map((l) => l.lotCode)).toEqual([
      "CO-2024-0412", "CO-2025-0233", "CO-2025-0355",
    ]);
  });
  it("ne modifie pas le tableau d'origine", () => {
    const avant = lots.map((l) => l.lotCode);
    trierFifo(lots);
    expect(lots.map((l) => l.lotCode)).toEqual(avant);
  });
  it("gere une liste vide", () => {
    expect(trierFifo([])).toEqual([]);
  });
});

describe("Libelles des statuts et alertes", () => {
  it("couvre les trois statuts de lot", () => {
    expect(Object.keys(LOT_STATUS)).toEqual(["compliant", "alert", "expired"]);
  });
  it("associe un libelle a chaque statut", () => {
    expect(LOT_STATUS.compliant.label).toBe("Conforme");
    expect(LOT_STATUS.alert.label).toBe("En alerte");
    expect(LOT_STATUS.expired.label).toBe("Périmé");
  });
  it("couvre les trois types d'alerte", () => {
    expect(Object.keys(ALERT_TYPE)).toEqual(["temperature", "humidity", "expiration"]);
  });
});
