#!/usr/bin/env bash
# Agronavis One-Command Setup Script
set -e

BOLD=$(tput bold)
GREEN=$(tput setaf 2)
YELLOW=$(tput setaf 3)
RESET=$(tput sgr0)

echo ""
echo "${BOLD}${GREEN}Agronavis — Project Setup${RESET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check prerequisites
echo "${BOLD}Checking prerequisites...${RESET}"
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1  || { echo "npm is required."; exit 1; }
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 20 ]; then echo "Node.js >= 20 required. Found: $(node -v)"; exit 1; fi
echo "Node $(node -v) / npm $(npm -v)"

# Install dependencies
echo ""
echo "${BOLD}Installing workspace dependencies...${RESET}"
npm install --legacy-peer-deps
echo "Dependencies installed"

# Environment files
echo ""
echo "${BOLD}Setting up environment files...${RESET}"
if [ ! -f .env ]; then cp .env.example .env; echo "Created root .env"; fi
if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; echo "Created backend/.env"; fi
if [ ! -f apps/mobile/.env ]; then cp apps/mobile/.env.example apps/mobile/.env; echo "Created apps/mobile/.env"; fi

echo ""
echo "${BOLD}${YELLOW}Next Steps:${RESET}"
echo "  1. Edit ${BOLD}backend/.env${RESET} — add your DATABASE_URL and CLERK_SECRET_KEY"
echo "  2. Edit ${BOLD}apps/mobile/.env${RESET} — add your EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"
echo "  3. Run ${BOLD}cd backend && npm run db:push${RESET} to create database tables"
echo ""
echo "${BOLD}Start development:${RESET}"
echo "  ${GREEN}npm run dev:backend${RESET}   — API server on :3001"
echo "  ${GREEN}npm run dev:mobile${RESET}    — Expo"
echo "  ${GREEN}npm run dev${RESET}           — Both concurrently"
echo ""
echo "${BOLD}${GREEN}Setup complete.${RESET}"
