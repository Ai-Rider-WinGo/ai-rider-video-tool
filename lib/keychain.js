const { execFileSync } = require("child_process");

// macOS Keychain service name — unique per app
const SERVICE_NAME = "com.ai-rider.desktop-client";
const ACCOUNT_NAME = "volcengine-api-key";

function getApiKey() {
  try {
    const output = execFileSync("security", [
      "find-generic-password",
      "-s", SERVICE_NAME,
      "-a", ACCOUNT_NAME,
      "-w",
    ], { encoding: "utf8" }).trim();
    return output || "";
  } catch {
    return "";
  }
}

function storeApiKey(key) {
  const existing = getApiKey();
  const normalizedKey = String(key || "").trim();

  if (!normalizedKey) {
    // Delete from keychain if key is empty
    if (existing) {
      try {
        execFileSync("security", [
          "delete-generic-password",
          "-s", SERVICE_NAME,
          "-a", ACCOUNT_NAME,
        ], { stdio: "ignore" });
      } catch { /* ok if doesn't exist */ }
    }
    return;
  }

  // Only update if changed
  if (normalizedKey === existing) return;

  if (existing) {
    // Update existing entry
    execFileSync("security", [
      "add-generic-password",
      "-s", SERVICE_NAME,
      "-a", ACCOUNT_NAME,
      "-w", normalizedKey,
      "-U",   // update if exists
    ], { stdio: "ignore" });
  } else {
    // Create new entry
    execFileSync("security", [
      "add-generic-password",
      "-s", SERVICE_NAME,
      "-a", ACCOUNT_NAME,
      "-w", normalizedKey,
      "-T", "/usr/bin/security",  // only security can read
    ], { stdio: "ignore" });
  }
}

function isKeychainAvailable() {
  try {
    execFileSync("security", ["find-generic-password", "-s", SERVICE_NAME, "-a", ACCOUNT_NAME], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  getApiKey,
  storeApiKey,
  isKeychainAvailable,
};
