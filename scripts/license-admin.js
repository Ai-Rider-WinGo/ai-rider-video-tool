#!/usr/bin/env node

const path = require("path");
const { createLicenseStore } = require("../lib/license-store");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = process.env.AI_RIDER_DATA_DIR
  ? path.resolve(process.env.AI_RIDER_DATA_DIR)
  : ROOT_DIR;
const LICENSES_FILE = path.join(DATA_DIR, "licenses.json");
const store = createLicenseStore({ filePath: LICENSES_FILE });

function parseArgs(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      result._.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    index += 1;
  }
  return result;
}

function printUsage() {
  console.log(`
AI-Rider 激活码管理工具

用法：
  npm run license:admin -- generate --tier 100 --count 5 --channel wechat
  npm run license:admin -- list
  npm run license:admin -- show --code AIRV-XXXX-XXXX-XXXX
  npm run license:admin -- freeze --code AIRV-XXXX-XXXX-XXXX --note suspicious
  npm run license:admin -- revoke --code AIRV-XXXX-XXXX-XXXX
  npm run license:admin -- reset-devices --code AIRV-XXXX-XXXX-XXXX
`);
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];

  if (!command || args.help || args.h) {
    printUsage();
    process.exit(0);
  }

  if (command === "generate") {
    const payload = store.generateLicenses({
      tier: args.tier,
      count: args.count,
      maxDevices: args["max-devices"] || args.maxDevices,
      channel: args.channel,
      note: args.note,
      kind: args.kind,
    });
    return printJson(payload);
  }

  if (command === "list") {
    return printJson(store.listLicenses());
  }

  if (command === "show") {
    if (!args.code) throw new Error("show 命令需要 --code");
    return printJson(store.getLicense(args.code));
  }

  if (command === "freeze") {
    if (!args.code) throw new Error("freeze 命令需要 --code");
    return printJson(store.freezeLicense(args.code, args.note));
  }

  if (command === "revoke") {
    if (!args.code) throw new Error("revoke 命令需要 --code");
    return printJson(store.revokeLicense(args.code, args.note));
  }

  if (command === "reset-devices") {
    if (!args.code) throw new Error("reset-devices 命令需要 --code");
    return printJson(store.resetDeviceBindings(args.code, args.note));
  }

  throw new Error(`未知命令：${command}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
