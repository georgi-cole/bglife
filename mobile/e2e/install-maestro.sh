#!/usr/bin/env bash
set -euo pipefail

curl --fail --retry 3 --location --silent --show-error \
  "https://github.com/mobile-dev-inc/maestro/releases/download/cli-2.6.1/maestro.zip" \
  --output "$RUNNER_TEMP/maestro.zip"
unzip -q "$RUNNER_TEMP/maestro.zip" -d "$RUNNER_TEMP"
"$RUNNER_TEMP/maestro/bin/maestro" --version
