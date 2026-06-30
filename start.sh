#!/bin/bash
# =============================================================================
#  FutureKawa — Script de démarrage complet
#  Auteurs : Alami Ghita · Ngye Jess Mabiala · YAPI Aymeric
# =============================================================================
#
#  Usage :
#    ./start.sh            → démarre tout (backends + frontend)
#    ./start.sh backend    → backends Spring Boot uniquement
#    ./start.sh frontend   → frontend uniquement
#    ./start.sh colombia   → backend Colombie uniquement
#    ./start.sh central    → backend siège uniquement
#
# =============================================================================

# ── Couleurs terminal ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ── Chemins relatifs (à adapter si besoin) ────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_COLOMBIA="$ROOT_DIR/Backend/futurekawa_colombia"
BACKEND_CENTRAL="$ROOT_DIR/Backend/futurekawa_central"
BACKEND_BRAZIL="$ROOT_DIR/Backend/futurekawa_brazil"
BACKEND_ECUADOR="$ROOT_DIR/Backend/futurekawa_ecuador"
FRONTEND_DIR="$ROOT_DIR/Frontend"

# ── Ports ─────────────────────────────────────────────────────────────────────
PORT_COLOMBIA=3002
PORT_BRAZIL=3000
PORT_ECUADOR=3001
PORT_CENTRAL=3003
PORT_FRONTEND=5173

# ── Fichier de PID pour stop.sh ───────────────────────────────────────────────
PID_FILE="$ROOT_DIR/.futurekawa_pids"

# =============================================================================
#  Fonctions utilitaires
# =============================================================================

