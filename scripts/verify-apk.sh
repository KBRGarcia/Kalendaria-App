#!/usr/bin/env bash
# Verifica un APK de producción ANTES de instalarlo o publicarlo.
#
# Uso:   npm run release:verify [ruta/al/kalendaria.apk]
#        (por defecto busca ~/Descargas/kalendaria.apk o ~/Downloads/kalendaria.apk)
#
# Comprueba que el bundle lleva incrustada la referencia de tu proyecto de Supabase (si no,
# la app se cierra al abrir) y muestra tamaño y SHA-256 para landing/config.js.
set -euo pipefail

cd "$(dirname "$0")/.."

apk="${1:-}"
if [ -z "$apk" ]; then
  for candidate in "$HOME/Descargas/kalendaria.apk" "$HOME/Downloads/kalendaria.apk"; do
    [ -f "$candidate" ] && apk="$candidate" && break
  done
fi

if [ -z "$apk" ] || [ ! -f "$apk" ]; then
  echo "No se encontró el APK. Pasa la ruta: npm run release:verify -- /ruta/kalendaria.apk" >&2
  exit 1
fi

if [ ! -f .env.local ]; then
  echo "Falta .env.local: se necesita para conocer la referencia del proyecto de Supabase." >&2
  exit 1
fi

ref="$(sed -n 's#.*https://\([a-z0-9]*\)\.supabase\.co.*#\1#p' .env.local | head -1)"
if [ -z "$ref" ]; then
  echo "No se pudo leer EXPO_PUBLIC_SUPABASE_URL de .env.local." >&2
  exit 1
fi

if ! unzip -tq "$apk" >/dev/null 2>&1; then
  echo "✖ El archivo no es un APK/ZIP válido: $apk" >&2
  exit 1
fi

entries="$(unzip -Z1 "$apk")"
if ! grep -qx 'assets/index.android.bundle' <<<"$entries"; then
  echo "✖ El APK no contiene assets/index.android.bundle." >&2
  exit 1
fi

hits="$(unzip -p "$apk" assets/index.android.bundle | strings -n 8 | grep -c "$ref" || true)"
bytes="$(stat -c %s "$apk")"
mb="$(( (bytes + 524288) / 1048576 ))"
hash="$(sha256sum "$apk" | cut -d' ' -f1)"

echo "APK:     $apk"
echo "Tamaño:  ${bytes} bytes (≈ ${mb} MB)"
echo "SHA-256: ${hash}"

if [ "$hits" -lt 1 ]; then
  echo
  echo "✖ El bundle NO contiene la referencia del proyecto de Supabase." >&2
  echo "  No lo instales ni lo publiques: la app se cerraría al abrir." >&2
  echo "  Revisa que las variables existan en el entorno de EAS y que el código lea" >&2
  echo "  process.env.EXPO_PUBLIC_X de forma estática (npm test lo vigila)." >&2
  exit 1
fi

echo
echo "✔ Configuración de Supabase incrustada (coincidencias: ${hits})."
echo
echo "Para landing/config.js:"
echo "  apkSize: '${mb} MB',"
echo "  sha256: '${hash}',"
