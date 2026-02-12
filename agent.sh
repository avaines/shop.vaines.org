#!/usr/bin/env zsh
# agent.sh
# Usage: ./agent.sh [iterations]
# Note: Set AUTO_ALLOW="--allow-all-tools" to let copilot auto-run tools (unsafe).

set -euo pipefail

iterations="${1:-1}"
AUTO_ALLOW="${AUTO_ALLOW:-}"   # e.g. "--allow-all-tools" to disable interactive confirmations

plan_file="docs/PLAN.json"
features_file="docs/FEATURES.md"
decisions_file="docs/DECISIONS.md"
progress_log_file="docs/LOG.md"

tmp_result="$(mktemp agent_result.XXXXXX)"

if ! [[ "$iterations" =~ '^[0-9]+$' ]] || [[ "$iterations" -lt 1 ]]; then
  echo "Usage: $0 [iterations]" >&2
  exit 2
fi

for (( i=1; i<=iterations; i++ )); do
  echo "== Iteration $i/$iterations ==" >&2

  prompt=$(cat <<EOF
You are Implementer+TestQA+Scribe. \
Inputs of truth: $plan_file, $features_file, $decisions_file, $progress_log_file. \

Task: \
- Decide which task to work on next from $plan_file. \
  This should be the one YOU decide has the highest priority, not necessarily the first in the list. \
- Implement only that entry. \
- Follow the entry's steps and run any validation commands needed. \
- If validation succeeds, set that entry's passes to true. \
- If any FEATURE acceptance criteria are satisfied, tick the relevant checkbox(es) in $features_file. \
- Append a dated entry to $progress_log_file with: \
  - what changed \
  - commands run \
  - results \
  - next failing $plan_file item \
- Make a git commit of that feature. \

Constraints: \
- No scope expansion beyond the selected unit. \
- If a new design decision is required, add a short entry to $decisions_file. \

Output: \
- Summary of changed files \
- Exact commands to run \
- Status: COMPLETE if the unit passed, otherwise FAILED with what to fix. \

ONLY WORK ON A SINGLE FEATURE. \
If, while implementing the feature, you notice that all work \
is complete, output <promise>COMPLETE</promise>.
EOF
)

  if [[ -n "$AUTO_ALLOW" ]]; then
    copilot $AUTO_ALLOW -p "$prompt" >| "$tmp_result" 2>&1
  else
    copilot -p "$prompt" >| "$tmp_result" 2>&1
  fi

  result="$(cat "$tmp_result")"
  printf '%s\n\n' "$result"

  if grep -q "<promise>COMPLETE</promise>" "$tmp_result"; then
    echo "PLAN complete, exiting." >&2
    rm -f "$tmp_result"
    exit 0
  fi
done

rm -f "$tmp_result"
echo "Finished $iterations iterations."
