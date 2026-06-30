import { COUNTRY_CONDITIONS } from "../api/constants";

const COUNTRY_TO_CODE = { brazil: "BR", ecuador: "EC", colombia: "CO" };

export default function CountrySwitcher({ selected, onSelect, health = {} }) {
  const countries = ["brazil", "ecuador", "colombia"];

  function statusFor(country) {
    const code = COUNTRY_TO_CODE[country];
    const label = country.charAt(0).toUpperCase() + country.slice(1);
    return health[label] || health[code] || "unknown";
  }

  return (
    <div className="country-switcher" role="tablist" aria-label="Sélection du pays">
      <button
        className={`country-switcher__item ${!selected ? "is-active" : ""}`}
        onClick={() => onSelect(null)}
        role="tab"
        aria-selected={!selected}
      >
        Tous les pays
      </button>
      {countries.map((country) => {
        const code = COUNTRY_TO_CODE[country];
        const conditions = COUNTRY_CONDITIONS[code];
        const status = statusFor(country);
        return (
          <button
            key={country}
            className={`country-switcher__item ${selected === country ? "is-active" : ""}`}
            onClick={() => onSelect(country)}
            role="tab"
            aria-selected={selected === country}
          >
            <span
              className={`country-switcher__dot country-switcher__dot--${
                status === "ok" ? "ok" : "down"
              }`}
              title={status === "ok" ? "Backend disponible" : "Backend indisponible"}
            />
            {conditions?.name || country}
          </button>
        );
      })}
    </div>
  );
}

export { COUNTRY_TO_CODE };