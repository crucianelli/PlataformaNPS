#!/bin/bash
set -e

# ⚠️ Verificar con Franco el nombre exacto de la imagen en Docker Hub
IMAGE_NAME="crucianelli/npsplatform"
TAG="latest"

# Cargar variables de entorno desde .env.local
if [ ! -f .env.local ]; then
  echo "Error: no se encontró .env.local"
  exit 1
fi
source .env.local

echo "→ Buildeando imagen $IMAGE_NAME:$TAG..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  -t "$IMAGE_NAME:$TAG" \
  .

echo "→ Pusheando a Docker Hub..."
docker push "$IMAGE_NAME:$TAG"

echo "✓ Listo. Watchtower actualizará la VPS en menos de 5 minutos."
