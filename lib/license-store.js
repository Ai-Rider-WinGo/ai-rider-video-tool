const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const LICENSE_PREFIX = "AIRV";
const LICENSE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function randomChunk(length = 4) {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += LICENSE_ALPHABET[crypto.randomInt(0, LICENSE_ALPHABET.length)];
  }
  return value;
}

function normalizeTier(tier) {
  const parsed = Number(tier);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("注册码档位必须是正整数");
  }
  return parsed;
}

function formatCode() {
  return [
    LICENSE_PREFIX,
    randomChunk(4),
    randomChunk(4),
    randomChunk(4),
  ].join("-");
}

function sanitizeString(value, fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function serializePublicLicense(license) {
  return {
    id: license.id,
    code: license.code,
    tier: license.tier,
    totalUses: license.total_uses,
    remainingUses: license.remaining_uses,
    status: license.status,
    maxDevices: license.max_devices,
    activatedAt: license.activated_at,
    expiresAt: license.expires_at,
    channel: license.channel,
    note: license.note,
    createdAt: license.created_at,
    updatedAt: license.updated_at,
    deviceCount: Array.isArray(license.devices) ? license.devices.length : 0,
    devices: Array.isArray(license.devices)
      ? license.devices.map((device) => ({
          deviceId: device.device_id,
          deviceName: device.device_name,
          platform: device.platform,
          appVersion: device.app_version,
          boundAt: device.bound_at,
          lastSeenAt: device.last_seen_at,
        }))
      : [],
  };
}

function createLicenseStore({ filePath }) {
  if (!filePath) {
    throw new Error("filePath is required for license store");
  }

  const resolvedPath = path.resolve(filePath);

  function ensureStorage() {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    if (!fs.existsSync(resolvedPath)) {
      fs.writeFileSync(
        resolvedPath,
        JSON.stringify({ licenses: [] }, null, 2),
        "utf8"
      );
    }
  }

  function readDb() {
    ensureStorage();
    try {
      const raw = fs.readFileSync(resolvedPath, "utf8");
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.licenses)) {
        return { licenses: [] };
      }
      return parsed;
    } catch {
      return { licenses: [] };
    }
  }

  function writeDb(db) {
    ensureStorage();
    fs.writeFileSync(resolvedPath, JSON.stringify(db, null, 2), "utf8");
  }

  function withDb(mutator) {
    const db = readDb();
    const result = mutator(db);
    writeDb(db);
    return result;
  }

  function findLicenseByCode(db, code) {
    const normalizedCode = sanitizeString(code).toUpperCase();
    return db.licenses.find((license) => license.code === normalizedCode);
  }

  function appendEvent(license, eventType, payload = {}) {
    license.events = Array.isArray(license.events) ? license.events : [];
    license.events.push({
      id: makeId("licevt"),
      event_type: eventType,
      payload,
      created_at: nowIso(),
    });
  }

  function ensureActiveStatus(license) {
    if (license.remaining_uses <= 0) {
      license.remaining_uses = 0;
      license.status = "exhausted";
      return;
    }
    if (license.status === "unused") {
      license.status = "active";
    }
  }

  function validateLicenseUsable(license) {
    if (!license) throw new Error("注册码不存在");
    if (license.status === "revoked") throw new Error("注册码已作废");
    if (license.status === "frozen") throw new Error("注册码已冻结");
    if (license.status === "expired") throw new Error("注册码已过期");
    if (license.status === "exhausted" || license.remaining_uses <= 0) {
      throw new Error("注册码次数已用完");
    }
  }

  function generateLicenses(options = {}) {
    const count = Math.max(1, Number(options.count || 1));
    const tier = normalizeTier(options.tier);
    const maxDevices = Math.max(1, Number(options.maxDevices || 1));
    const channel = sanitizeString(options.channel, "manual");
    const note = sanitizeString(options.note);
    const kind = sanitizeString(options.kind, "standard");

    return withDb((db) => {
      const generated = [];
      for (let index = 0; index < count; index += 1) {
        let code = formatCode();
        while (findLicenseByCode(db, code)) {
          code = formatCode();
        }
        const createdAt = nowIso();
        const license = {
          id: makeId("lic"),
          code,
          tier,
          total_uses: tier,
          remaining_uses: tier,
          status: "unused",
          max_devices: maxDevices,
          activated_at: "",
          expires_at: "",
          channel,
          note,
          kind,
          created_at: createdAt,
          updated_at: createdAt,
          devices: [],
          activations: [],
          consumptions: [],
          events: [],
        };
        appendEvent(license, "generated", {
          tier,
          channel,
          note,
          kind,
          maxDevices,
        });
        db.licenses.push(license);
        generated.push(serializePublicLicense(license));
      }
      return generated;
    });
  }

  function listLicenses() {
    const db = readDb();
    return db.licenses
      .slice()
      .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
      .map(serializePublicLicense);
  }

  function getLicense(code) {
    const db = readDb();
    const license = findLicenseByCode(db, code);
    return license ? serializePublicLicense(license) : null;
  }

  function activateLicense({ code, deviceId, deviceName, platform, appVersion }) {
    if (!deviceId) throw new Error("缺少 deviceId");
    return withDb((db) => {
      const license = findLicenseByCode(db, code);
      validateLicenseUsable(license);

      license.devices = Array.isArray(license.devices) ? license.devices : [];
      license.activations = Array.isArray(license.activations) ? license.activations : [];

      let device = license.devices.find((item) => item.device_id === deviceId);
      if (!device) {
        if (license.devices.length >= Number(license.max_devices || 1)) {
          throw new Error("该注册码已达到设备绑定上限");
        }
        device = {
          device_id: deviceId,
          device_name: sanitizeString(deviceName, "Unknown Device"),
          platform: sanitizeString(platform, process.platform),
          app_version: sanitizeString(appVersion),
          bound_at: nowIso(),
          last_seen_at: nowIso(),
        };
        license.devices.push(device);
      } else {
        device.device_name = sanitizeString(deviceName, device.device_name);
        device.platform = sanitizeString(platform, device.platform);
        device.app_version = sanitizeString(appVersion, device.app_version);
        device.last_seen_at = nowIso();
      }

      let activation = license.activations.find((item) => item.device_id === deviceId);
      if (!activation) {
        activation = {
          token: crypto.randomUUID(),
          device_id: deviceId,
          issued_at: nowIso(),
          last_seen_at: nowIso(),
        };
        license.activations.push(activation);
      } else {
        activation.last_seen_at = nowIso();
      }

      if (!license.activated_at) {
        license.activated_at = nowIso();
      }
      ensureActiveStatus(license);
      license.updated_at = nowIso();
      appendEvent(license, "activated", {
        deviceId,
        deviceName: device.device_name,
        platform: device.platform,
      });

      return {
        activationToken: activation.token,
        license: serializePublicLicense(license),
      };
    });
  }

  function consumeLicense({ code, deviceId, taskId, consumeType = "job_create", count = 1 }) {
    const consumeCount = Math.max(1, Number(count || 1));
    return withDb((db) => {
      const license = findLicenseByCode(db, code);
      validateLicenseUsable(license);

      const device = (license.devices || []).find((item) => item.device_id === deviceId);
      if (!device) {
        throw new Error("当前设备未绑定该注册码");
      }

      if (license.remaining_uses < consumeCount) {
        license.remaining_uses = 0;
        license.status = "exhausted";
        throw new Error("注册码剩余次数不足");
      }

      license.consumptions = Array.isArray(license.consumptions) ? license.consumptions : [];
      const beforeRemaining = license.remaining_uses;
      license.remaining_uses -= consumeCount;
      ensureActiveStatus(license);
      license.updated_at = nowIso();
      device.last_seen_at = nowIso();
      license.consumptions.push({
        id: makeId("licuse"),
        task_id: sanitizeString(taskId),
        device_id: deviceId,
        consume_type: consumeType,
        consume_count: consumeCount,
        before_remaining: beforeRemaining,
        after_remaining: license.remaining_uses,
        created_at: nowIso(),
      });
      appendEvent(license, "consumed", {
        deviceId,
        taskId,
        consumeType,
        consumeCount,
        beforeRemaining,
        afterRemaining: license.remaining_uses,
      });

      return serializePublicLicense(license);
    });
  }

  function revokeLicense(code, note = "") {
    return withDb((db) => {
      const license = findLicenseByCode(db, code);
      if (!license) throw new Error("注册码不存在");
      license.status = "revoked";
      license.updated_at = nowIso();
      appendEvent(license, "revoked", { note: sanitizeString(note) });
      return serializePublicLicense(license);
    });
  }

  function freezeLicense(code, note = "") {
    return withDb((db) => {
      const license = findLicenseByCode(db, code);
      if (!license) throw new Error("注册码不存在");
      license.status = "frozen";
      license.updated_at = nowIso();
      appendEvent(license, "frozen", { note: sanitizeString(note) });
      return serializePublicLicense(license);
    });
  }

  function resetDeviceBindings(code, note = "") {
    return withDb((db) => {
      const license = findLicenseByCode(db, code);
      if (!license) throw new Error("注册码不存在");
      license.devices = [];
      license.activations = [];
      license.status = license.remaining_uses > 0 ? "unused" : "exhausted";
      license.activated_at = "";
      license.updated_at = nowIso();
      appendEvent(license, "device_reset", { note: sanitizeString(note) });
      return serializePublicLicense(license);
    });
  }

  function getActivationByToken(token) {
    const normalized = sanitizeString(token);
    if (!normalized) return null;
    const db = readDb();
    for (const license of db.licenses) {
      for (const activation of license.activations || []) {
        if (activation.token === normalized) {
          return {
            license: serializePublicLicense(license),
            deviceId: activation.device_id,
            activationToken: activation.token,
          };
        }
      }
    }
    return null;
  }

  return {
    filePath: resolvedPath,
    generateLicenses,
    listLicenses,
    getLicense,
    activateLicense,
    consumeLicense,
    revokeLicense,
    freezeLicense,
    resetDeviceBindings,
    getActivationByToken,
  };
}

module.exports = {
  createLicenseStore,
};
