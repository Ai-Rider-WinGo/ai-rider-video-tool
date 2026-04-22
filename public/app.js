const STORAGE_KEY = "volcengine-video-studio-theme";

const form = document.getElementById("job-form");
const formStatus = document.getElementById("formStatus");
const jobsContainer = document.getElementById("jobs");
const refreshBtn = document.getElementById("refreshBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const jobTemplate = document.getElementById("job-template");
const submitBtn = document.getElementById("submitBtn");
const themeToggle = document.getElementById("themeToggle");
const modelSelect = document.getElementById("model");
const modelTip = document.getElementById("modelTip");
const videoNameSuggestions = document.getElementById("videoNameSuggestions");
const projectFolderBtn = document.getElementById("projectFolderBtn");
const projectFolderFallback = document.getElementById("projectFolderFallback");
const generationMode = document.getElementById("generationMode");
const generationModeSwitch = document.getElementById("generationModeSwitch");
const multiShotCount = document.getElementById("multiShotCount");
const multiShotCountField = document.getElementById("multiShotCountField");
const singleModeFields = document.getElementById("singleModeFields");
const multiModeFields = document.getElementById("multiModeFields");
const multiShotsContainer = document.getElementById("multiShotsContainer");
const multiShotTemplate = document.getElementById("multi-shot-template");

let meta = { models: {}, defaults: {} };
let projectDirectoryHandle = null;
const syncedProjectJobs = new Set();
let openJobId = null;
let jobsRefreshTimer = null;
let isPreviewPlaying = false;
let pendingSubmissions = 0;
const MAX_RENDERED_JOBS = 20;

function $(id) {
  return document.getElementById(id);
}

function updateSubmitButtonState() {
  submitBtn.textContent = pendingSubmissions > 0
    ? `创建任务（进行中 ${pendingSubmissions}）`
    : "创建生成任务";
}

function getGenerationMode() {
  return generationMode.value || "single";
}

function setGenerationMode(mode) {
  generationMode.value = mode;
  generationModeSwitch.querySelectorAll(".mode-option").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  updateGenerationModeUI();
}

function buildShotDisplayNumber(index) {
  return String(index + 1);
}

function renderMultiShots(count = Number(multiShotCount.value || 2)) {
  multiShotsContainer.innerHTML = "";
  for (let index = 0; index < count; index += 1) {
    const node = multiShotTemplate.content.firstElementChild.cloneNode(true);
    const shotNo = buildShotDisplayNumber(index);
    node.dataset.shotIndex = String(index + 1);
    node.querySelector(".multi-shot-title").textContent = `镜头 ${shotNo}`;
    node.querySelector(".multi-shot-number").value = shotNo;
    node.querySelector(".multi-shot-transition").textContent =
      index < count - 1 ? `将自动生成镜头 ${index + 1}.5 转场` : "最后一个镜头";
    multiShotsContainer.appendChild(node);
  }
}

function updateGenerationModeUI() {
  const mode = getGenerationMode();
  const isMulti = mode === "multi";
  multiShotCountField.hidden = !isMulti;
  multiModeFields.hidden = !isMulti;
  singleModeFields.hidden = isMulti;
  $("modeSummary").value = isMulti ? "多镜头模式" : "Seedance 1.5 Pro 严格模式";
  if (isMulti && !multiShotsContainer.children.length) {
    renderMultiShots();
  }
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function prettyJson(data) {
  return JSON.stringify(data ?? {}, null, 2);
}

function statusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (["SUCCEEDED", "SUCCESS", "DONE", "COMPLETED"].includes(normalized)) return "success";
  if (["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(normalized)) return "error";
  return "running";
}

function makeMeta(job) {
  const lines = [
    `项目路径: ${job.projectPath || "-"}`,
    `视频名称: ${job.videoName || "-"}`,
    `镜头编号: ${job.shotNumber || "-"}`,
    `任务 ID: ${job.taskId || "-"}`,
    `模式: ${job.config?.mode || "-"}`,
    `请求模型: ${job.config?.requestedModel || job.config?.model || "-"}`,
    `实际模型: ${job.config?.model || "-"}`,
    `比例: ${job.config?.ratio || "-"}`,
    `分辨率: ${job.config?.resolution || "-"}`,
    `时长: ${job.config?.duration || "-"}`,
    `FPS: ${job.config?.fps || "-"}`,
    `水印: ${job.config?.watermark ? "开启" : "关闭"}`,
    `音频: ${job.config?.generateAudio ? "开启" : "关闭"}`,
  ];

  if (job.config?.modelAdjustmentReason) {
    lines.push(`模型调整: ${job.config.modelAdjustmentReason}`);
  }

  if (job.config?.compatibilityNote) {
    lines.push(`兼容说明: ${job.config.compatibilityNote}`);
  }

  return lines.join("\n");
}

function formatProgress(job) {
  if (job.progress !== null && job.progress !== undefined && job.progress !== "") {
    const value = String(job.progress);
    return /%$/.test(value) ? value : `${value}%`;
  }

  const normalized = String(job.status || "").toUpperCase();
  if (["SUCCEEDED", "SUCCESS", "DONE", "COMPLETED"].includes(normalized)) return "100%";
  if (["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(normalized)) return "0%";
  return "--";
}

function makeCompactMeta(job) {
  return [
    `视频名称: ${job.videoName || "-"}`,
    `镜头: ${job.shotNumber || "-"}`,
    `比例: ${job.config?.ratio || "-"}`,
    `分辨率: ${job.config?.resolution || "-"}`,
    `水印: ${job.config?.watermark ? "开启" : "关闭"}`,
    `最后更新: ${new Date(job.updatedAt).toLocaleString()}`,
  ].join(" | ");
}

function buildLocalMediaUrl(jobId) {
  return `/api/jobs/${encodeURIComponent(jobId)}/media`;
}

function renderJobs(jobs) {
  jobsContainer.innerHTML = "";

  if (!jobs.length) {
    jobsContainer.innerHTML = `<div class="job-card"><div class="job-meta">还没有任务，先在左侧创建一个试试。</div></div>`;
    return;
  }

  const visibleJobs = jobs.slice(0, MAX_RENDERED_JOBS);
  if (jobs.length > visibleJobs.length) {
    const notice = document.createElement("div");
    notice.className = "job-list-notice";
    notice.textContent = `当前共 ${jobs.length} 条任务，为保证流畅，仅显示最近 ${visibleJobs.length} 条。`;
    jobsContainer.appendChild(notice);
  }

  for (const job of visibleJobs) {
    const node = jobTemplate.content.firstElementChild.cloneNode(true);
    const summary = node.querySelector(".job-summary");
    const badge = node.querySelector(".badge");
    const progress = node.querySelector(".progress");
    const prompt = node.querySelector(".job-prompt");
    const time = node.querySelector(".job-time");
    const compactMeta = node.querySelector(".job-compact-meta");
    const metaText = node.querySelector(".job-meta");
    const links = node.querySelector(".job-links");
    const errorActions = node.querySelector(".job-error-actions");
    const previewWrap = node.querySelector(".job-preview-wrap");
    const preview = node.querySelector(".job-preview");
    const json = node.querySelector(".job-json");

    badge.textContent = job.status;
    badge.classList.add(statusClass(job.status));
    progress.textContent = `进度: ${formatProgress(job)}`;
    const titleParts = [job.videoName || "未命名视频", job.shotNumber ? `镜头 ${job.shotNumber}` : ""].filter(Boolean);
    prompt.textContent = titleParts.join(" | ") || "未填写提示词";
    time.textContent = badge.textContent;
    compactMeta.textContent = makeCompactMeta(job);
    metaText.textContent = makeMeta(job);

    const isOpen = openJobId === job.id;
    const previewSrc = job.downloadedFilePath ? buildLocalMediaUrl(job.id) : job.videoUrl;
    if (isOpen && previewSrc && ["SUCCEEDED", "SUCCESS", "DONE", "COMPLETED"].includes(String(job.status).toUpperCase())) {
      preview.src = previewSrc;
      preview.load();
      previewWrap.hidden = false;
      preview.addEventListener("play", () => {
        isPreviewPlaying = true;
      });
      preview.addEventListener("playing", () => {
        isPreviewPlaying = true;
      });
      preview.addEventListener("pause", () => {
        isPreviewPlaying = false;
      });
      preview.addEventListener("ended", () => {
        isPreviewPlaying = false;
      });
    } else {
      previewWrap.hidden = true;
      preview.removeAttribute("src");
    }

    node.open = isOpen;

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      openJobId = openJobId === job.id ? job.id : job.id;
      renderJobs(jobs);
    });

    if (job.videoUrl) {
      const a = document.createElement("a");
      a.href = job.videoUrl;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.textContent = "打开火山返回的视频 URL";
      links.appendChild(a);
    }

    if (job.downloadedFilePath) {
      const a = document.createElement("a");
      a.href = buildLocalMediaUrl(job.id);
      a.target = "_blank";
      a.textContent = "打开本地已下载视频";
      links.appendChild(a);
    }

    if (job.downloadedFilePath) {
      const pathTag = document.createElement("span");
      pathTag.textContent = `本地路径: ${job.downloadedFilePath}`;
      links.appendChild(pathTag);
    }

    if (job.error) {
      const err = document.createElement("span");
      err.style.color = "var(--bad)";
      err.textContent = `错误: ${job.error}`;
      links.appendChild(err);

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "ghost";
      copyBtn.textContent = "复制错误内容";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(job.error);
          copyBtn.textContent = "已复制";
          setTimeout(() => {
            copyBtn.textContent = "复制错误内容";
          }, 1600);
        } catch {
          copyBtn.textContent = "复制失败";
        }
      });
      errorActions.appendChild(copyBtn);
    }

    if (isOpen) {
      json.textContent = prettyJson({
        create: job.rawCreateResponse,
        query: job.rawQueryResponse,
      });
    }

    jobsContainer.appendChild(node);
  }
}

