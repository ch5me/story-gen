#!/usr/bin/env bash
# StoryGen first-slice acceptance smoke. Runs the full turbo gate, then boots
# the api + studio + reader dev servers and exercises the live paths.
# Usage: bash scripts/smoke-acceptance.sh
set -euo pipefail
cd "$(dirname "$0")/.."

API_PORT=48787
STUDIO_PORT=45180
READER_PORT=45181
PIDS=()
cleanup() {
  for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done
  pkill -f 'tsx src/dev-server' 2>/dev/null || true
  pkill -f 'apps/studio' 2>/dev/null || true
  pkill -f 'apps/reader' 2>/dev/null || true
}
trap cleanup EXIT

echo "== 1/4 turbo typecheck + test + build =="
pnpm turbo run typecheck test build

echo "== 2/4 api :$API_PORT (health + compile) =="
pnpm --filter @ch5me/storygen-api exec tsx src/dev-server.ts >/tmp/storygen-api-dev.log 2>&1 &
PIDS+=($!)
curl -sf --retry 40 --retry-connrefused --retry-delay 1 "http://127.0.0.1:$API_PORT/health" >/dev/null
echo "  health ok"
curl -sf -X POST "http://127.0.0.1:$API_PORT/projects/proj_rooftop/compile" \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);const w=j.web||j;if(w.version!==1)process.exit(1);console.log("  compile ok: nodes="+Object.keys(w.nodes).length+" renpy="+(j.renpy||"").length+"B ink="+(j.ink||"").length+"B")})'

echo "== 3/4 studio :$STUDIO_PORT =="
pnpm --filter @ch5me/storygen-studio dev >/tmp/storygen-studio-dev.log 2>&1 &
PIDS+=($!)
curl -sf --retry 50 --retry-connrefused --retry-delay 1 -o /dev/null "http://127.0.0.1:$STUDIO_PORT/"
echo "  studio serving"

echo "== 4/4 reader :$READER_PORT =="
pnpm --filter @ch5me/storygen-reader dev >/tmp/storygen-reader-dev.log 2>&1 &
PIDS+=($!)
curl -sf --retry 50 --retry-connrefused --retry-delay 1 -o /dev/null "http://127.0.0.1:$READER_PORT/"
echo "  reader serving"

echo "== ACCEPTANCE SMOKE PASSED =="
