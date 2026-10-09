#!/usr/bin/env bash
# Generates the Android release keystore and prints the four GitHub secrets the
# APK workflow needs. Run this once, ever.
#
# The keystore is the app's identity. An APK signed with a different key cannot
# update one already installed, so if you lose this file every user has to
# uninstall and reinstall. Back it up somewhere you trust.
set -euo pipefail

cd "$(dirname "$0")/.."

KEYSTORE=${KEYSTORE:-agronavis-release.keystore}
ALIAS=${ALIAS:-agronavis}
VALIDITY_DAYS=10950   # 30 years; Play requires at least 25

if [ -f "$KEYSTORE" ]; then
  echo "$KEYSTORE already exists. Refusing to overwrite it — that would orphan"
  echo "every installed copy of the app. Delete it deliberately if you are sure."
  exit 1
fi

command -v keytool >/dev/null || { echo "keytool is required (install a JDK)."; exit 1; }

STORE_PASS=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
KEY_PASS=$STORE_PASS

keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 4096 \
  -validity "$VALIDITY_DAYS" \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=Agronavis, OU=Engineering, O=Agronavis, L=Kolkata, S=West Bengal, C=IN"

echo
echo "Created $KEYSTORE. It is git-ignored — keep your own backup."
echo
echo "Set the secrets (needs the gh CLI, authenticated):"
echo
echo "  gh secret set ANDROID_KEYSTORE_BASE64 --body \"\$(base64 -i $KEYSTORE | tr -d '\\n')\""
echo "  gh secret set ANDROID_KEYSTORE_PASSWORD --body '$STORE_PASS'"
echo "  gh secret set ANDROID_KEY_ALIAS --body '$ALIAS'"
echo "  gh secret set ANDROID_KEY_PASSWORD --body '$KEY_PASS'"
echo
echo "And the four values the app is built with:"
echo
echo "  gh secret set EXPO_PUBLIC_API_URL --body 'https://<your-render-service>.onrender.com/api/v1'"
echo "  gh secret set EXPO_PUBLIC_SUPABASE_URL --body \"\$(grep '^EXPO_PUBLIC_SUPABASE_URL=' .env | cut -d= -f2-)\""
echo "  gh secret set EXPO_PUBLIC_SUPABASE_ANON_KEY --body \"\$(grep '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' .env | cut -d= -f2-)\""
echo "  gh secret set EXPO_PUBLIC_MAPBOX_TOKEN --body \"\$(grep '^EXPO_PUBLIC_MAPBOX_TOKEN=' .env | cut -d= -f2-)\""
echo "  gh secret set MAPBOX_DOWNLOADS_TOKEN --body \"\$(grep '^MAPBOX_DOWNLOADS_TOKEN=' .env | cut -d= -f2-)\""
echo
echo "Then: Actions ▸ Android APK ▸ Run workflow."
