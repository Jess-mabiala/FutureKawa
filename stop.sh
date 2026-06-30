#!/bin/bash
# =============================================================================
#  FutureKawa — Script d'arrêt propre
#  Auteurs : Alami Ghita · Ngye Jess Mabiala · YAPI Aymeric
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/.futurekawa_pids"

log_ok()   { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_info() { echo -e "${CYAN}[INFO]${NC}  $1"; }

echo -e "\n${BOLD}Arrêt de FutureKawa...${NC}\n"

if [ ! -f "$PID_FILE" ]; then
  log_warn "Aucun fichier PID trouvé ($PID_FILE)."
  log_warn "Tentative d'arrêt par port (fallback)..."
  for port in 3000 3001 3002 3003 5173; do
    pid=$(lsof -ti :"$port" 2>/dev/null)
    if [ -n "$pid" ]; then
      kill "$pid" 2>/dev/null && log_ok "Processus sur port $port arrêté (PID $pid)"
    fi
  done
  echo ""
  exit 0
fi

# Lire les PIDs enregistrés et arrêter chaque processus
while IFS=':' read -r name pid; do
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    log_ok "$name arrêté (PID $pid)"
  else
    log_warn "$name (PID $pid) — déjà arrêté ou introuvable"
  fi
done < "$PID_FILE"

rm -f "$PID_FILE"

echo ""
log_info "Tous les services FutureKawa sont arrêtés."
echo -e "  Logs conservés dans : ${CYAN}./logs/${NC}\n"
