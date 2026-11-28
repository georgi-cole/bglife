import { readFileSync } from "node:fs";

const [event, draft, platform] = process.argv.slice(2);
const iosOnly = /^(?:mobile\/ios\/|mobile\/.*\.ios\.|mobile\/e2e\/(?:ios-|run-ios\.sh$|request-ios-restart\.js$))/;
const androidOnly = /^(?:mobile\/android\/|mobile\/.*\.android\.|mobile\/e2e\/(?:run-android\.sh|import-android\.yaml|web-backup\.mjs)$)/;
const sharedDevicePaths = new Set([
  "src/sessionCodec.ts",
  ".github/workflows/native.yml",
  ".github/scripts/native-check-plan.mjs",
]);

let bundles = false;
let android = false;
let ios = false;

if (event === "pull_request") {
  for (const path of readFileSync(0, "utf8").split("\0")) {
    if (iosOnly.test(path)) ios = true;
    else if (androidOnly.test(path)) android = true;
    else if (path.startsWith("mobile/") || sharedDevicePaths.has(path)) android = ios = true;
    else if (/^src\/.*\.ts$/.test(path) || path === "public/art/tryavna.webp") bundles = true;
  }
} else if (event === "schedule") {
  android = ios = true;
} else if (event === "workflow_dispatch" && ["both", "android", "ios"].includes(platform)) {
  android = platform !== "ios";
  ios = platform !== "android";
} else {
  throw new Error("Unrecognized native check trigger or platform");
}

bundles ||= android || ios;
if (event === "pull_request" && draft === "true") {
  android = ios = false;
}

console.log(`bundles=${bundles}\nandroid=${android}\nios=${ios}`);
