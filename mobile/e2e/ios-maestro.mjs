import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { promisify } from "node:util";

const [simulator, appId, maestro, firstLaunch] = process.argv.slice(2);
const run = promisify(execFile);
let restart;
let restartError;

// Let Maestro request a real simctl restart without starting a second XCTest driver.
const server = createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/restart") {
    response.writeHead(404).end();
    return;
  }
  if (restart) {
    response.writeHead(409).end();
    return;
  }

  console.log("Cold restarting BgLife after the first birthday");
  restart = run("xcrun", ["simctl", "launch", "--terminate-running-process", simulator, appId], { timeout: 110_000 })
    .then(({ stdout }) => {
      const secondLaunch = stdout.trim();
      console.log(secondLaunch);
      if (!secondLaunch || secondLaunch === firstLaunch) {
        throw new Error("The simulator did not report a new BgLife process");
      }
    })
    .catch(error => {
      restartError = error;
      console.error(error);
    });
  response.writeHead(202).end();
});

server.listen(0, "127.0.0.1");
await once(server, "listening");
try {
  const runner = spawn(maestro, [
    "--device", simulator, "test", "--debug-output", "smoke-results",
    "-e", `RESTART_URL=http://127.0.0.1:${server.address().port}/restart`, "e2e/ios-life.yaml",
  ], { stdio: "inherit" });
  const [code, signal] = await once(runner, "exit");
  await restart;
  if (restartError) throw restartError;
  if (code !== 0) throw new Error(`Maestro exited with ${signal ?? code}`);
  if (!restart) throw new Error("Maestro did not request a simulator restart");
} finally {
  server.close();
}
