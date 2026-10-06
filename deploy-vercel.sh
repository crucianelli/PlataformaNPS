#!/bin/bash
#
# Deploy a PRODUCCIÓN en Vercel (puente mientras la VPS está caída).
#
# Deploya **siempre `main`**, sin importar en qué rama estés parado: arma un
# worktree descartable de main en /tmp y deploya desde ahí. Es al revés que
# deploy.sh, que exige que estés en main — acá no hace falta cambiar de rama,
# y es imposible mandar a producción la rama de migración por accidente.
#
# Las variables de entorno NO se pasan desde acá: viven en el proyecto de
# Vercel (Settings → Environment Variables, scope Production). Ver
# docs/07-deploy-vercel.md.
#
set -euo pipefail

PROJECT_ID="prj_VVrNksC8AwPcEoMROsTUwpVIGZF6"
ORG_ID="team_dHUtuz8oOQJd0Q1HO7UNmlaY"
REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE="$(mktemp -d -t nps-vercel-XXXXXX)/main"

limpiar() {
  git -C "$REPO_ROOT" worktree remove --force "$WORKTREE" 2>/dev/null || true
  rm -rf "$(dirname "$WORKTREE")"
}
trap limpiar EXIT

echo "→ Preparando worktree limpio de 'main'..."
git -C "$REPO_ROOT" worktree add --detach "$WORKTREE" main >/dev/null

COMMIT=$(git -C "$WORKTREE" log -1 --format='%h %s')
echo "  main = $COMMIT"

# Vincular al proyecto sin prompts interactivos.
mkdir -p "$WORKTREE/.vercel"
cat > "$WORKTREE/.vercel/project.json" <<JSON
{"projectId":"$PROJECT_ID","orgId":"$ORG_ID"}
JSON

echo "→ Deployando a producción..."
cd "$WORKTREE"
vercel deploy --prod --yes

echo "✓ Listo: https://plataforma-nps.vercel.app"
