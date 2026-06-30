# FutureKawa — Frontend Web (siège)

Interface de consultation des stocks et de supervision des conditions de
conservation (température / humidité) pour les entrepôts de café vert.

Construit avec **React + Vite** et **Chart.js**. Consomme l'API REST d'un
backend pays (Spring Boot).

## Prérequis

- Node.js 18+
- Un backend pays démarré et accessible (par défaut `http://localhost:3002`,
  cf. backend Colombie).

## Installation

```bash
npm install
cp .env.example .env   # puis ajustez si besoin
npm run dev            # http://localhost:5173
```

## Configuration (`.env`)

| Variable             | Rôle                                              | Défaut                  |
|----------------------|---------------------------------------------------|-------------------------|
| `VITE_API_BASE_URL`  | URL du backend pays ciblé                         | `http://localhost:3002` |
| `VITE_COUNTRY_CODE`  | Pays affiché pour les conditions idéales (BR/EC/CO) | `CO`                    |

## Build de production

```bash
npm run build     # génère dist/
npm run preview   # sert le build localement
```

## Fonctionnalités (cf. cahier des charges §III)

- Sélection d'une exploitation puis d'un entrepôt.
- Liste des lots triés **FIFO** (entrée en stock la plus ancienne en premier),
  avec ancienneté et statut (conforme / en alerte / périmé).
- Détail d'un lot : courbes température/humidité depuis sa date de stockage,
  avec bande de tolérance pays affichée sur le graphique.
- Panneau des alertes actives (température, humidité, péremption) avec indicateur
  d'envoi d'email et action de résolution.

## API consommée

| Méthode | Route                                                  | Usage                        |
|---------|--------------------------------------------------------|------------------------------|
| GET     | `/api/lots`                                            | Liste des lots               |
| GET     | `/api/lots/{id}`                                       | Détail d'un lot              |
| PATCH   | `/api/lots/{id}/status?status=...`                     | Changer le statut            |
| GET     | `/api/readings/warehouse/{id}/history?from=&to=`       | Historique des mesures       |
| GET     | `/api/alerts`                                          | Alertes actives              |
| PATCH   | `/api/alerts/{id}/resolve`                             | Résoudre une alerte          |

## Notes d'architecture

- Les **exploitations et entrepôts** sont reconstruits côté front à partir des
  champs `exploitationName` / `warehouseName` des lots, le backend n'exposant pas
  de route de listing dédiée. Ajouter `/api/exploitations` et `/api/warehouses`
  côté backend simplifierait ce point.
- Les **relevés capteurs** sont rattachés à un entrepôt (et non à un lot
  individuel) : le détail d'un lot affiche donc les conditions de son entrepôt
  sur la période depuis son entrée en stock.
