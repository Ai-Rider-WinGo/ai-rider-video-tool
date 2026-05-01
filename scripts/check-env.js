const { execFileSync } = require("child_process");

if (process.env.CI === "true" || process.env.AI_RIDER_SKIP_ENV_CHECK === "1") {
  console.log("AI-Rider desktop environment check skipped in CI/build automation mode.");
  process.exit(0);
}

const checks = [
  {
    name: "Node.js",
    command: "node",
    args: ["--version"],
    required: true,
    hint: "Install Node.js 20 LTS or newer.",
  },
  {
    name: "npm",
    command: "npm",
    args: ["--version"],
    required: true,
    hint: "npm is bundled with Node.js.",
  },
  {
    name: "Git",
    command: "git",
    args: ["--version"],
    required: true,
    hint: "Install Git before packaging or publishing the desktop app.",
  },
  {
    name: "ffmpeg",
    command: "ffmpeg",
    args: ["-version"],
    required: true,
    hint: "Install with Homebrew: brew install ffmpeg",
    firstLineOnly: true,
  },
  {
    name: "ffprobe",
    command: "ffprobe",
    args: ["-version"],
    required: true,
    hint: "ffprobe is included with ffmpeg.",
    firstLineOnly: true,
  },
];

function runCheck(check) {
  try {
    const output = execFileSync(check.command, check.args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    const detail = check.firstLineOnly ? output.split(/\r?\n/)[0] : output;
    return { ...check, ok: true, detail };
  } catch (error) {
    return { ...check, ok: false, detail: error.message };
  }
}

const results = checks.map(runCheck);
let failed = false;

console.log("AI-Rider desktop environment check\n");

for (const result of results) {
  const status = result.ok ? "OK" : "MISSING";
  console.log(`${status.padEnd(8)} ${result.name.padEnd(8)} ${result.ok ? result.detail : result.hint}`);
  if (result.required && !result.ok) {
    failed = true;
  }
}

console.log("");

if (failed) {
  console.error("Required desktop tools are missing. Install them, then run `npm run check:env` again.");
  process.exit(1);
}

console.log("Environment is ready.");
