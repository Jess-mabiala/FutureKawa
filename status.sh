#!/bin/bash
# =============================================================================
#  FutureKawa — Vérification de l'état des services
#  Auteurs : Alami Ghita · Ngye Jess Mabiala · YAPI Aymeric
# =============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

check_port() {
  local name=$1
  local port=$2
  local url=$3
  if nc -z localhost "$port" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} ${BOLD}$name${NC} → port $port actif  ${CYAN}$url${NC}"
  else
    echo -e "  ${RED}✗${NC} ${BOLD}$name${NC} → port $port inactif"
  fi
}

echo ""
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo -e "${BOLD}  État des services FutureKawa${NC}"
echo -e "${BOLD}══════════════════════════════════════${NC}"
echo ""
check_port "Frontend React"         5173  "http://localhost:5173"
check_port "API Colombie"           3002  "http://localhost:3002/api/lots"
check_port "API Brésil"             3000  "http://localhost:3000/api/lots"
check_port "API Équateur"           3001  "http://localhost:3001/api/lots"
check_port "API Siège (central)"    3003  "http://localhost:3003/api/countries"
echo ""
