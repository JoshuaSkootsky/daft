#!/usr/bin/env bash
# DAFT Quick Test Runner

set -e

SPEC_FILE=$1
DATA_FILE=$2

# Validate arguments
if [[ -z "$SPEC_FILE" ]]; then
  echo "Usage: ./run.sh <spec.ts> [data.json]"
  echo ""
  echo "Examples:"
  echo "  ./run.sh examples/linear-spec.ts data.json"
  echo "  ./run.sh examples/dag-spec.ts"
  exit 1
fi

# Check spec file exists
if [[ ! -f "$SPEC_FILE" ]]; then
  echo "Error: Spec file not found: $SPEC_FILE"
  exit 1
fi

# Type-check spec
echo "Type-checking $SPEC_FILE..."
if ! bun run --check "$SPEC_FILE" 2>&1 > /dev/null; then
  echo "Type-check failed. Run: bun run --check $SPEC_FILE"
  exit 1
fi

echo "✓ Type-check passed"
echo ""

# Execute locally
bun src/cli/run-local.ts "$SPEC_FILE" "$DATA_FILE"
