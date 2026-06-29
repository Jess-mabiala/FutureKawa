import { daysInStorage, EXPIRY_DAYS } from "../api/constants";
import { StatusPill, Spinner, EmptyState } from "./ui";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LotTable({ lots, loading, selectedLotId, onSelect }) {
  if (loading) return <Spinner label="Chargement des lots…" />;

  if (lots.length === 0) {
    return (
      <EmptyState title="Aucun lot à afficher">
        Sélectionnez une autre exploitation, ou vérifiez que des lots sont
        enregistrés dans cet entrepôt.
      </EmptyState>
    );
  }

  return (
    <div className="lottable">
      <div className="lottable__head">
        <h2>Lots en stock</h2>
        <span className="lottable__fifo">Tri FIFO · plus anciens en premier</span>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Lot</th>
            <th>Entrepôt</th>
            <th>Entrée en stock</th>
            <th>Ancienneté</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => {
            const age = daysInStorage(lot.storageDate);
            const nearExpiry = age >= EXPIRY_DAYS;
            const warnExpiry = age >= EXPIRY_DAYS - 30 && age < EXPIRY_DAYS;
            return (
              <tr
                key={lot.id}
                className={`table__row table__row--${lot.status} ${
                  selectedLotId === lot.id ? "is-selected" : ""
                }`}
                onClick={() => onSelect(lot)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(lot);
                  }
                }}
              >
                <td className="mono">{lot.lotCode}</td>
                <td>{lot.warehouseName}</td>
                <td>{formatDate(lot.storageDate)}</td>
                <td>
                  <span
                    className={`age ${
                      nearExpiry ? "age--over" : warnExpiry ? "age--near" : ""
                    }`}
                  >
                    {age} j
                  </span>
                </td>
                <td>
                  <StatusPill status={lot.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
