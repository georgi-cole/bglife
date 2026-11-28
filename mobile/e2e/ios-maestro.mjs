import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { promisify } from "node:util";

const [simulator, appId, maestro, firstLaunch] = process.argv.slice(2);
const run = promisify(execFile);

async function testFlow(flow, variables = []) {
  const runner = spawn(maestro, [
    "--device", simulator, "test", "--debug-output", "smoke-results",
    ...variables, flow,
  ], { stdio: "inherit", timeout: 9 * 60_000, killSignal: "SIGKILL" });
  const [code, signal] = await once(runner, "exit");
  if (code !== 0) throw new Error(`${flow} exited with ${signal ?? code}`);
}

await testFlow("e2e/life.yaml");

// A fresh XCTest session avoids querying a process that was just terminated.
console.log("Cold restarting BgLife after the first birthday");
const { stdout } = await run("xcrun", [
  "simctl", "launch", "--terminate-running-process", simulator, appId,
], { timeout: 110_000 });
const secondLaunch = stdout.trim();
if (!secondLaunch || secondLaunch === firstLaunch) {
  throw new Error("The simulator did not report a new BgLife process");
}
console.log(secondLaunch);

await testFlow("e2e/resume.yaml", [
  "-e", "SAVED_NAME=Mila Vasileva", "-e", "SAVED_AGE=1", "-e", "SCREENSHOT=journal",
]);
