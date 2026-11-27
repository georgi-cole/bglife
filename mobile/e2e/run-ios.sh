#!/usr/bin/env bash
set -euo pipefail

simulator="$(xcrun simctl list devices available --json | node -e '
  const { devices } = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
  const device = Object.entries(devices).filter(([runtime]) => runtime.includes(".iOS-")).reverse()
    .flatMap(([, items]) => items).find(item => item.name.includes("iPhone"));
  if (!device) throw new Error("No iPhone simulator is installed");
  process.stdout.write(device.udid);
')"
xcrun simctl boot "$simulator"
xcrun simctl bootstatus "$simulator" -b
app="$(find "$RUNNER_TEMP/bglife-ios/Build/Products/Release-iphonesimulator" -maxdepth 1 -name '*.app' -print -quit)"
test -n "$app"
xcrun simctl install "$simulator" "$app"

cd mobile
mkdir -p smoke-results
"$RUNNER_TEMP/maestro/bin/maestro" --device "$simulator" test --debug-output smoke-results e2e/life.yaml