log_info()    { echo -e "${CYAN}[INFO]${NC}  $1"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
log_section() { echo -e "\n${BOLD}${BLUE}══════════════════════════════════════════${NC}"; echo -e "${BOLD}${BLUE}  $1${NC}"; echo -e "${BOLD}${BLUE}══════════════════════════════════════════${NC}\n"; }

check_command() {
  if ! command -v "$1" &>/dev/null; then
    log_error "Commande '$1' introuvable. Installe-la avant de continuer."
    exit 1
  fi
}

port_in_use() {
  lsof -i :"$1" &>/dev/null
}

wait_for_port() {
  local port=$1
  local name=$2
  local max=30
  local count=0
  echo -ne "${YELLOW}  En attente de $name (port $port)${NC}"
  while ! nc -z localhost "$port" 2>/dev/null; do
    sleep 1
    count=$((count + 1))
    echo -ne "."
    if [ $count -ge $max ]; then
      echo -e " ${RED}timeout${NC}"
      log_error "$name n'a pas démarré dans les temps (${max}s)."
      return 1
    fi
  done
  echo -e " ${GREEN}✓${NC}"
  return 0
}

# =============================================================================
#  Pré-requis
# =============================================================================
check_prerequisites() {
  log_section "Vérification des prérequis"
  check_command java
  check_command mvn || true   # ou mvnw
  check_command node
  check_command npm

  JAVA_VER=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
  if [ "$JAVA_VER" -lt 21 ] 2>/dev/null; then
    log_warn "Java $JAVA_VER détecté — le projet requiert Java 21+."
  else
    log_ok "Java $JAVA_VER OK"
  fi

  NODE_VER=$(node -v)
  log_ok "Node.js $NODE_VER OK"
}

# =============================================================================
#  Démarrage d'un backend Spring Boot (Maven)
# =============================================================================
start_backend() {
  local name=$1
  local dir=$2
  local port=$3
  local profile=${4:-default}

  log_section "Backend — $name (port $port)"

  if [ ! -d "$dir" ]; then
    log_warn "Dossier '$dir' introuvable — backend $name ignoré."
    return
  fi

  if port_in_use "$port"; then
    log_warn "Port $port déjà occupé — $name supposé déjà démarré."
    return
  fi

  # Utiliser le wrapper Maven s'il est disponible, sinon mvn système
  if [ -f "$dir/mvnw" ]; then
    MVN_CMD="./mvnw"
    chmod +x "$dir/mvnw" 2>/dev/null
  else
    MVN_CMD="mvn"
  fi

  log_info "Build + démarrage de $name..."
  cd "$dir" || return

  $MVN_CMD spring-boot:run \
    -Dspring-boot.run.arguments="--server.port=$port" \
    -q \
    > "$ROOT_DIR/logs/${name}.log" 2>&1 &

  local pid=$!
  echo "$name:$pid" >> "$PID_FILE"
  log_info "$name démarré en arrière-plan (PID $pid) → logs/${name}.log"

  cd "$ROOT_DIR" || return
  wait_for_port "$port" "$name"
}

# =============================================================================
#  Démarrage du frontend React / Vite
# =============================================================================
start_frontend() {
  log_section "Frontend React — Vite (port $PORT_FRONTEND)"

  if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "Dossier Frontend introuvable : $FRONTEND_DIR"
    return
  fi

  if port_in_use "$PORT_FRONTEND"; then
    log_warn "Port $PORT_FRONTEND déjà occupé — frontend supposé déjà démarré."
    return
  fi

  cd "$FRONTEND_DIR" || return

  # Copier .env.example → .env si absent
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    log_info ".env créé depuis .env.example"
  fi

  # Installer les dépendances si node_modules absent
  if [ ! -d "node_modules" ]; then
    log_info "Installation des dépendances npm..."
    npm install --silent
    log_ok "Dépendances installées"
  fi

  log_info "Démarrage du frontend Vite..."
  npm run dev > "$ROOT_DIR/logs/frontend.log" 2>&1 &
  local pid=$!
  echo "frontend:$pid" >> "$PID_FILE"
  log_info "Frontend démarré en arrière-plan (PID $pid) → logs/frontend.log"

  cd "$ROOT_DIR" || return
  wait_for_port "$PORT_FRONTEND" "Frontend"
}

# =============================================================================
#  Résumé des URLs
# =============================================================================
print_summary() {
  log_section "FutureKawa — Prêt 🚀"
  echo -e "  ${GREEN}Frontend${NC}          → ${BOLD}http://localhost:$PORT_FRONTEND${NC}"
  echo -e "  ${GREEN}API Colombie${NC}      → ${BOLD}http://localhost:$PORT_COLOMBIA${NC}"
  echo -e "  ${GREEN}API Brésil${NC}        → ${BOLD}http://localhost:$PORT_BRAZIL${NC}"
  echo -e "  ${GREEN}API Équateur${NC}      → ${BOLD}http://localhost:$PORT_ECUADOR${NC}"
  echo -e "  ${GREEN}API Siège (central)${NC}→ ${BOLD}http://localhost:$PORT_CENTRAL${NC}"
  echo ""
  echo -e "  Logs disponibles dans : ${CYAN}./logs/${NC}"
  echo -e "  Pour arrêter :          ${YELLOW}./stop.sh${NC}"
  echo ""
}

# =============================================================================
#  MAIN
# =============================================================================

# Créer le dossier de logs
mkdir -p "$ROOT_DIR/logs"
> "$PID_FILE"   # Réinitialiser les PIDs

MODE=${1:-all}

case "$MODE" in
  all)
    check_prerequisites
    start_backend "futurekawa_colombia" "$BACKEND_COLOMBIA" "$PORT_COLOMBIA"
    start_backend "futurekawa_brazil"   "$BACKEND_BRAZIL"   "$PORT_BRAZIL"
    start_backend "futurekawa_ecuador"  "$BACKEND_ECUADOR"  "$PORT_ECUADOR"
    start_backend "futurekawa_central"  "$BACKEND_CENTRAL"  "$PORT_CENTRAL"
    start_frontend
    print_summary
    ;;
  backend)
    check_prerequisites
    start_backend "futurekawa_colombia" "$BACKEND_COLOMBIA" "$PORT_COLOMBIA"
    start_backend "futurekawa_brazil"   "$BACKEND_BRAZIL"   "$PORT_BRAZIL"
    start_backend "futurekawa_ecuador"  "$BACKEND_ECUADOR"  "$PORT_ECUADOR"
    start_backend "futurekawa_central"  "$BACKEND_CENTRAL"  "$PORT_CENTRAL"
    log_ok "Tous les backends sont démarrés."
    ;;
  frontend)
    check_prerequisites
    start_frontend
    log_ok "Frontend démarré → http://localhost:$PORT_FRONTEND"
    ;;
  colombia)
    check_prerequisites
    start_backend "futurekawa_colombia" "$BACKEND_COLOMBIA" "$PORT_COLOMBIA"
    log_ok "Backend Colombie démarré → http://localhost:$PORT_COLOMBIA"
    ;;
  central)
    check_prerequisites
    start_backend "futurekawa_central" "$BACKEND_CENTRAL" "$PORT_CENTRAL"
    log_ok "Backend siège démarré → http://localhost:$PORT_CENTRAL"
    ;;
  *)
    echo "Usage : ./start.sh [all|backend|frontend|colombia|central]"
    exit 1
    ;;
esac
