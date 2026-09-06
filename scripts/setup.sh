#!/usr/bin/env bash
# Agronavis — one-command setup
set -euo pipefail

cd "$(dirname "$0")/.."

bold=$(tput bold 2>/dev/null || true)
green=$(tput setaf 2 2>/dev/null || true)
yellow=$(tput setaf 3 2>/dev/null || true)
reset=$(tput sgr0 2>/dev/null || true)

echo
echo "${bold}${green}Agronavis setup${reset}"
echo

command -v node >/dev/null || { echo "Node.js is required: https://nodejs.org"; exit 1; }
command -v npm  >/dev/null || { echo "npm is required."; exit 1; }

node_major=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_major" -lt 20 ]; then
  echo "Node 20 or newer is required. Found $(node -v)."
  exit 1
fi
echo "Node $(node -v), npm $(npm -v)"

echo
echo "${bold}Installing dependencies${reset}"
npm install --legacy-peer-deps

# One .env for the whole repo. Both the API and the Expo app read it.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
else
  echo ".env already exists, leaving it alone"
fi

missing=()
grep -q '^SUPABASE_URL=https://[^Y]' .env || missing+=("SUPABASE_URL")
grep -q '^OPENWEATHER_API_KEY=.\+' .env || missing+=("OPENWEATHER_API_KEY")
grep -q '^AGMARKNET_API_KEY=.\+' .env || missing+=("AGMARKNET_API_KEY")
grep -q '^SUPABASE_SERVICE_ROLE_KEY=.\+' .env || missing+=("SUPABASE_SERVICE_ROLE_KEY")
grep -q '^EXPO_PUBLIC_SUPABASE_ANON_KEY=.\+' .env || missing+=("EXPO_PUBLIC_SUPABASE_ANON_KEY")

echo
if [ ${#missing[@]} -gt 0 ]; then
  echo "${bold}${yellow}Fill these in .env before starting:${reset}"
  for key in "${missing[@]}"; do echo "  - $key"; done
  echo "  Where each one comes from: docs/free-apis.md"
  echo
fi

echo "${bold}Then:${reset}"
echo "  npm run db:push    apply supabase/migrations to your project"
echo "  npm run dev        API on :3001 and Expo together"
echo "  npm run verify     typecheck, lint and test"
echo
