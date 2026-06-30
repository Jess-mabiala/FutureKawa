import { useState, useMemo, useEffect } from "react";
import { useInventory } from "./hooks/useInventory";
import { lotsApi, alertsApi } from "./api/client";
import { getConditions, COUNTRY_CODE } from "./api/constants";
import Sidebar from "./components/Sidebar";
import LotTable from "./components/LotTable";
import LotDetail from "./components/LotDetail";
import AlertPanel from "./components/AlertPanel";
import { Banner } from "./components/ui";
import "./App.css";

export default function App() {
  const { lots, exploitations, loading, error, reload } = useInventory();
  const conditions = getConditions(COUNTRY_CODE);

  const [selectedExploitation, setSelectedExploitation] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Charge les alertes actives (vue globale)
  useEffect(() => {
    alertsApi.getActive().then(setAlerts).catch(() => setAlerts([]));
  }, [lots]);

  // Lots filtrés par sélection, triés FIFO (plus ancien d'abord)
  const visibleLots = useMemo(() => {
    let list = lots;
    if (selectedExploitation) {
      list = list.filter((l) => l.exploitationName === selectedExploitation);
    }
    if (selectedWarehouse) {
      list = list.filter((l) => l.warehouseId === selectedWarehouse);
    }
    return [...list].sort(
      (a, b) => new Date(a.storageDate) - new Date(b.storageDate)
    );
  }, [lots, selectedExploitation, selectedWarehouse]);

  async function handleResolveAlert(id) {
    await alertsApi.resolve(id);
    const fresh = await alertsApi.getActive();
    setAlerts(fresh);
  }

  async function handleStatusChange(lotId, status) {
    await lotsApi.updateStatus(lotId, status);
    reload();
    if (selectedLot?.id === lotId) {
      const updated = await lotsApi.getById(lotId);
      setSelectedLot(updated);
    }
  }

  return (
    <div className="app">
      <Sidebar
        country={conditions.name}
        conditions={conditions}
        exploitations={exploitations}
        selectedExploitation={selectedExploitation}
        selectedWarehouse={selectedWarehouse}
        onSelectExploitation={(name) => {
          setSelectedExploitation(name);
          setSelectedWarehouse(null);
          setSelectedLot(null);
        }}
        onSelectWarehouse={(id) => {
          setSelectedWarehouse(id);
          setSelectedLot(null);
        }}
        activeAlertCount={alerts.length}
      />

      <main className="main">
        <header className="main__head">
          <div>
            <p className="eyebrow">Suivi des stocks · {conditions.name}</p>
            <h1>Entrepôts &amp; conservation</h1>
          </div>
          <button className="btn btn--ghost" onClick={reload}>
            Actualiser
          </button>
        </header>

        {error && (
          <Banner tone="danger" title="Connexion au backend impossible">
            {error.message} Démarrez le backend pays puis cliquez sur Actualiser.
          </Banner>
        )}

        <div className="grid">
          <section className="panel">
            <LotTable
              lots={visibleLots}
              loading={loading}
              selectedLotId={selectedLot?.id}
              onSelect={setSelectedLot}
            />
          </section>

          <aside className="rail">
            <AlertPanel alerts={alerts} onResolve={handleResolveAlert} />
          </aside>
        </div>

        {selectedLot && (
          <LotDetail
            lot={selectedLot}
            conditions={conditions}
            onClose={() => setSelectedLot(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>
    </div>
  );
}