async function loadJobs() {
  if (isPreviewPlaying) {
    return;
  }
  const response = await fetch("/api/jobs");
  const data = await response.json();
  if (projectDirectoryHandle) {
    for (const job of data.jobs || []) {
      if (!job.downloadedFilePath) continue;
      if (!["SUCCEEDED", "SUCCESS", "DONE", "COMPLETED"].includes(String(job.status).toUpperCase())) continue;
      if (syncedProjectJobs.has(job.id)) continue;
      try {
        await copyVideoToProjectDirectory(job);
        syncedProjectJobs.add(job.id);
      } catch {
        // Ignore directory sync failures in polling loop.
      }
    }
  }
  renderJobs(data.jobs || []);
}

function startJobsPolling() {
  if (jobsRefreshTimer) {
    clearInterval(jobsRefreshTimer);
  }
  jobsRefreshTimer = setInterval(() => {
    void loadJobs();
  }, 5000);
}

function parseExtraParams(value) {
  if (!value.trim()) return {};
  return JSON.parse(value);
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  themeToggle.textContent = theme === "light" ? "切换深色" : "切换浅色";
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY) || "dark";
  setTheme(savedTheme);
}

async function loadMeta() {
  const response = await fetch("/api/meta");
  meta = await response.json();
  const models = meta.models || {};
  modelSelect.innerHTML = "";

  for (const [id, model] of Object.entries(models)) {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${model.label} | ${id}`;
    modelSelect.appendChild(option);
  }

  if (!modelSelect.value && meta.defaults?.model) {
    modelSelect.value = meta.defaults.model;
  }
  updateModelTip();
}

function updateModelTip() {
  const current = meta.models?.[modelSelect.value];
  if (!current) {
    modelTip.textContent = "请使用火山控制台已开通的视频模型。";
    return;
  }

  const modes = current.supports.join(" / ");
  if (modelSelect.value === "doubao-seedance-1-5-pro-251215") {
    modelTip.textContent = `${current.label} 支持：${modes}。你当前要求最低使用 1.5 Pro，因此工具会保持 1.5 Pro 不降级；首尾帧场景下会按官方示例角色提交：first_frame / last_frame。`;
    return;
  }

  modelTip.textContent = `${current.label} 支持：${modes}。首尾帧场景下会按 first_frame / last_frame 角色提交。`;
}

function collectSettings(includeApiKey = true) {
  const settings = {
    generationMode: getGenerationMode(),
    multiShotCount: Number(multiShotCount.value || 2),
    projectPath: "",
    projectPathLabel: $("projectPath").value.trim(),
    videoName: $("videoName").value.trim(),
    shotNumber: $("shotNumber").value.trim(),
    model: $("model").value,
    createEndpoint: $("createEndpoint").value.trim(),
    queryEndpointTemplate: $("queryEndpointTemplate").value.trim(),
    ratio: $("ratio").value,
    resolution: $("resolution").value,
    duration: Number($("duration").value),
    fps: Number($("fps").value),
    pollIntervalMs: Number($("pollIntervalMs").value),
    seed: $("seed").value.trim(),
    watermark: $("watermark").checked,
    generateAudio: $("generateAudio").checked,
    extraParams: $("extraParams").value,
    videoNames: [$("videoName").value.trim()].filter(Boolean),
  };

  if (includeApiKey) {
    settings.apiKey = $("apiKey").value.trim();
  }

  return settings;
}

function updateVideoNameSuggestions(videoNames = []) {
  videoNameSuggestions.innerHTML = "";
  for (const name of videoNames) {
    const option = document.createElement("option");
    option.value = name;
    videoNameSuggestions.appendChild(option);
  }
}

function updateProjectPathDisplay(settings = {}) {
  $("projectPath").value = settings.projectPathLabel || settings.projectPath || "";
}

function applySettings(settings = {}) {
  const defaults = meta.defaults || {};
  $("apiKey").value = settings.apiKey || "";
  setGenerationMode(settings.generationMode || "single");
  multiShotCount.value = String(settings.multiShotCount || 2);
  updateProjectPathDisplay(settings);
  $("videoName").value = settings.videoName || "";
  $("shotNumber").value = settings.shotNumber || "";
  $("model").value = settings.model || defaults.model || "";
  $("createEndpoint").value = settings.createEndpoint || "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";
  $("queryEndpointTemplate").value = settings.queryEndpointTemplate || "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id}";
  $("ratio").value = settings.ratio || defaults.ratio || "16:9";
  $("resolution").value = settings.resolution || defaults.resolution || "1080p";
  $("duration").value = settings.duration || 4;
  $("fps").value = String(settings.fps || defaults.fps || 24);
  $("pollIntervalMs").value = settings.pollIntervalMs || defaults.pollIntervalMs || 6000;
  $("seed").value = settings.seed || "";
  $("watermark").checked = Boolean(settings.watermark);
  $("generateAudio").checked = Boolean(settings.generateAudio ?? defaults.generateAudio);
  $("extraParams").value = settings.extraParams || "";
  updateVideoNameSuggestions(settings.videoNames || []);
  renderMultiShots(Number(settings.multiShotCount || 2));
  updateModelTip();
}

async function loadSettings() {
  const response = await fetch("/api/settings");
  const settings = await response.json();
  applySettings(settings);
}

async function saveSettings() {
  const payload = collectSettings(true);
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "保存失败");
  }
}

async function pickProjectDirectory() {
  try {
    if (!window.showDirectoryPicker) {
      if ("webkitdirectory" in projectFolderFallback) {
        projectFolderFallback.click();
        return;
      }
      formStatus.textContent = "当前浏览器不支持目录选择器，请换用 Chromium 内核浏览器。";
      window.alert("当前浏览器不支持可写目录选择。请换用 Chromium 内核浏览器，或继续使用默认下载目录。");
      return;
    }

    projectDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    $("projectPath").value = projectDirectoryHandle.name || "已选择目录";
    formStatus.textContent = `已选择项目目录：${$("projectPath").value}`;
  } catch (error) {
    if (error?.name !== "AbortError") {
      formStatus.textContent = `选择目录失败：${error.message}`;
      window.alert(`选择目录失败：${error.message}`);
    }
  }
}

async function copyVideoToProjectDirectory(job) {
  if (!projectDirectoryHandle || !job.downloadedFilePath) return;
  const response = await fetch(buildLocalMediaUrl(job.id));
  if (!response.ok) {
    throw new Error("无法读取本地已下载视频");
  }
  const blob = await response.blob();
  const targetName = job.downloadedFileName || `${job.videoName || "video"}.mp4`;
  const fileHandle = await projectDirectoryHandle.getFileHandle(targetName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

function buildSharedJobPayload() {
  return {
    apiKey: $("apiKey").value.trim(),
    projectPath: "",
    videoName: $("videoName").value.trim(),
    model: $("model").value.trim(),
    createEndpoint: $("createEndpoint").value.trim(),
    queryEndpointTemplate: $("queryEndpointTemplate").value.trim(),
    ratio: $("ratio").value,
    resolution: $("resolution").value,
    fps: Number($("fps").value),
    pollIntervalMs: Number($("pollIntervalMs").value),
    seed: $("seed").value.trim(),
    watermark: $("watermark").checked,
    generateAudio: $("generateAudio").checked,
    extraParams: parseExtraParams($("extraParams").value),
  };
}

async function submitJobPayload(payload) {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "创建任务失败");
  }
  return data;
}

async function buildSinglePayload() {
  const firstFile = $("firstFrame").files[0];
  const lastFile = $("lastFrame").files[0];

  if (!firstFile || !lastFile) {
    throw new Error("请先选择首帧和尾帧图片。");
  }

  const [firstFrameDataUrl, lastFrameDataUrl] = await Promise.all([
    fileToDataUrl(firstFile),
    fileToDataUrl(lastFile),
  ]);

  const payload = {
    ...buildSharedJobPayload(),
    shotNumber: $("shotNumber").value.trim(),
    prompt: $("prompt").value.trim(),
    duration: Number($("duration").value),
    firstFrameDataUrl,
    lastFrameDataUrl,
  };

  if (!payload.prompt) {
    throw new Error("请填写提示词。");
  }

  return payload;
}

async function buildMultiPayloads() {
  const shared = buildSharedJobPayload();
  if (!shared.videoName) {
    throw new Error("多镜头模式请先填写视频名称。");
  }

  const cards = Array.from(multiShotsContainer.querySelectorAll(".multi-shot-card"));
  const shots = [];

  for (const card of cards) {
    const shotNumber = card.querySelector(".multi-shot-number").value.trim();
    const duration = Number(card.querySelector(".multi-duration").value);
    const prompt = card.querySelector(".multi-prompt").value.trim();
    const firstFile = card.querySelector(".multi-first-frame").files[0];
    const lastFile = card.querySelector(".multi-last-frame").files[0];

    if (!firstFile || !lastFile || !prompt) {
      throw new Error(`请完整填写镜头 ${shotNumber} 的首帧、尾帧和提示词。`);
    }

    const [firstFrameDataUrl, lastFrameDataUrl] = await Promise.all([
      fileToDataUrl(firstFile),
      fileToDataUrl(lastFile),
    ]);

    shots.push({
      shotNumber,
      duration,
      prompt,
      firstFrameDataUrl,
      lastFrameDataUrl,
    });
  }

  const payloads = [];
  for (let index = 0; index < shots.length; index += 1) {
    const shot = shots[index];
    payloads.push({
      ...shared,
      shotNumber: shot.shotNumber,
      duration: shot.duration,
      prompt: shot.prompt,
      firstFrameDataUrl: shot.firstFrameDataUrl,
      lastFrameDataUrl: shot.lastFrameDataUrl,
    });

    if (index < shots.length - 1) {
      const current = shots[index];
      const next = shots[index + 1];
      payloads.push({
        ...shared,
        shotNumber: `${index + 1}.5`,
        duration: 4,
        prompt: "创建连贯转场视频",
        firstFrameDataUrl: current.lastFrameDataUrl,
        lastFrameDataUrl: next.firstFrameDataUrl,
      });
    }
  }

  return payloads;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "正在创建任务...";

  try {
    const mode = getGenerationMode();
    pendingSubmissions += 1;
    updateSubmitButtonState();
    const createdJobs = [];

    if (mode === "multi") {
      const payloads = await buildMultiPayloads();
      formStatus.textContent = `正在创建多镜头任务 0/${payloads.length}...`;
      for (let index = 0; index < payloads.length; index += 1) {
        const data = await submitJobPayload(payloads[index]);
        createdJobs.push(data);
        formStatus.textContent = `正在创建多镜头任务 ${index + 1}/${payloads.length}...`;
      }
    } else {
      const payload = await buildSinglePayload();
      const data = await submitJobPayload(payload);
      createdJobs.push(data);
    }

    await saveSettings();
    if (createdJobs.length > 1) {
      formStatus.textContent = `多镜头任务已创建，共 ${createdJobs.length} 条镜头/转场任务。`;
    } else {
      const data = createdJobs[0];
      const modelNote = data.config?.modelAdjusted ? `，已自动切换到 ${data.config.model}` : "";
      formStatus.textContent = `任务已创建，ID: ${data.id}${modelNote}`;
    }
    await loadJobs();
  } catch (error) {
    formStatus.textContent = error.message;
  } finally {
    pendingSubmissions = Math.max(0, pendingSubmissions - 1);
    updateSubmitButtonState();
  }
});

saveSettingsBtn.addEventListener("click", async () => {
  try {
    await saveSettings();
    formStatus.textContent = "配置已保存，下次打开会自动带出。";
  } catch (error) {
    formStatus.textContent = error.message;
  }
});

projectFolderBtn.addEventListener("click", async () => {
  await pickProjectDirectory();
});

projectFolderFallback.addEventListener("change", () => {
  const firstFile = projectFolderFallback.files?.[0];
  if (!firstFile) return;
  const folderName = firstFile.webkitRelativePath?.split("/")[0] || "已选择目录";
  $("projectPath").value = `${folderName}（只读降级）`;
  formStatus.textContent = "当前环境不支持可写目录句柄，已仅记录目录名称；视频仍会保存到默认下载目录。";
  window.alert("当前环境不支持可写目录选择。已记录目录名称，但自动写入该目录不可用；视频仍会保存到默认下载目录。");
});

refreshBtn.addEventListener("click", async () => {
  await loadJobs();
});

themeToggle.addEventListener("click", () => {
  const next = document.body.dataset.theme === "light" ? "dark" : "light";
  setTheme(next);
});

modelSelect.addEventListener("change", updateModelTip);
generationModeSwitch.querySelectorAll(".mode-option").forEach((button) => {
  button.addEventListener("click", () => {
    setGenerationMode(button.dataset.mode);
  });
});
multiShotCount.addEventListener("change", () => {
  renderMultiShots(Number(multiShotCount.value || 2));
});

async function bootstrap() {
  applySavedTheme();
  updateSubmitButtonState();
  await loadMeta();
  await loadSettings();
  renderMultiShots(Number(multiShotCount.value || 2));
  setGenerationMode(getGenerationMode());
  await loadJobs();
  startJobsPolling();
}

bootstrap();
