# ☕ FutureKawa — Suivi IoT des stocks de café vert

Solution applicative distribuée multi-pays pour le suivi des stocks de café vert et la surveillance des conditions de conservation (température / humidité) via un dispositif IoT.

> Projet réalisé dans le cadre de la **MSPR Bloc 4 — RNCP35584** (EPSI).
> Auteurs : **Alami Ghita**, **Ngye Jess Mabiala**, **Yapi Aymeric**.

---

## 📋 Sommaire

- [Présentation](#-présentation)
- [Architecture](#-architecture)
- [Stack technique](#-stack-technique)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Lancement du projet](#-lancement-du-projet)
- [Configuration](#-configuration)
- [Structure du dépôt](#-structure-du-dépôt)
- [API REST](#-api-rest)
- [Tests](#-tests)
- [Dépannage](#-dépannage)

---

## 🌍 Présentation

FutureKawa est une entreprise de caféiculture opérant dans trois pays (Brésil, Équateur, Colombie). Cette solution permet de :

- **Centraliser** le suivi des stocks par pays et par entrepôt
- **Tracer** les lots de café vert et appliquer une logique **FIFO** (premier entré, premier sorti)
- **Surveiller** automatiquement la température et l'humidité via des capteurs IoT (protocole MQTT)
- **Alerter** par email en cas de conditions hors plage ou de lot dépassant 365 jours
- **Superviser** l'ensemble depuis une interface Web unique au siège

---

## 🏗 Architecture

L'architecture est **distribuée** : chaque pays dispose d'un backend autonome (base de données + broker MQTT + API REST), et le siège dispose d'un backend central qui consolide les données des pays et alimente le frontend Web.

```
        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
        │   Brésil     │   │   Équateur   │   │   Colombie   │
        │  IoT → MQTT  │   │  IoT → MQTT  │   │  IoT → MQTT  │
        │  API :3001   │   │  API :3003   │   │  API :3002   │
        │  PostgreSQL  │   │  PostgreSQL  │   │  PostgreSQL  │
        └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
               │                  │                  │
               └──────────────────┼──────────────────┘
                                  ▼
                       ┌────────────────────┐
                       │  Backend central   │
                       │   (siège) :3000    │
                       └─────────┬──────────┘
                                 ▼
                       ┌────────────────────┐
                       │  Frontend React    │
                       │      :5173         │
                       └────────────────────┘
```

| Service           | Port | Base de données        |
|-------------------|------|------------------------|
| Backend central   | 3000 | `futurekawa_central`   |
| Backend Brésil    | 3001 | `futurekawa_brazil`    |
| Backend Colombie  | 3002 | `futurekawa_colombia`  |
| Backend Équateur  | 3003 | `futurekawa_ecuador`   |
| Frontend React    | 5173 | —                      |

---

## 🛠 Stack technique

**Backend**
- Java 23 + Spring Boot
- Spring Web (API REST), Spring Data JPA / Hibernate
- Spring Integration MQTT, Spring Mail
- PostgreSQL
- Lombok
- Maven

**IoT**
- Microcontrôleur + capteur de température / humidité
- Broker MQTT (Mosquitto)

**Frontend**
- React 18 + Vite
- Chart.js (courbes température / humidité)

---

## ✅ Prérequis

Installez au préalable :

- **Java 23** (ou JDK compatible) — `java -version`
- **Maven** (ou utilisez le wrapper `./mvnw` fourni)
- **Node.js 18+** et **npm** — `node -v`
- **PostgreSQL** (en local sur le port 5432)
- **Mosquitto** (broker MQTT) pour la partie IoT

---

## ⚙️ Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-depot>
cd FutureKawa
```

### 2. Créer les bases de données PostgreSQL

Créez les quatre bases, puis importez les scripts SQL fournis dans le dossier `sql/` :

```bash
# Créer les bases
createdb futurekawa_brazil
createdb futurekawa_colombia
createdb futurekawa_ecuador
createdb futurekawa_central

# Importer les schémas
psql -d futurekawa_brazil   -f sql/futurekawa_bresil.sql
psql -d futurekawa_colombia -f sql/futurekawa_colombia.sql
psql -d futurekawa_ecuador  -f sql/futurekawa_ecuador.sql
psql -d futurekawa_central  -f sql/futurekawa_central.sql
```

> Identifiants par défaut (à adapter dans les `application.properties`) :
> utilisateur `postgres`, mot de passe `postgres1234`.

### 3. Configurer le frontend

```bash
cd Frontend
cp .env.example .env
npm install
cd ..
```

---

## 🚀 Lancement du projet

### Option A — Scripts fournis (recommandé)

Des scripts sont fournis à la racine pour démarrer l'ensemble :

```bash
chmod +x start.sh stop.sh status.sh   # une seule fois

./start.sh            # démarre tous les backends + le frontend
./start.sh backend    # backends uniquement
./start.sh frontend   # frontend uniquement
./status.sh           # vérifie l'état des services
./stop.sh             # arrête tout proprement
```

### Option B — Démarrage manuel

**Backends** (un terminal par backend, ou en arrière-plan) :

```bash
cd Backend/futurekawa_brazil   && ./mvnw spring-boot:run   # port 3001
cd Backend/futurekawa_colombia && ./mvnw spring-boot:run   # port 3002
cd Backend/futurekawa_ecuador  && ./mvnw spring-boot:run   # port 3003
cd Backend/futurekawa_central  && ./mvnw spring-boot:run   # port 3000
```

**Frontend** :

```bash
cd Frontend
npm run dev    # http://localhost:5173
```

> ⚠️ Démarrez les backends pays **avant** le backend central, car ce dernier les interroge au démarrage.

---

## 🔧 Configuration

### Backends — `src/main/resources/application.properties`

Chaque backend pays configure sa base, son broker MQTT et l'envoi d'emails :

```properties
server.port=3001
spring.datasource.url=jdbc:postgresql://localhost:5432/futurekawa_brazil
spring.datasource.username=postgres
spring.datasource.password=postgres1234

mqtt.broker.url=tcp://localhost:1883
mqtt.broker.topic=futurekawa/brazil/#

spring.mail.username=CHANGE_ME    # ← à renseigner pour les alertes email
spring.mail.password=CHANGE_ME
```

Le backend central déclare les URLs des pays :

```properties
country.brazil.url=http://localhost:3001
country.colombia.url=http://localhost:3002
country.ecuador.url=http://localhost:3003
```

### Frontend — `.env`

```properties
VITE_API_BASE_URL=http://localhost:3002   # backend pays ciblé
VITE_COUNTRY_CODE=CO                       # BR | EC | CO
```

---

## 📁 Structure du dépôt

```
FutureKawa/
├── Backend/
│   ├── futurekawa_brazil/      # Backend pays Brésil (:3001)
│   ├── futurekawa_colombia/    # Backend pays Colombie (:3002)
│   ├── futurekawa_ecuador/     # Backend pays Équateur (:3003)
│   └── futurekawa_central/     # Backend central siège (:3000)
├── Frontend/                   # Interface React + Vite (:5173)
├── sql/                        # Scripts SQL des 4 bases
├── start.sh / stop.sh / status.sh
└── README.md
```

Chaque backend pays suit la même organisation :

```
src/main/java/com/example/futurekawa_<pays>/
├── controller/   # Endpoints REST (Lot, SensorReading, Alert)
├── service/      # Logique métier (lots, mesures, alertes, scheduler)
├── repository/   # Accès données (Spring Data JPA)
├── entity/       # Entités JPA (Country, Lot, Warehouse, …)
├── dto/          # Objets de transfert
└── enums/        # LotStatus, AlertType
```

---

## 🔌 API REST

### Backend pays

| Méthode | Route                              | Description                            |
|---------|------------------------------------|----------------------------------------|
| `POST`  | `/api/lots`                        | Enregistrer un nouveau lot             |
| `GET`   | `/api/lots`                        | Lister tous les lots                   |
| `GET`   | `/api/lots/{id}`                   | Consulter un lot                       |
| `GET`   | `/api/lots/warehouse/{id}`         | Lots d'un entrepôt (triés FIFO)        |
| `PATCH` | `/api/lots/{id}/status`            | Mettre à jour le statut d'un lot       |
| `GET`   | `/api/readings/warehouse/{id}/latest`  | Derniers relevés d'un entrepôt     |
| `GET`   | `/api/readings/warehouse/{id}/history` | Historique des relevés             |
| `GET`   | `/api/alerts`                      | Lister les alertes                     |
| `PATCH` | `/api/alerts/{id}/resolve`         | Marquer une alerte comme résolue       |

### Backend central (siège)

| Méthode | Route                                | Description                          |
|---------|--------------------------------------|--------------------------------------|
| `GET`   | `/api/central/consolidation`         | Consolidation globale des trois pays |
| `GET`   | `/api/central/lots`                  | Lots de tous les pays                |
| `GET`   | `/api/central/lots/{country}`        | Lots d'un pays                       |
| `GET`   | `/api/central/alerts`                | Alertes de tous les pays             |
| `GET`   | `/api/central/health`                | État de santé des backends pays      |

---

## 🧪 Tests

Chaque backend dispose d'un test de chargement du contexte Spring Boot :

```bash
cd Backend/futurekawa_brazil
./mvnw test
```

Les routes peuvent également être testées manuellement :

```bash
# Lister les lots du Brésil
curl http://localhost:3001/api/lots

# Créer un lot
curl -X POST http://localhost:3001/api/lots \
  -H "Content-Type: application/json" \
  -d '{"lotCode":"BR-001","warehouseId":1,"storageDate":"2025-01-15"}'
```

---

## 🩺 Dépannage

| Problème | Solution |
|----------|----------|
| `Connection refused` sur un port | Vérifiez que le service est démarré (`./status.sh`) |
| Le frontend n'affiche pas de données | Vérifiez `VITE_API_BASE_URL` dans `Frontend/.env` et que le backend ciblé tourne |
| Erreur de connexion PostgreSQL | Vérifiez que PostgreSQL tourne sur le port 5432 et que les bases existent |
| Le central renvoie un pays `unavailable` | Le backend de ce pays n'est pas démarré ou injoignable |
| Pas d'alerte email | Renseignez `spring.mail.username` / `password` dans l'`application.properties` |

---

## 📄 Licence

Projet académique réalisé dans le cadre de la formation EPSI (MSPR Bloc 4 — RNCP35584).
