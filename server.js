const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { URL } = require("url");
const execFileAsync = promisify(execFile);

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 3100);
const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DOWNLOAD_DIR = path.join(ROOT_DIR, "downloads");
const SETTINGS_FILE = path.join(ROOT_DIR, "settings.json");
const JOBS_FILE = path.join(ROOT_DIR, "jobs.json");

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

const jobs = new Map();
const jobTimers = new Map();
const MODEL_CAPABILITIES = {
  "doubao-seedance-1-0-pro-250528": {
    label: "Seedance 1.0 Pro",
    supports: ["t2v", "i2v_first_frame"],
  },
  "doubao-seedance-1-0-lite-i2v-250428": {
    label: "Seedance 1.0 Lite I2V",
    supports: ["i2v_first_frame"],
  },
  "doubao-seedance-1-0-pro-fast-251015": {
    label: "Seedance 1.0 Pro Fast",
    supports: ["t2v", "i2v_first_frame"],
  },
  "doubao-seedance-1-0-lite-t2v-250428": {
    label: "Seedance 1.0 Lite T2V",
    supports: ["t2v"],
  },
  "doubao-seedance-1-5-pro-251215": {
    label: "Seedance 1.5 Pro",
    supports: ["t2v", "i2v_first_frame", "i2v_first_last_frame_experimental"],
  },
};
const FALLBACK_MODELS = {
  i2v_first_last_frame: "doubao-seedance-1-5-pro-251215",
  i2v_first_frame: "doubao-seedance-1-0-pro-250528",
  t2v: "doubao-seedance-1-5-pro-251215",
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function sendFile(req, res, filePath, contentType) {
  try {
    const stat = await fs.promises.stat(filePath);
    const range = req.headers.range;

    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      if (!match) {
        res.writeHead(416);
        res.end();
        return;
      }
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        "Content-Type": contentType,
        "Content-Length": chunkSize,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      });

      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    sendJson(res, 404, { error: "Not found" });
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sanitizeFileName(input) {
  const trimmed = (input || "untitled")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (trimmed || "untitled").slice(0, 80);
}

function inferGenerationMode(input) {
  if (input.firstFrameDataUrl && input.lastFrameDataUrl) return "i2v_first_last_frame";
  if (input.firstFrameDataUrl) return "i2v_first_frame";
  return "t2v";
}

function getCompatibleModel(mode, preferredModel) {
  if (mode === "i2v_first_last_frame" && preferredModel === "doubao-seedance-1-5-pro-251215") {
    return {
      requestedModel: preferredModel,
      effectiveModel: preferredModel,
      adjusted: false,
      reason: "",
    };
  }

  const preferred = MODEL_CAPABILITIES[preferredModel];
  if (preferred && preferred.supports.includes(mode)) {
    return {
      requestedModel: preferredModel,
      effectiveModel: preferredModel,
      adjusted: false,
      reason: "",
    };
  }

  const fallbackModel = FALLBACK_MODELS[mode];
  if (fallbackModel) {
    return {
      requestedModel: preferredModel,
      effectiveModel: fallbackModel,
      adjusted: fallbackModel !== preferredModel,
      reason: fallbackModel === preferredModel
        ? ""
        : `模型 ${preferredModel} 不支持当前模式 ${mode}，已自动切换为 ${fallbackModel}。`,
    };
  }

  return {
    requestedModel: preferredModel,
    effectiveModel: preferredModel,
    adjusted: false,
    reason: "",
  };
}

function fileExtensionFromUrl(urlString, fallback = ".mp4") {
  try {
    const parsed = new URL(urlString);
    const ext = path.extname(parsed.pathname);
    return ext || fallback;
  } catch {
    return fallback;
  }
}

function buildBaseOutputName(job) {
  const videoName = String(job.videoName || "").trim();
  const shotNumber = String(job.shotNumber || "").trim();

  if (videoName && shotNumber) {
    return sanitizeFileName(`${videoName}-镜头${shotNumber}`);
  }

  if (videoName) {
    return sanitizeFileName(videoName);
  }

  if (shotNumber) {
    return sanitizeFileName(`镜头${shotNumber}`);
  }

  return sanitizeFileName(job.prompt);
}

function makeJobId() {
  return `job_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function readSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function mergeVideoNames(existing = [], incoming = []) {
  const merged = [];
  for (const value of [...incoming, ...existing]) {
    const normalized = String(value || "").trim();
    if (!normalized || merged.includes(normalized)) continue;
    merged.push(normalized);
  }
  return merged.slice(0, 30);
}

function mergeProjectPaths(existing = [], incoming = []) {
  const merged = [];
  for (const value of [...incoming, ...existing]) {
    const normalized = String(value || "").trim();
    if (!normalized || merged.includes(normalized)) continue;
    merged.push(normalized);
  }
  return merged.slice(0, 20);
}

async function writeSettings(nextSettings) {
  const current = readSettings();
  const merged = {
    ...current,
    ...nextSettings,
    videoNames: mergeVideoNames(current.videoNames || [], nextSettings.videoNames || []),
    projectPaths: mergeProjectPaths(current.projectPaths || [], nextSettings.projectPaths || []),
  };
  await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2), "utf8");
}

function readJobsFromDisk() {
  try {
    const raw = fs.readFileSync(JOBS_FILE, "utf8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function jobToDisk(job) {
  return {
    id: job.id,
    prompt: job.prompt,
    projectPath: job.projectPath || "",
    videoName: job.videoName || "",
    shotNumber: job.shotNumber || "",
    config: job.config,
    status: job.status,
    progress: job.progress,
    taskId: job.taskId,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    videoUrl: job.videoUrl,
    downloadedFileName: job.downloadedFileName,
    downloadedFilePath: job.downloadedFilePath,
    downloadedAt: job.downloadedAt || "",
    rawCreateResponse: job.rawCreateResponse,
    rawQueryResponse: job.rawQueryResponse,
    error: job.error,
  };
}

async function persistJobs() {
  const list = Array.from(jobs.values())
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(jobToDisk);
  await fs.promises.writeFile(JOBS_FILE, JSON.stringify(list, null, 2), "utf8");
}

function buildCreatePayload(input) {
  const mode = inferGenerationMode(input);
  const modelChoice = getCompatibleModel(mode, input.model);
  const content = [];
  let compatibilityNote = "";

  if (input.prompt) {
    content.push({
      type: "text",
      text: input.prompt,
    });
  }

  if (input.firstFrameDataUrl) {
    content.push({
      type: "image_url",
      role: "first_frame",
      image_url: {
        url: input.firstFrameDataUrl,
      },
    });
  }

  if (input.lastFrameDataUrl) {
    content.push({
      type: "image_url",
      role: "last_frame",
      image_url: {
        url: input.lastFrameDataUrl,
      },
    });
  }

  if (mode === "i2v_first_last_frame") {
    compatibilityNote =
      "已按 Seedance 首尾帧模式提交：首图使用 role=first_frame，尾图使用 role=last_frame。";
  }

  const payload = {
    model: modelChoice.effectiveModel,
    content,
  };

  if (input.resolution) payload.resolution = input.resolution;
  if (input.duration) payload.duration = Number(input.duration);
  if (input.fps) payload.fps = Number(input.fps);
  if (input.ratio) payload.ratio = input.ratio;
  if (typeof input.watermark === "boolean") payload.watermark = input.watermark;
  if (typeof input.generateAudio === "boolean") payload.generate_audio = input.generateAudio;
  if (input.seed !== "" && input.seed !== null && input.seed !== undefined) {
    payload.seed = Number(input.seed);
  }

  if (input.extraParams && typeof input.extraParams === "object") {
    Object.assign(payload, input.extraParams);
  }

  return {
    payload,
    mode,
    modelChoice,
    compatibilityNote,
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function resolveTaskId(payload) {
  if (payload?.id) return String(payload.id);
  if (payload?.task_id) return String(payload.task_id);
  if (payload?.data?.id) return String(payload.data.id);
  if (payload?.data?.task_id) return String(payload.data.task_id);
  return "";
}

function resolveStatus(payload) {
  return String(payload?.status || payload?.data?.status || "UNKNOWN");
}

function resolveProgress(payload) {
  const candidates = [
    payload?.progress,
    payload?.data?.progress,
    payload?.data?.process,
    payload?.percentage,
    payload?.data?.percentage,
    payload?.data?.percent,
  ];

  for (const value of candidates) {
    if (value === 0 || value) return value;
  }

  return null;
}

function resolveVideoUrl(payload) {
  const buckets = [payload, payload?.data];

  for (const bucket of buckets) {
    if (!bucket || typeof bucket !== "object") continue;
    if (bucket.video_url) return String(bucket.video_url);
    if (bucket.url) return String(bucket.url);
    if (bucket.output?.video_url) return String(bucket.output.video_url);
    if (bucket.output?.url) return String(bucket.output.url);

    if (bucket.content && typeof bucket.content === "object" && !Array.isArray(bucket.content)) {
      if (bucket.content.video_url) return String(bucket.content.video_url);
      if (bucket.content.url) return String(bucket.content.url);
      if (bucket.content.video?.url) return String(bucket.content.video.url);
    }

    const content = Array.isArray(bucket.content) ? bucket.content : [];
    for (const item of content) {
      if (item?.video_url) return String(item.video_url);
      if (item?.url) return String(item.url);
      if (item?.video?.url) return String(item.video.url);
    }
  }

  return "";
}

function buildQueryUrl(template, taskId) {
  if (template.includes("{task_id}")) {
    return template.replace("{task_id}", encodeURIComponent(taskId));
  }
  return template.endsWith("/")
    ? `${template}${encodeURIComponent(taskId)}`
    : `${template}/${encodeURIComponent(taskId)}`;
}

async function downloadVideoToLocal(job, videoUrl) {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  const extension = fileExtensionFromUrl(videoUrl);
  const baseName = buildBaseOutputName(job);
  const targetDir = job.projectPath
    ? path.resolve(job.projectPath)
    : DOWNLOAD_DIR;
  await fs.promises.mkdir(targetDir, { recursive: true });
  let finalName = `${baseName}${extension}`;
  let fullPath = path.join(targetDir, finalName);
  let counter = 1;

  while (fs.existsSync(fullPath)) {
    finalName = `${baseName}_${counter}${extension}`;
    fullPath = path.join(targetDir, finalName);
    counter += 1;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(fullPath, buffer);

  if (!job.config?.watermark) {
    try {
      await removeAiBadgeFromVideo(fullPath);
    } catch (error) {
      job.error = `本地去标失败，已保留原视频: ${error.message}`;
    }
  }

  job.downloadedFileName = finalName;
  job.downloadedFilePath = fullPath;
  job.downloadedAt = new Date().toISOString();
  await persistJobs();
}

async function probeVideoSize(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "json",
    filePath,
  ]);
  const parsed = JSON.parse(stdout);
  const stream = parsed.streams?.[0];
  if (!stream?.width || !stream?.height) {
    throw new Error("无法读取视频尺寸");
  }
  return { width: Number(stream.width), height: Number(stream.height) };
}

async function removeAiBadgeFromVideo(filePath) {
  const { width, height } = await probeVideoSize(filePath);
  const badgeWidth = Math.max(96, Math.round(width * 0.12));
  const badgeHeight = Math.max(34, Math.round(height * 0.065));
  const marginX = Math.max(18, Math.round(width * 0.018));
  const marginY = Math.max(18, Math.round(height * 0.02));
  const x = Math.max(0, width - badgeWidth - marginX);
  const y = Math.max(0, height - badgeHeight - marginY);
  const tempPath = `${filePath}.tmp.mp4`;

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    filePath,
    "-vf",
    `delogo=x=${x}:y=${y}:w=${badgeWidth}:h=${badgeHeight}:show=0`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-c:a",
    "copy",
    tempPath,
  ]);

  await fs.promises.rename(tempPath, filePath);
}

async function pollJob(job, apiKeyOverride) {
  if (!job.taskId) return;
  if (jobTimers.has(job.id)) {
    clearInterval(jobTimers.get(job.id));
    jobTimers.delete(job.id);
  }

  const pollOnce = async () => {
    const apiKey = apiKeyOverride || readSettings().apiKey;
    if (!apiKey) return;

    try {
      const queryUrl = buildQueryUrl(job.config.queryEndpointTemplate, job.taskId);
      const queryResponse = await fetchJson(queryUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      });

      job.rawQueryResponse = queryResponse;
      job.status = resolveStatus(queryResponse);
      job.progress = resolveProgress(queryResponse);
      job.updatedAt = new Date().toISOString();
      job.videoUrl = resolveVideoUrl(queryResponse);
      await persistJobs();

      if (["SUCCEEDED", "SUCCESS", "DONE", "COMPLETED", "SUCCEEDED".toLowerCase()].includes(String(job.status).toUpperCase())) {
        clearInterval(jobTimers.get(job.id));
        jobTimers.delete(job.id);

        if (!job.videoUrl) {
          job.error = "任务成功，但未自动识别到 video_url，请检查原始返回。";
          await persistJobs();
          return;
        }

        if (!job.downloadedFilePath) {
          try {
            await downloadVideoToLocal(job, job.videoUrl);
          } catch (downloadError) {
            job.error = `视频下载失败: ${downloadError.message}`;
            await persistJobs();
          }
        }
      }

      if (["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(String(job.status).toUpperCase())) {
        clearInterval(jobTimers.get(job.id));
        jobTimers.delete(job.id);
        job.error = JSON.stringify(queryResponse);
        await persistJobs();
      }
    } catch (pollError) {
      clearInterval(jobTimers.get(job.id));
      jobTimers.delete(job.id);
      job.status = "ERROR";
      job.error = pollError.message;
      job.updatedAt = new Date().toISOString();
      await persistJobs();
    }
  };

  await pollOnce();
  if (["FAILED", "ERROR", "CANCELED", "CANCELLED", "SUCCEEDED", "SUCCESS", "DONE", "COMPLETED"].includes(String(job.status).toUpperCase())) {
    return;
  }

  const timer = setInterval(() => {
    void pollOnce();
  }, Number(job.config.pollIntervalMs || 6000));
  jobTimers.set(job.id, timer);
}

async function startJob(input) {
  const jobId = makeJobId();
  const { payload, mode, modelChoice, compatibilityNote } = buildCreatePayload(input);
  const now = new Date().toISOString();

  const job = {
    id: jobId,
    prompt: input.prompt || "",
    projectPath: input.projectPath || "",
    videoName: input.videoName || "",
    shotNumber: input.shotNumber || "",
    config: {
      requestedModel: input.model,
      model: modelChoice.effectiveModel,
      mode,
      resolution: input.resolution,
      duration: input.duration,
      fps: input.fps,
      ratio: input.ratio,
      watermark: input.watermark,
      generateAudio: Boolean(input.generateAudio),
      createEndpoint: input.createEndpoint,
      queryEndpointTemplate: input.queryEndpointTemplate,
      pollIntervalMs: Number(input.pollIntervalMs || 6000),
      extraParams: input.extraParams || {},
      modelAdjusted: modelChoice.adjusted,
      modelAdjustmentReason: modelChoice.reason,
      compatibilityNote,
    },
    status: "CREATING",
    progress: null,
    taskId: "",
    createdAt: now,
    updatedAt: now,
    videoUrl: "",
    downloadedFileName: "",
    downloadedFilePath: "",
    rawCreateResponse: null,
    rawQueryResponse: null,
    error: "",
  };

  jobs.set(jobId, job);
  await persistJobs();

  try {
    const createResponse = await fetchJson(input.createEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    job.rawCreateResponse = createResponse;
    job.taskId = resolveTaskId(createResponse);
    job.status = resolveStatus(createResponse);
    job.updatedAt = new Date().toISOString();
    await persistJobs();

    if (!job.taskId) {
      throw new Error(`未从创建响应中拿到 taskId: ${JSON.stringify(createResponse)}`);
    }
    void pollJob(job, input.apiKey);
  } catch (error) {
    job.status = "ERROR";
    job.error = error.message;
    if (mode === "i2v_first_last_frame" && /task_type/i.test(error.message)) {
      job.error += " | 当前已按 first_frame/last_frame 角色提交；如果仍报 task_type，请检查账号是否对该模型开放首尾帧能力，或额外参数 JSON 中是否显式传入了 task_type/r2v。";
    }
    job.updatedAt = new Date().toISOString();
    await persistJobs();
  }

  return job;
}

function serializeJob(job) {
  const resolvedVideoUrl = job.videoUrl || resolveVideoUrl(job.rawQueryResponse || {});
  return {
    id: job.id,
    prompt: job.prompt,
    projectPath: job.projectPath || "",
    videoName: job.videoName || "",
    shotNumber: job.shotNumber || "",
    status: job.status,
    progress: job.progress,
    taskId: job.taskId,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    videoUrl: resolvedVideoUrl,
    downloadedFileName: job.downloadedFileName,
    downloadedFilePath: job.downloadedFilePath,
    error: job.error,
    config: job.config,
    rawCreateResponse: job.rawCreateResponse,
    rawQueryResponse: job.rawQueryResponse,
  };
}

function hydrateJobs() {
  for (const item of readJobsFromDisk()) {
    jobs.set(item.id, item);
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  if ((req.method === "GET" || req.method === "HEAD") && pathname === "/") {
    return sendFile(req, res, path.join(PUBLIC_DIR, "index.html"), "text/html; charset=utf-8");
  }

  if ((req.method === "GET" || req.method === "HEAD") && pathname === "/app.css") {
    return sendFile(req, res, path.join(PUBLIC_DIR, "app.css"), "text/css; charset=utf-8");
  }

  if ((req.method === "GET" || req.method === "HEAD") && pathname === "/app.js") {
    return sendFile(req, res, path.join(PUBLIC_DIR, "app.js"), "application/javascript; charset=utf-8");
  }

  if (req.method === "GET" && pathname === "/api/jobs") {
    const list = Array.from(jobs.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(serializeJob);
    return sendJson(res, 200, { jobs: list });
  }

  if (req.method === "GET" && pathname === "/api/meta") {
    return sendJson(res, 200, {
      models: MODEL_CAPABILITIES,
      defaults: {
        model: "doubao-seedance-1-5-pro-251215",
        fps: 24,
        ratio: "16:9",
        resolution: "1080p",
        pollIntervalMs: 6000,
        generateAudio: false,
      },
    });
  }

  if (req.method === "GET" && pathname === "/api/settings") {
    return sendJson(res, 200, readSettings());
  }

  if (req.method === "POST" && pathname === "/api/settings") {
    try {
      const body = await readBody(req);
      await writeSettings(body);
      return sendJson(res, 200, { ok: true });
    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  }

  if (req.method === "GET" && pathname.startsWith("/api/jobs/")) {
    if (pathname.endsWith("/media")) {
      const parts = pathname.split("/");
      const jobId = parts[3];
      const job = jobs.get(jobId);
      if (!job || !job.downloadedFilePath) return sendJson(res, 404, { error: "Media not found" });
      const ext = path.extname(job.downloadedFilePath).toLowerCase();
      const contentType = ext === ".mp4" ? "video/mp4" : "application/octet-stream";
      return sendFile(req, res, job.downloadedFilePath, contentType);
    }
    const jobId = pathname.split("/").pop();
    const job = jobs.get(jobId);
    if (!job) return sendJson(res, 404, { error: "Job not found" });
    return sendJson(res, 200, serializeJob(job));
  }

  if (req.method === "POST" && pathname === "/api/jobs") {
    try {
      const body = await readBody(req);

      if (!body.apiKey || !body.createEndpoint || !body.queryEndpointTemplate || !body.model) {
        return sendJson(res, 400, { error: "缺少必要参数：apiKey/createEndpoint/queryEndpointTemplate/model" });
      }

      const job = await startJob(body);
      return sendJson(res, 200, serializeJob(job));
    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }
  }

  if (req.method === "GET" && pathname.startsWith("/downloads/")) {
    const fileName = pathname.replace("/downloads/", "");
    const safeName = path.basename(fileName);
    const fullPath = path.join(DOWNLOAD_DIR, safeName);
    const ext = path.extname(safeName).toLowerCase();
    const contentType = ext === ".mp4" ? "video/mp4" : "application/octet-stream";
    return sendFile(req, res, fullPath, contentType);
  }

  sendJson(res, 404, { error: "Not found" });
});

hydrateJobs();
for (const job of jobs.values()) {
  if (job.taskId && !["SUCCEEDED", "SUCCESS", "DONE", "COMPLETED", "FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(String(job.status).toUpperCase())) {
    void pollJob(job);
  }
}

server.listen(PORT, HOST, () => {
  console.log(`Volcengine Video Studio running at http://${HOST}:${PORT}`);
});
