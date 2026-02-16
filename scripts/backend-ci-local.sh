#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICES=("auth-service" "user-service" "role-service" "audit-service")
RUN_LINT="${RUN_LINT:-0}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"
ONLY_SERVICE="${ONLY_SERVICE:-}"

if [[ -n "$ONLY_SERVICE" ]]; then
  SERVICES=("$ONLY_SERVICE")
fi

cd "$ROOT_DIR"

echo "[local-ci] root: $ROOT_DIR"
echo "[local-ci] run_lint=$RUN_LINT skip_install=$SKIP_INSTALL only_service=${ONLY_SERVICE:-all}"
for service in "${SERVICES[@]}"; do
  echo
  echo "[local-ci] ===== $service ====="
  pushd "services/$service" >/dev/null

  if [[ "$SKIP_INSTALL" != "1" ]]; then
    echo "[local-ci][$service] npm ci"
    npm ci
  fi

  if [[ "$RUN_LINT" == "1" ]]; then
    echo "[local-ci][$service] npm run lint:check"
    npm run lint:check
  fi

  echo "[local-ci][$service] npm run test:cov"
  npm run test:cov

  echo "[local-ci][$service] npm run build"
  npm run build

  popd >/dev/null
done

echo

echo "[local-ci] all services passed"
