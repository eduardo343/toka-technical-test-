#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICES=("auth-service" "user-service" "role-service" "audit-service")

printf "%-15s | %10s | %10s | %10s | %10s\n" "SERVICE" "STATEMENTS" "BRANCHES" "FUNCTIONS" "LINES"
printf "%s\n" "-----------------+------------+------------+------------+------------"

for service in "${SERVICES[@]}"; do
  summary_file="$ROOT_DIR/services/$service/coverage/coverage-summary.json"

  if [[ ! -f "$summary_file" ]]; then
    printf "%-15s | %10s | %10s | %10s | %10s\n" "$service" "MISSING" "MISSING" "MISSING" "MISSING"
    continue
  fi

  node -e '
const fs = require("fs");
const file = process.argv[1];
const service = process.argv[2];
const json = JSON.parse(fs.readFileSync(file, "utf8"));
const t = json.total;
const fmt = (n) => `${Number(n).toFixed(2)}%`;
console.log(`${service}|${fmt(t.statements.pct)}|${fmt(t.branches.pct)}|${fmt(t.functions.pct)}|${fmt(t.lines.pct)}`);
' "$summary_file" "$service" | while IFS='|' read -r name s b f l; do
    printf "%-15s | %10s | %10s | %10s | %10s\n" "$name" "$s" "$b" "$f" "$l"
  done
done
