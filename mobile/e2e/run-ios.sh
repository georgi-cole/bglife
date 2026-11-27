#!/usr/bin/env bash
set -euo pipefail

simulator="$(xcrun simctl list devices available --json | node -e '
  const { devices } = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
  const phones = Object.entries(devices).filter(([runtime]) => runtime.includes(".iOS-")).reverse()
    .flatMap(([, items]) => items).filter(item => item.name.startsWith("iPhone"));
  const device = phones.find(item => /^iPhone [0-9]+$/.test(item.name)) ?? phones[0];
  if (!device) throw new Error("No iPhone simulator is installed");
  process.stdout.write(device.udid);
')"
echo "Booting iPhone Simulator $simulator"
xcrun simctl boot "$simulator"
xcrun simctl bootstatus "$simulator" -b
app="$(find "$RUNNER_TEMP/bglife-ios/Build/Products/Release-iphonesimulator" -maxdepth 1 -name '*.app' -print -quit)"
test -n "$app"
echo "Installing $app"
xcrun simctl install "$simulator" "$app"

cd mobile
mkdir -p smoke-results
"$RUNNER_TEMP/maestro/bin/maestro" --device "$simulator" test --debug-output smoke-results e2e/life.yaml
