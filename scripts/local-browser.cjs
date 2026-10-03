const { spawn } = require("node:child_process");
const path = require("node:path");
const child = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-background-networking", "--disable-extensions",
  "--no-first-run", "--remote-debugging-port=9333", "--user-data-dir=" + path.join(require("node:os").tmpdir(), "leaders-cv-browser-" + process.pid), "about:blank"
], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
child.stderr.on("data", data => process.stderr.write(data));
child.on("error", error => { console.error(error); process.exitCode = 1; });
child.on("exit", code => { console.log("Browser exit:", code); process.exitCode = code || 0; });
process.on("SIGINT", () => child.kill());
