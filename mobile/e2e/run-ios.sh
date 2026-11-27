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

app_id=com.georgicole.bglife.playtest
maestro="$RUNNER_TEMP/maestro/bin/maestro"

capture_failure() {
  local status=$?
  if [ "$status" -eq 0 ]; then return; fi
  local data database
  data="$(xcrun simctl get_app_container "$simulator" "$app_id" data)" || return
  database="$(find "$data" -name bglife.db -type f -print -quit)"
  if [ -n "$database" ]; then
    sqlite3 -readonly -line "$database" "
      SELECT length(current_save) AS current_bytes, length(previous_save) AS previous_bytes,
             json_array_length(json_extract(current_save, '\$.life'), '\$.commands') AS current_commands
      FROM game WHERE id = 1;
    " || true
  else
    echo "No BgLife SQLite database in the simulator data container."
  fi
}
trap capture_failure EXIT

cd mobile
mkdir -p smoke-results
xcrun simctl launch "$simulator" "$app_id"
"$maestro" --device "$simulator" test --debug-output smoke-results e2e/life.yaml
xcrun simctl launch --terminate-running-process "$simulator" "$app_id"
"$maestro" --device "$simulator" test --debug-output smoke-results \
  -e SAVED_NAME="Mila Vasileva" -e SAVED_AGE=1 -e SCREENSHOT=journal e2e/resume.yaml
