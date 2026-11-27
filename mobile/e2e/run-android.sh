#!/usr/bin/env bash
set -euo pipefail

mkdir -p mobile/smoke-results
capture_failure() {
  local status=$?
  if [ "$status" -ne 0 ]; then
    adb logcat -d -t 500 > "$GITHUB_WORKSPACE/mobile/smoke-results/android-logcat.txt" || true
  fi
}
trap capture_failure EXIT

adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk
adb shell cmd connectivity airplane-mode enable
adb shell svc wifi disable
adb shell svc data disable
adb shell mkdir -p /sdcard/Download
node mobile/e2e/web-backup.mjs "$RUNNER_TEMP/BgLife-Web-Backup.json"
adb push "$RUNNER_TEMP/BgLife-Web-Backup.json" /sdcard/Download/
adb shell am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file:///sdcard/Download/BgLife-Web-Backup.json

cd mobile
mkdir -p smoke-results
"${RUNNER_TEMP}/maestro/bin/maestro" test --debug-output smoke-results e2e/life.yaml
"${RUNNER_TEMP}/maestro/bin/maestro" test --debug-output smoke-results e2e/import-android.yaml
