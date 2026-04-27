const STORAGE_KEY = "ai-rider-theme";
const LANGUAGE_KEY = "ai-rider-language";
const MIN_DURATION_SECONDS = 4;

const form = document.getElementById("job-form");
const formStatus = document.getElementById("formStatus");
const jobsContainer = document.getElementById("jobs");
const refreshBtn = document.getElementById("refreshBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const jobTemplate = document.getElementById("job-template");
const submitBtn = document.getElementById("submitBtn");
const themeToggle = document.getElementById("themeToggle");
const langToggle = document.getElementById("langToggle");
const modelSelect = document.getElementById("model");
const modelTip = document.getElementById("modelTip");
const generationTemplateSelect = document.getElementById("generationTemplate");
const templateTip = document.getElementById("templateTip");
const templateCards = document.getElementById("templateCards");
const currentTemplateTitle = document.getElementById("currentTemplateTitle");
const currentModelTags = document.getElementById("currentModelTags");
const downloadDirPath = document.getElementById("downloadDirPath");
const configuredDownloadDir = document.getElementById("configuredDownloadDir");
const projectFolderStatus = document.getElementById("projectFolderStatus");
const topModelSummary = document.getElementById("topModelSummary");
const apiModeBadge = document.getElementById("apiModeBadge");
const videoNameSuggestions = document.getElementById("videoNameSuggestions");
const projectFolderBtn = document.getElementById("projectFolderBtn");
const resetProjectFolderBtn = document.getElementById("resetProjectFolderBtn");
const openDownloadsBtn = document.getElementById("openDownloadsBtn");
const openDownloadsPanelBtn = document.getElementById("openDownloadsPanelBtn");
const projectFolderFallback = document.getElementById("projectFolderFallback");
const generationMode = document.getElementById("generationMode");
const multiShotCount = document.getElementById("multiShotCount");
const multiShotCountMirror = document.getElementById("multiShotCountMirror");
const multiShotCountField = document.getElementById("multiShotCountField");
const singleModeFields = document.getElementById("singleModeFields");
const multiModeFields = document.getElementById("multiModeFields");
const openMultiShotBtn = document.getElementById("openMultiShotBtn");
const closeMultiShotBtn = document.getElementById("closeMultiShotBtn");
const multiShotsContainer = document.getElementById("multiShotsContainer");
const multiShotTemplate = document.getElementById("multi-shot-template");
const imageInputGrid = document.getElementById("imageInputGrid");
const firstFrameField = document.getElementById("firstFrameField");
const lastFrameField = document.getElementById("lastFrameField");
const videoInputGrid = document.getElementById("videoInputGrid");
const requestPreview = document.getElementById("requestPreview");
const endpointPreview = document.getElementById("endpointPreview");

const TEMPLATE_DEFINITIONS = {
  first_last_frame: {
    id: "first_last_frame",
    mode: "i2v_first_last_frame",
    labelKey: "templateFirstLastFrame",
    summaryKey: "templateFirstLastFrameSummary",
    tipKey: "templateFirstLastFrameTip",
    recommendedModel: "Seedance 2.0",
    inputTagKeys: ["inputTagImage", "inputTagImage", "inputTagText"],
    supportsMulti: true,
    requires: { prompt: true, firstFrame: true, lastFrame: true, video: false },
  },
  first_frame: {
    id: "first_frame",
    mode: "i2v_first_frame",
    labelKey: "templateFirstFrame",
    summaryKey: "templateFirstFrameSummary",
    tipKey: "templateFirstFrameTip",
    recommendedModel: "Seedance 2.0",
    inputTagKeys: ["inputTagImage", "inputTagText"],
    supportsMulti: false,
    requires: { prompt: true, firstFrame: true, lastFrame: false, video: false },
  },
  text_to_video: {
    id: "text_to_video",
    mode: "t2v",
    labelKey: "templateTextToVideo",
    summaryKey: "templateTextToVideoSummary",
    tipKey: "templateTextToVideoTip",
    recommendedModel: "Seedance 2.0 Fast",
    inputTagKeys: ["inputTagText"],
    supportsMulti: false,
    requires: { prompt: true, firstFrame: false, lastFrame: false, video: false },
  },
  video_extension: {
    id: "video_extension",
    mode: "video_extension",
    labelKey: "templateVideoExtension",
    summaryKey: "templateVideoExtensionSummary",
    tipKey: "templateVideoExtensionTip",
    supportsMulti: false,
    badgeKey: "templateExperimental",
    recommendedModel: "Seedance 2.0",
    inputTagKeys: ["inputTagVideo", "inputTagText"],
    requires: { prompt: true, firstFrame: false, lastFrame: false, video: true },
  },
};

const FIELD_HELP = {
  zh: {
    apiKey: "火山方舟 API Key，用于通过 Bearer Token 调用视频生成任务接口。只保存在本机 settings.json。",
    model: "视频生成模型 ID。当前工具已接入 Seedance 2.0 / 1.5 / 1.0 系列；具体首尾帧、多模态和音频能力取决于账号和模型开放情况。",
    template: "生成模板决定当前任务的输入结构。公共配置保持共用，具体输入会根据模板和模型能力动态变化。",
    templateSummary: "展示当前模板的核心用途与输入摘要。",
    generationMode: "单镜头只提交一条首尾帧任务；多镜头会为每个镜头提交任务，并自动生成相邻镜头的 4 秒转场。",
    multiShotCount: "多镜头模式下要配置的镜头数量。相邻镜头之间会额外生成转场任务。",
    projectPath: "用于标记项目目录。桌面端当前仍以本地下载目录为主，后续会升级为完整项目文件夹管理。",
    videoName: "用于任务展示和本地视频文件命名。多镜头模式必填。",
    ratio: "生成视频画幅比例，例如 16:9、9:16、1:1。应与输入图片和目标平台匹配。",
    resolution: "生成视频分辨率。分辨率越高，生成和下载时间通常越长。",
    fps: "Frames Per Second，每秒帧数。数值越高画面越流畅，当前默认 30。",
    pollIntervalMs: "创建任务后查询任务状态的间隔，单位毫秒。间隔过短会增加接口请求频率。",
    seed: "随机种子。相同提示词、图片和参数下可帮助复现实验结果；留空则由模型随机生成。",
    watermark: "是否请求模型输出带水印的视频。本工具在关闭水印时会尝试对已下载视频做本地去标处理。",
    generateAudio: "是否请求模型同时生成音频。具体可用性取决于模型和账号能力。",
    modeSummary: "展示当前提交策略。当前版本优先使用 Seedance 2.0 作为文本、图像和首尾帧生成基线。",
    tokenPriceCnyPerK: "用于本地费用估算的单价配置，单位是每千 Token 对应的人民币价格。默认值 0.016，可按你的账号实际成本手动调整。",
    shotNumber: "镜头编号，用于区分单镜头、多镜头和自动转场任务。",
    duration: "生成视频时长，当前工具限制最少 4 秒，并在前端和后端同时兜底。",
    prompt: "给模型的文字描述。建议明确镜头运动、主体变化、画面风格、节奏和终态。",
    firstFrame: "视频起始画面参考图。首尾帧模式下作为 first_frame 提交。",
    lastFrame: "视频结束画面参考图。首尾帧模式下作为 last_frame 提交。",
    extraParams: "透传给火山接口的额外 JSON 字段，用于兼容账号或模型特有能力。",
    createEndpoint: "火山方舟创建视频生成任务的接口地址。",
    queryEndpointTemplate: "火山方舟查询任务状态的接口模板，{task_id} 会替换为创建任务返回的 ID。",
    referenceVideo: "为后续视频延展、视频编辑等多模态模板预留的视频输入位。",
  },
  en: {
    apiKey: "Volcengine Ark API key, sent as a Bearer token for video generation task calls. Stored locally in settings.json.",
    model: "Video generation model ID. AI-Rider now includes Seedance 2.0 / 1.5 / 1.0 series. First/last-frame, multimodal, and audio support still depend on your account and model access.",
    template: "The generation template defines the input structure for the current task. Shared settings stay common while specific inputs adapt to template and model capabilities.",
    templateSummary: "Shows the core purpose and input summary for the current template.",
    generationMode: "Single shot submits one first/last-frame task. Multi-shot submits each shot and creates 4-second transitions between adjacent shots.",
    multiShotCount: "Number of shots to configure in multi-shot mode. Transition tasks are added between neighboring shots.",
    projectPath: "Project folder label. The desktop app currently downloads locally; full project folder management will come later.",
    videoName: "Used for task display and local video file names. Required in multi-shot mode.",
    ratio: "Output aspect ratio, such as 16:9, 9:16, or 1:1. Match it to your images and target channel.",
    resolution: "Output video resolution. Higher resolution usually takes longer to generate and download.",
    fps: "Frames per second. Higher values feel smoother; the current default is 30.",
    pollIntervalMs: "Interval for querying task status after creation, in milliseconds. Shorter intervals create more API requests.",
    seed: "Random seed. Helps reproduce results with the same prompt, images, and parameters; leave empty for random generation.",
    watermark: "Whether to request watermarked output. When disabled, AI-Rider also attempts local badge cleanup after download.",
    generateAudio: "Whether to request generated audio. Availability depends on the selected model and account capability.",
    modeSummary: "Shows the current submit strategy. This build prioritizes Seedance 2.0 as the baseline for text, image, and first/last-frame generation.",
    tokenPriceCnyPerK: "Local cost-estimation price input, measured in CNY per 1K tokens. The default is 0.016 and can be adjusted to match your actual account pricing.",
    shotNumber: "Shot number used to distinguish single shots, multi-shot entries, and generated transitions.",
    duration: "Output duration. AI-Rider enforces a minimum of 4 seconds in both UI and server payloads.",
    prompt: "Text prompt for the model. Describe camera motion, subject changes, visual style, rhythm, and final state.",
    firstFrame: "Reference image for the starting frame. Submitted as first_frame in first/last-frame mode.",
    lastFrame: "Reference image for the ending frame. Submitted as last_frame in first/last-frame mode.",
    extraParams: "Additional JSON fields passed through to the Volcengine API for account or model-specific capabilities.",
    createEndpoint: "Volcengine Ark endpoint for creating a video generation task.",
    queryEndpointTemplate: "Volcengine Ark task status endpoint template. {task_id} is replaced with the returned task ID.",
    referenceVideo: "Video input reserved for future multimodal templates such as video extension and video editing.",
  },
};

const I18N = {
  zh: {
    appTitle: "AI-Rider｜首尾帧生成视频工具",
    lead: "上传首尾帧，配置火山视频模型，自动创建任务、轮询状态并下载结果到本地。",
    downloadDir: "下载目录",
    openDownloads: "打开下载目录",
    localSettings: "本地设置",
    currentDownloadLocation: "当前下载位置",
    defaultDownloadLocation: "默认下载目录",
    chooseDownloadDir: "选择下载目录",
    resetDownloadDir: "恢复默认目录",
    usingDefaultDownloadDir: "当前未指定自定义目录，任务视频会保存到默认下载目录。",
    usingCustomDownloadDir: "当前已指定自定义目录标签：{path}。若环境支持可写目录句柄，生成完成后会尝试同步写入该目录。",
    statTotal: "总数",
    statRunning: "进行中",
    statDone: "完成",
    statError: "异常",
    apiKeyPlaceholder: "输入一次后可保存",
    model: "模型",
    template: "生成模板",
    templateSummary: "模板说明",
    themeLight: "切换浅色",
    themeDark: "切换深色",
    generationConfig: "生成配置",
    generationStudio: "视频生成工作台",
    saveSettings: "保存配置",
    generationMode: "生成模式",
    singleMode: "单镜头模式",
    multiMode: "多镜头模式",
    shotCount: "镜头数量",
    projectFolder: "项目目录",
    chooseProjectFolder: "选择项目目录",
    noFolder: "未选择目录",
    videoName: "视频名称",
    videoNamePlaceholder: "例如：视频 1",
    ratio: "视频比例",
    resolution: "分辨率",
    pollInterval: "轮询间隔（毫秒）",
    seed: "随机种子",
    optional: "可选",
    watermark: "水印",
    generateAudio: "生成音频",
    outputSettings: "输出设置",
    advancedWorkflow: "高级工作流",
    multiEntryHelp: "默认先走单镜头生成；需要复杂分镜时再进入多镜头编辑。",
    openMultiShot: "多镜头编辑",
    backToSingle: "返回单镜头",
    submitStrategy: "提交策略",
    strictMode: "Seedance 2.0 基线模式",
    multiModeSummary: "多镜头模式",
    shotNumber: "镜头编号",
    shotNumberPlaceholder: "例如：1",
    duration: "时长（秒）",
    prompt: "提示词",
    singlePromptPlaceholder: "在这里明确描述镜头运动、节奏、风格、镜头语言和终态。",
    multiPromptPlaceholder: "描述这个镜头的运动、风格与节奏。",
    firstFrame: "首帧图片",
    lastFrame: "尾帧图片",
    multiShotConfig: "多镜头配置",
    multiShotHelp: "每个镜头独立设置首尾帧、时长和提示词；系统会自动在相邻镜头间插入 4 秒转场视频。",
    extraParams: "额外参数 JSON",
    extraParamsHelp: "用于透传账号或模型特有字段",
    extraParamsPlaceholder: "例如：{\"return_last_frame\": true}",
    advancedConfig: "高级配置",
    createEndpoint: "创建任务接口",
    queryEndpoint: "查询任务接口模板",
    tokenPriceCnyPerK: "单价（元 / 千 Token）",
    createTask: "创建生成任务",
    generateVideo: "生成视频",
    creatingTaskCount: "创建任务（进行中 {count}）",
    jobStatus: "任务状态",
    refresh: "刷新",
    viewRaw: "查看原始返回",
    shotTitle: "镜头 {number}",
    transitionNext: "将自动生成镜头 {number}.5 转场",
    finalShot: "最后一个镜头",
    noJobs: "还没有任务，先在左侧创建一个试试。",
    listNotice: "当前共 {total} 条任务，为保证流畅，仅显示最近 {visible} 条。",
    promptPresetA: "生成连续转场画面，要求连贯，不掉帧。",
    promptPresetB: "生成连续转场画面，要求绚丽爆炸，不俗气。",
    promptPresetC: "生成连续转场画面，要求平滑连续。",
    templateFirstLastFrame: "首尾帧生成",
    templateFirstFrame: "首帧生成",
    templateTextToVideo: "文生视频",
    templateVideoExtension: "视频延展",
    templateExperimental: "实验",
    inputTagText: "Text",
    inputTagImage: "Image",
    inputTagVideo: "Video",
    inputTagAudio: "Audio",
    recommendedModel: "推荐模型",
    templateFirstLastFrameSummary: "首图 + 尾图 + 提示词",
    templateFirstFrameSummary: "首图 + 提示词",
    templateTextToVideoSummary: "提示词直出视频",
    templateVideoExtensionSummary: "参考视频 + 提示词",
    templateFirstLastFrameTip: "适合做严格可控的起止画面生成，最贴合当前 AI-Rider 主工作流。",
    templateFirstFrameTip: "适合从单张起始画面生成镜头，不要求明确尾图。",
    templateTextToVideoTip: "适合快速验证灵感或做纯提示词生成。",
    templateVideoExtensionTip: "仅对 Seedance 2.0 系列开放。当前按实验方式接入，用于续写或延展已有视频。",
    modelFallbackTip: "请使用火山控制台已开通的视频模型。",
    modelTipStrict: "{label} 支持：{modes}。当前版本会优先保持 Seedance 2.0 作为基线模型；首尾帧场景下会按 first_frame / last_frame 角色提交。",
    modelTip: "{label} 支持：{modes}。当前场景会按模型能力映射自动选择兼容提交流程。",
    durationError: "生成时长最少为 4 秒。",
    missingFrames: "请先选择首帧和尾帧图片。",
    missingFirstFrame: "请先选择首帧图片。",
    missingReferenceVideo: "请先选择参考视频。",
    missingPrompt: "请填写提示词。",
    missingVideoName: "多镜头模式请先填写视频名称。",
    missingShot: "请完整填写镜头 {number} 的首帧、尾帧和提示词。",
    transitionPrompt: "生成连续转场画面，要求平滑连续。",
    creating: "正在创建任务...",
    creatingMultiStart: "正在创建多镜头任务 0/{total}...",
    creatingMultiProgress: "正在创建多镜头任务 {current}/{total}...",
    multiCreated: "多镜头任务已创建，共 {count} 条镜头/转场任务。",
    taskCreated: "任务已创建，ID: {id}{note}",
    modelAdjustedNote: "，已自动切换到 {model}",
    settingsSaved: "配置已保存，下次打开会自动带出。",
    saveFailed: "保存失败",
    createFailed: "创建任务失败",
    dirUnsupported: "当前浏览器不支持目录选择器，请换用 Chromium 内核浏览器。",
    dirUnsupportedAlert: "当前浏览器不支持可写目录选择。请换用 Chromium 内核浏览器，或继续使用默认下载目录。",
    dirSelected: "已选择项目目录：{path}",
    dirFailed: "选择目录失败：{message}",
    fallbackFolder: "已选择目录",
    readonlyFolder: "{folder}（只读降级）",
    dirReadonly: "当前环境不支持可写目录句柄，已仅记录目录名称；视频仍会保存到默认下载目录。",
    dirReadonlyAlert: "当前环境不支持可写目录选择。已记录目录名称，但自动写入该目录不可用；视频仍会保存到默认下载目录。",
    localVideoError: "无法读取本地已下载视频",
  },
  en: {
    appTitle: "AI-Rider | First/Last Frame Video Tool",
    lead: "Upload first and last frames, configure the video model, create tasks, poll status, and download results locally.",
    downloadDir: "Download folder",
    openDownloads: "Open downloads",
    localSettings: "Local",
    currentDownloadLocation: "Current download location",
    defaultDownloadLocation: "Default downloads folder",
    chooseDownloadDir: "Choose download folder",
    resetDownloadDir: "Reset to default",
    usingDefaultDownloadDir: "No custom folder is selected. Generated videos will use the default downloads folder.",
    usingCustomDownloadDir: "Custom folder label selected: {path}. If writable directory handles are supported, completed videos will also sync there.",
    statTotal: "Total",
    statRunning: "Running",
    statDone: "Done",
    statError: "Error",
    apiKeyPlaceholder: "Saved after first entry",
    model: "Model",
    template: "Template",
    templateSummary: "Template summary",
    themeLight: "Light",
    themeDark: "Dark",
    generationConfig: "Generation",
    generationStudio: "Video Workbench",
    saveSettings: "Save",
    generationMode: "Generation mode",
    singleMode: "Single shot",
    multiMode: "Multi-shot",
    shotCount: "Shot count",
    projectFolder: "Project folder",
    chooseProjectFolder: "Choose folder",
    noFolder: "No folder selected",
    videoName: "Video name",
    videoNamePlaceholder: "e.g. Video 1",
    ratio: "Aspect ratio",
    resolution: "Resolution",
    pollInterval: "Polling interval (ms)",
    seed: "Seed",
    optional: "Optional",
    watermark: "Watermark",
    generateAudio: "Generate audio",
    outputSettings: "Output settings",
    advancedWorkflow: "Advanced workflow",
    multiEntryHelp: "Stay on the default single-shot flow unless you need storyboard-level editing.",
    openMultiShot: "Open multi-shot editor",
    backToSingle: "Back to single shot",
    submitStrategy: "Submit strategy",
    strictMode: "Seedance 2.0 baseline mode",
    multiModeSummary: "Multi-shot mode",
    shotNumber: "Shot number",
    shotNumberPlaceholder: "e.g. 1",
    duration: "Duration (sec)",
    prompt: "Prompt",
    singlePromptPlaceholder: "Describe camera motion, rhythm, style, shot language, and the final state.",
    multiPromptPlaceholder: "Describe this shot's motion, style, and rhythm.",
    firstFrame: "First frame",
    lastFrame: "Last frame",
    multiShotConfig: "Multi-shot setup",
    multiShotHelp: "Configure each shot independently. The system inserts a 4-second transition between adjacent shots.",
    extraParams: "Extra JSON params",
    extraParamsHelp: "Pass through account or model-specific fields",
    extraParamsPlaceholder: "Example: {\"return_last_frame\": true}",
    advancedConfig: "Advanced",
    createEndpoint: "Create task endpoint",
    queryEndpoint: "Query task endpoint template",
    tokenPriceCnyPerK: "Price (CNY / 1K tokens)",
    createTask: "Create task",
    generateVideo: "Generate video",
    creatingTaskCount: "Creating ({count})",
    jobStatus: "Task status",
    refresh: "Refresh",
    viewRaw: "Raw response",
    shotTitle: "Shot {number}",
    transitionNext: "Auto-generates shot {number}.5 transition",
    finalShot: "Final shot",
    noJobs: "No tasks yet. Create one from the left panel.",
    listNotice: "{total} tasks total. Showing latest {visible} for smooth rendering.",
    promptPresetA: "Generate continuous transition footage that is coherent and does not drop frames.",
    promptPresetB: "Generate continuous transition footage that is dazzling and explosive, but not tacky.",
    promptPresetC: "Generate continuous transition footage that is smooth and continuous.",
    templateFirstLastFrame: "First + Last Frame",
    templateFirstFrame: "First Frame",
    templateTextToVideo: "Text to Video",
    templateVideoExtension: "Video Extension",
    templateExperimental: "Experimental",
    inputTagText: "Text",
    inputTagImage: "Image",
    inputTagVideo: "Video",
    inputTagAudio: "Audio",
    recommendedModel: "Recommended",
    templateFirstLastFrameSummary: "First frame + last frame + prompt",
    templateFirstFrameSummary: "First frame + prompt",
    templateTextToVideoSummary: "Prompt-only video generation",
    templateVideoExtensionSummary: "Reference video + prompt",
    templateFirstLastFrameTip: "Best for tightly controlled start/end shots and closest to the current AI-Rider core workflow.",
    templateFirstFrameTip: "Best for generating a shot from one starting frame without a fixed ending frame.",
    templateTextToVideoTip: "Best for quick ideation and prompt-only generation.",
    templateVideoExtensionTip: "Available only for Seedance 2.0 models. Currently wired as an experimental flow for continuing or extending an existing video.",
    modelFallbackTip: "Use a video model enabled in your Volcengine console.",
    modelTipStrict: "{label} supports: {modes}. This build keeps Seedance 2.0 as the baseline model and submits first/last-frame jobs with first_frame / last_frame roles.",
    modelTip: "{label} supports: {modes}. The current flow maps the request to a compatible model-specific submission path.",
    durationError: "Duration must be at least 4 seconds.",
    missingFrames: "Select first and last frame images first.",
    missingFirstFrame: "Select the first frame image first.",
    missingReferenceVideo: "Select the reference video first.",
    missingPrompt: "Enter a prompt.",
    missingVideoName: "Enter a video name before using multi-shot mode.",
    missingShot: "Complete first frame, last frame, and prompt for shot {number}.",
    transitionPrompt: "Generate continuous transition footage that is smooth and continuous.",
    creating: "Creating task...",
    creatingMultiStart: "Creating multi-shot tasks 0/{total}...",
    creatingMultiProgress: "Creating multi-shot tasks {current}/{total}...",
    multiCreated: "Created {count} shot/transition tasks.",
    taskCreated: "Task created, ID: {id}{note}",
    modelAdjustedNote: ", automatically switched to {model}",
    settingsSaved: "Settings saved for next launch.",
    saveFailed: "Save failed",
    createFailed: "Task creation failed",
    dirUnsupported: "This environment does not support folder selection. Use a Chromium browser.",
    dirUnsupportedAlert: "Writable folder selection is unavailable. Continue with the default download folder.",
    dirSelected: "Project folder selected: {path}",
    dirFailed: "Folder selection failed: {message}",
    fallbackFolder: "Selected folder",
    readonlyFolder: "{folder} (read-only fallback)",
    dirReadonly: "Writable folder handles are unavailable. The folder name was saved; videos still download to the default folder.",
    dirReadonlyAlert: "Writable folder selection is unavailable. The folder name was saved, but automatic writes still use the default folder.",
    localVideoError: "Unable to read the downloaded local video",
  },
};

let meta = { models: {}, defaults: {} };
let projectDirectoryHandle = null;
const syncedProjectJobs = new Set();
let openJobId = null;
let jobsRefreshTimer = null;
let isPreviewPlaying = false;
let pendingSubmissions = 0;
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || "zh";
const MAX_RENDERED_JOBS = 20;

function $(id) {
  return document.getElementById(id);
}

function t(key, values = {}) {
  const template = I18N[currentLanguage]?.[key] || I18N.zh[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? "");
}

function normalizeDuration(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return MIN_DURATION_SECONDS;
  return Math.max(MIN_DURATION_SECONDS, parsed);
}

function getSelectedTemplateId() {
  return generationTemplateSelect.value || "first_last_frame";
}

function getSelectedTemplate() {
  return TEMPLATE_DEFINITIONS[getSelectedTemplateId()] || TEMPLATE_DEFINITIONS.first_last_frame;
}

function modelSupportsTemplate(model, template) {
  if (!model || !template) return false;
  return (model.supports || []).includes(template.mode)
    || (template.mode === "i2v_first_last_frame" && (model.supports || []).includes("i2v_first_last_frame_experimental"));
}

function getSupportedTemplatesForModel(model) {
  return Object.values(TEMPLATE_DEFINITIONS).filter((template) => modelSupportsTemplate(model, template));
}

function applyI18n(root = document) {
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  document.title = t("appTitle");

  root.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });

  if (langToggle) {
    langToggle.textContent = currentLanguage === "zh" ? "EN" : "中文";
  }
  setTheme(document.body.dataset.theme || localStorage.getItem(STORAGE_KEY) || "dark");
  renderPromptPresets(root);
  applyHelpTooltips(root);
  updateSubmitButtonState();
  updateStatusSurface();
  updateAdvancedPreview();
  updateDownloadDirectoryUI();
}

function getHelpText(key) {
  return FIELD_HELP[currentLanguage]?.[key] || FIELD_HELP.zh[key] || "";
}

function getHelpKey(label) {
  const control = label.querySelector("input, select, textarea");
  if (control?.id) return control.id;
  if (control?.classList.contains("multi-duration")) return "duration";
  if (control?.classList.contains("multi-first-frame")) return "firstFrame";
  if (control?.classList.contains("multi-last-frame")) return "lastFrame";
  if (control?.classList.contains("multi-prompt")) return "prompt";
  return "";
}

function applyHelpTooltips(root = document) {
  root.querySelectorAll("label").forEach((label) => {
    const key = getHelpKey(label);
    const helpText = getHelpText(key);
    const span = label.querySelector(":scope > span");
    if (!span || !helpText) return;

    let row = span.closest(".label-row");
    if (!row) {
      row = document.createElement("span");
      row.className = "label-row";
      span.replaceWith(row);
      row.appendChild(span);
    }

    let help = row.querySelector(".help-dot");
    if (!help) {
      help = document.createElement("span");
      help.className = "help-dot";
      help.tabIndex = 0;
      help.textContent = "?";
      row.appendChild(help);
    }

    help.dataset.tooltip = helpText;
    help.setAttribute("aria-label", helpText);
  });
}

function renderPromptPresets(root = document) {
  root.querySelectorAll(".prompt-presets").forEach((container) => {
    container.innerHTML = "";
    ["promptPresetA", "promptPresetB", "promptPresetC"].forEach((key) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "prompt-preset";
      button.dataset.promptPreset = key;
      button.textContent = t(key);
      container.appendChild(button);
    });
  });
}

function updateSubmitButtonState() {
  submitBtn.textContent = pendingSubmissions > 0
    ? t("creatingTaskCount", { count: pendingSubmissions })
    : t("generateVideo");
}

function getGenerationMode() {
  return generationMode.value || "single";
}

function setGenerationMode(mode) {
  generationMode.value = mode;
  if (openMultiShotBtn) {
    openMultiShotBtn.disabled = mode === "multi";
  }
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
    node.querySelector(".multi-shot-title").textContent = t("shotTitle", { number: shotNo });
    node.querySelector(".multi-shot-number").value = shotNo;
    node.querySelector(".multi-shot-transition").textContent =
      index < count - 1 ? t("transitionNext", { number: index + 1 }) : t("finalShot");
    applyI18n(node);
    multiShotsContainer.appendChild(node);
  }
}

function updateMultiShotLabels() {
  Array.from(multiShotsContainer.querySelectorAll(".multi-shot-card")).forEach((card, index, cards) => {
    const shotNo = buildShotDisplayNumber(index);
    card.querySelector(".multi-shot-title").textContent = t("shotTitle", { number: shotNo });
    card.querySelector(".multi-shot-transition").textContent =
      index < cards.length - 1 ? t("transitionNext", { number: index + 1 }) : t("finalShot");
  });
}

function updateGenerationModeUI() {
  const mode = getGenerationMode();
  const isMulti = mode === "multi";
  const template = getSelectedTemplate();
  if (isMulti && !template.supportsMulti) {
    setGenerationMode("single");
    return;
  }
  multiShotCountField.hidden = true;
  multiModeFields.hidden = !isMulti;
  singleModeFields.hidden = isMulti;
  const current = meta.models?.[modelSelect.value];
  $("modeSummary").value = isMulti ? t("multiModeSummary") : (current?.label || t("strictMode"));
  if (isMulti && !multiShotsContainer.children.length) {
    renderMultiShots();
  }
  if (multiShotCountMirror) {
    multiShotCountMirror.value = multiShotCount.value;
  }
  updateAdvancedPreview();
}

function refreshTemplateOptions() {
  const currentModel = meta.models?.[modelSelect.value];
  const supportedTemplates = getSupportedTemplatesForModel(currentModel);
  const previousValue = getSelectedTemplateId();
  generationTemplateSelect.innerHTML = "";

  for (const template of supportedTemplates) {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = t(template.labelKey);
    generationTemplateSelect.appendChild(option);
  }

  if (supportedTemplates.some((template) => template.id === previousValue)) {
    generationTemplateSelect.value = previousValue;
  } else if (supportedTemplates[0]) {
    generationTemplateSelect.value = supportedTemplates[0].id;
  }

  updateTemplateUI();
}

function updateTemplateUI() {
  const template = getSelectedTemplate();
  if ($("templateSummary")) $("templateSummary").value = t(template.summaryKey);
  templateTip.textContent = t(template.tipKey);
  if (currentTemplateTitle) currentTemplateTitle.textContent = t(template.labelKey);
  renderTemplateCards();

  firstFrameField.hidden = !template.requires.firstFrame;
  lastFrameField.hidden = !template.requires.lastFrame;
  imageInputGrid.hidden = !template.requires.firstFrame && !template.requires.lastFrame;
  videoInputGrid.hidden = !template.requires.video;

  if (openMultiShotBtn) {
    openMultiShotBtn.hidden = !template.supportsMulti;
  }
  if (!template.supportsMulti && getGenerationMode() === "multi") {
    generationMode.value = "single";
  }

  renderCurrentModelTags();
  updateGenerationModeUI();
  updateAdvancedPreview();
}

function renderTemplateCards() {
  const currentModel = meta.models?.[modelSelect.value];
  const supportedTemplates = getSupportedTemplatesForModel(currentModel);
  templateCards.innerHTML = "";

  for (const template of supportedTemplates) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `template-card${template.id === getSelectedTemplateId() ? " active" : ""}`;
    button.dataset.templateId = template.id;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(template.id === getSelectedTemplateId()));

    const title = document.createElement("div");
    title.className = "template-card-title";
    title.textContent = t(template.labelKey);
    button.appendChild(title);

    const summary = document.createElement("div");
    summary.className = "template-card-summary";
    summary.textContent = t(template.summaryKey);
    button.appendChild(summary);

    const tags = document.createElement("div");
    tags.className = "template-card-tags";
    for (const key of template.inputTagKeys || []) {
      const tag = document.createElement("span");
      tag.className = "template-input-tag";
      tag.textContent = t(key);
      tags.appendChild(tag);
    }
    button.appendChild(tags);

    const foot = document.createElement("div");
    foot.className = "template-card-foot";
    const recommended = document.createElement("span");
    recommended.className = "template-card-recommended";
    recommended.textContent = `${t("recommendedModel")} ${template.recommendedModel}`;
    foot.appendChild(recommended);

    if (template.badgeKey) {
      const badge = document.createElement("span");
      badge.className = "template-card-badge";
      badge.textContent = t(template.badgeKey);
      foot.appendChild(badge);
    }

    button.appendChild(foot);

    button.addEventListener("click", () => {
      generationTemplateSelect.value = template.id;
      updateTemplateUI();
    });

    templateCards.appendChild(button);
  }
}

function renderCurrentModelTags() {
  if (!currentModelTags) return;
  const current = meta.models?.[modelSelect.value];
  currentModelTags.innerHTML = "";
  const labels = current?.modeLabels || [];
  for (const label of labels.slice(0, 4)) {
    const chip = document.createElement("span");
    chip.className = "model-capability-tag";
    chip.textContent = label;
    currentModelTags.appendChild(chip);
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

  const usage = job.rawQueryResponse?.usage;
  if (usage?.total_tokens !== undefined || usage?.completion_tokens !== undefined) {
    const totalTokens = usage?.total_tokens ?? "-";
    const completionTokens = usage?.completion_tokens ?? "-";
    lines.push(`Token 消耗: total=${totalTokens}, completion=${completionTokens}`);
    const estimatedCost = estimateJobCostCny(job);
    if (estimatedCost !== null) {
      lines.push(`费用预估: ¥${estimatedCost.toFixed(4)} (${getTokenPriceLabel(job)})`);
    }
  }

  if (job.config?.modelAdjustmentReason) {
    lines.push(`模型调整: ${job.config.modelAdjustmentReason}`);
  }

  if (job.config?.compatibilityNote) {
    lines.push(`兼容说明: ${job.config.compatibilityNote}`);
  }

  return lines.join("\n");
}

function getTokenPricePerK(job) {
  const fromConfig = Number(job?.config?.tokenPriceCnyPerK);
  if (Number.isFinite(fromConfig) && fromConfig >= 0) return fromConfig;

  const fromSettings = Number($("tokenPriceCnyPerK")?.value);
  if (Number.isFinite(fromSettings) && fromSettings >= 0) return fromSettings;

  return 0.016;
}

function estimateJobCostCny(job) {
  const totalTokens = Number(job?.rawQueryResponse?.usage?.total_tokens);
  if (!Number.isFinite(totalTokens)) return null;
  return (totalTokens / 1000) * getTokenPricePerK(job);
}

function getTokenPriceLabel(job) {
  const price = getTokenPricePerK(job);
  return `¥${price.toFixed(3)} / 千 Token`;
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
  const parts = [
    { label: "模型", value: job.config?.model || "-" },
    { label: "进度", value: formatProgress(job) },
  ];
  const cost = estimateJobCostCny(job);
  if (cost !== null) {
    parts.push({ label: "费用", value: `¥${cost.toFixed(4)}` });
  }
  return parts;
}

function buildLocalMediaUrl(jobId) {
  return `/api/jobs/${encodeURIComponent(jobId)}/media`;
}

function renderJobs(jobs) {
  updateJobCounts(jobs);
  jobsContainer.innerHTML = "";

  if (!jobs.length) {
    jobsContainer.innerHTML = `<div class="job-card"><div class="job-meta">${t("noJobs")}</div></div>`;
    return;
  }

  const visibleJobs = jobs.slice(0, MAX_RENDERED_JOBS);
  if (jobs.length > visibleJobs.length) {
    const notice = document.createElement("div");
    notice.className = "job-list-notice";
    notice.textContent = t("listNotice", { total: jobs.length, visible: visibleJobs.length });
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
    time.textContent = new Date(job.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    compactMeta.innerHTML = "";
    for (const item of makeCompactMeta(job)) {
      const chip = document.createElement("span");
      chip.className = "job-meta-chip";
      chip.innerHTML = `<em>${item.label}</em><strong>${item.value}</strong>`;
      compactMeta.appendChild(chip);
    }
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

    applyI18n(node);
    jobsContainer.appendChild(node);
  }
}

function updateJobCounts(jobs = []) {
  const totals = {
    total: jobs.length,
    running: 0,
    done: 0,
    error: 0,
  };

  for (const job of jobs) {
    const normalized = String(job.status || "").toUpperCase();
    if (["SUCCEEDED", "SUCCESS", "DONE", "COMPLETED"].includes(normalized)) {
      totals.done += 1;
    } else if (["FAILED", "ERROR", "CANCELED", "CANCELLED"].includes(normalized)) {
      totals.error += 1;
    } else {
      totals.running += 1;
    }
  }

  if ($("jobCountTotal")) $("jobCountTotal").textContent = String(totals.total);
  if ($("jobCountRunning")) $("jobCountRunning").textContent = String(totals.running);
  if ($("jobCountDone")) $("jobCountDone").textContent = String(totals.done);
  if ($("jobCountError")) $("jobCountError").textContent = String(totals.error);
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
  themeToggle.textContent = theme === "light" ? t("themeDark") : t("themeLight");
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY) || "dark";
  setTheme(savedTheme);
}

async function loadMeta() {
  const response = await fetch("/api/meta");
  meta = await response.json();
  updateVersionBadge();
  const models = Object.fromEntries(
    Object.entries(meta.models || {}).filter(([, model]) => model.status !== "planned"),
  );
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
  if (downloadDirPath) {
    downloadDirPath.textContent = meta.paths?.downloadDir || "-";
  }
  updateDownloadDirectoryUI();
  refreshTemplateOptions();
  updateModelTip();
  updateStatusSurface();
  renderCurrentModelTags();
}

function updateVersionBadge() {
  const versionText = meta.app?.version ? `v${meta.app.version}` : "v2.x";
  const versionTitle = meta.app?.versionLabel || versionText;
  const badges = [$("versionBadge"), $("compactVersionBadge")].filter(Boolean);

  badges.forEach((badge) => {
    badge.textContent = versionText;
    badge.title = versionTitle;
    badge.setAttribute("aria-label", versionTitle);
  });
}

function updateModelTip() {
  const current = meta.models?.[modelSelect.value];
  if (!current) {
    modelTip.textContent = t("modelFallbackTip");
    if (topModelSummary) topModelSummary.textContent = "-";
    return;
  }

  const modes = (current.modeLabels || current.supports || []).join(" / ");
  if (topModelSummary) topModelSummary.textContent = current.label;
  if (String(modelSelect.value).startsWith("doubao-seedance-2-0")) {
    modelTip.textContent = t("modelTipStrict", { label: current.label, modes });
    refreshTemplateOptions();
    renderCurrentModelTags();
    updateAdvancedPreview();
    return;
  }

  modelTip.textContent = t("modelTip", { label: current.label, modes });
  refreshTemplateOptions();
  renderCurrentModelTags();
  updateAdvancedPreview();
}

function updateStatusSurface() {
  if (apiModeBadge) {
    apiModeBadge.textContent = $("apiKey")?.value?.trim() ? "用户 API" : "免费模式";
  }
  const current = meta.models?.[modelSelect.value];
  if (topModelSummary) {
    topModelSummary.textContent = current?.label || "-";
  }
}

function collectSettings(includeApiKey = true) {
  const settings = {
    generationMode: getGenerationMode(),
    generationTemplate: getSelectedTemplateId(),
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
    duration: normalizeDuration($("duration").value),
    fps: Number($("fps").value),
    pollIntervalMs: Number($("pollIntervalMs").value),
    seed: $("seed").value.trim(),
    watermark: $("watermark").checked,
    generateAudio: $("generateAudio").checked,
    extraParams: $("extraParams").value,
    tokenPriceCnyPerK: Number($("tokenPriceCnyPerK").value || 0.016),
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
  updateDownloadDirectoryUI();
}

function updateDownloadDirectoryUI() {
  const customPath = $("projectPath")?.value?.trim();
  if (configuredDownloadDir) {
    configuredDownloadDir.textContent = customPath || meta.paths?.downloadDir || "-";
  }
  if (projectFolderStatus) {
    projectFolderStatus.textContent = customPath
      ? t("usingCustomDownloadDir", { path: customPath })
      : t("usingDefaultDownloadDir");
  }
}

function applySettings(settings = {}) {
  const defaults = meta.defaults || {};
  $("apiKey").value = settings.apiKey || "";
  setGenerationMode(settings.generationMode || "single");
  generationTemplateSelect.value = settings.generationTemplate || "first_last_frame";
  multiShotCount.value = String(settings.multiShotCount || 2);
  if (multiShotCountMirror) multiShotCountMirror.value = String(settings.multiShotCount || 2);
  updateProjectPathDisplay(settings);
  $("videoName").value = settings.videoName || "";
  $("shotNumber").value = settings.shotNumber || "";
  $("model").value = settings.model || defaults.model || "";
  $("createEndpoint").value = settings.createEndpoint || "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";
  $("queryEndpointTemplate").value = settings.queryEndpointTemplate || "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id}";
  $("ratio").value = settings.ratio || defaults.ratio || "16:9";
  $("resolution").value = settings.resolution || defaults.resolution || "1080p";
  $("duration").value = normalizeDuration(settings.duration || MIN_DURATION_SECONDS);
  $("fps").value = String(settings.fps || defaults.fps || 30);
  $("pollIntervalMs").value = settings.pollIntervalMs || defaults.pollIntervalMs || 6000;
  $("tokenPriceCnyPerK").value = String(settings.tokenPriceCnyPerK ?? defaults.tokenPriceCnyPerK ?? 0.016);
  $("seed").value = settings.seed || "";
  $("watermark").checked = Boolean(settings.watermark);
  $("generateAudio").checked = Boolean(settings.generateAudio ?? defaults.generateAudio);
  $("extraParams").value = settings.extraParams || "";
  updateVideoNameSuggestions(settings.videoNames || []);
  renderMultiShots(Number(settings.multiShotCount || 2));
  updateTemplateUI();
  updateModelTip();
  updateStatusSurface();
  updateAdvancedPreview();
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
    throw new Error(data.error || t("saveFailed"));
  }
}

async function pickProjectDirectory() {
  try {
    if (!window.showDirectoryPicker) {
      if ("webkitdirectory" in projectFolderFallback) {
        projectFolderFallback.click();
        return;
      }
      formStatus.textContent = t("dirUnsupported");
      window.alert(t("dirUnsupportedAlert"));
      return;
    }

    projectDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    $("projectPath").value = projectDirectoryHandle.name || t("fallbackFolder");
    updateDownloadDirectoryUI();
    await saveSettings();
    formStatus.textContent = t("dirSelected", { path: $("projectPath").value });
  } catch (error) {
    if (error?.name !== "AbortError") {
      formStatus.textContent = t("dirFailed", { message: error.message });
      window.alert(t("dirFailed", { message: error.message }));
    }
  }
}

async function copyVideoToProjectDirectory(job) {
  if (!projectDirectoryHandle || !job.downloadedFilePath) return;
  const response = await fetch(buildLocalMediaUrl(job.id));
  if (!response.ok) {
    throw new Error(t("localVideoError"));
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
    tokenPriceCnyPerK: Number($("tokenPriceCnyPerK").value || 0.016),
    seed: $("seed").value.trim(),
    watermark: $("watermark").checked,
    generateAudio: $("generateAudio").checked,
    extraParams: parseExtraParams($("extraParams").value),
  };
}

function buildRequestPreviewPayload() {
  const template = getSelectedTemplate();
  const current = meta.models?.[modelSelect.value];
  return {
    template: template.id,
    templateMode: template.mode,
    generationMode: getGenerationMode(),
    model: current?.label || modelSelect.value || "-",
    ratio: $("ratio").value,
    resolution: $("resolution").value,
    fps: Number($("fps").value),
    duration: normalizeDuration($("duration").value),
    watermark: $("watermark").checked,
    generateAudio: $("generateAudio").checked,
    hasPrompt: Boolean($("prompt")?.value?.trim()),
    hasFirstFrame: Boolean($("firstFrame")?.files?.[0]),
    hasLastFrame: Boolean($("lastFrame")?.files?.[0]),
    hasReferenceVideo: Boolean($("referenceVideo")?.files?.[0]),
    extraParamsPreview: $("extraParams").value.trim() || "{}",
  };
}

function updateAdvancedPreview() {
  if (requestPreview) {
    requestPreview.textContent = prettyJson(buildRequestPreviewPayload());
  }
  if (endpointPreview) {
    const lines = [
      `Create: ${$("createEndpoint")?.value?.trim() || "-"}`,
      `Query: ${$("queryEndpointTemplate")?.value?.trim() || "-"}`,
      `Poll: ${$("pollIntervalMs")?.value || "-"} ms`,
      `Price: ¥${Number($("tokenPriceCnyPerK")?.value || 0.016).toFixed(3)} / 千 Token`,
    ];
    endpointPreview.textContent = lines.join("\n");
  }
}

async function submitJobPayload(payload) {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || t("createFailed"));
  }
  return data;
}

async function buildSinglePayload() {
  const template = getSelectedTemplate();
  const firstFile = $("firstFrame").files[0];
  const lastFile = $("lastFrame").files[0];
  const referenceVideoFile = $("referenceVideo")?.files?.[0];
  let firstFrameDataUrl = null;
  let lastFrameDataUrl = null;
  let referenceVideoDataUrl = null;

  if (template.requires.firstFrame && !firstFile) {
    throw new Error(template.requires.lastFrame ? t("missingFrames") : t("missingFirstFrame"));
  }
  if (template.requires.lastFrame && !lastFile) {
    throw new Error(t("missingFrames"));
  }
  if (template.requires.video && !referenceVideoFile) {
    throw new Error(t("missingReferenceVideo"));
  }

  if (firstFile) firstFrameDataUrl = await fileToDataUrl(firstFile);
  if (lastFile) lastFrameDataUrl = await fileToDataUrl(lastFile);
  if (referenceVideoFile) referenceVideoDataUrl = await fileToDataUrl(referenceVideoFile);

  const payload = {
    ...buildSharedJobPayload(),
    template: template.id,
    shotNumber: $("shotNumber").value.trim(),
    prompt: $("prompt").value.trim(),
    duration: normalizeDuration($("duration").value),
    firstFrameDataUrl,
    lastFrameDataUrl,
    referenceVideoDataUrl,
  };

  if (!payload.prompt) {
    throw new Error(t("missingPrompt"));
  }

  return payload;
}

async function buildMultiPayloads() {
  const shared = buildSharedJobPayload();
  if (!shared.videoName) {
    throw new Error(t("missingVideoName"));
  }

  const cards = Array.from(multiShotsContainer.querySelectorAll(".multi-shot-card"));
  const shots = [];

  for (const card of cards) {
    const shotNumber = card.querySelector(".multi-shot-number").value.trim();
    const duration = normalizeDuration(card.querySelector(".multi-duration").value);
    const prompt = card.querySelector(".multi-prompt").value.trim();
    const firstFile = card.querySelector(".multi-first-frame").files[0];
    const lastFile = card.querySelector(".multi-last-frame").files[0];

    if (!firstFile || !lastFile || !prompt) {
      throw new Error(t("missingShot", { number: shotNumber }));
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
        duration: MIN_DURATION_SECONDS,
        prompt: t("transitionPrompt"),
        firstFrameDataUrl: current.lastFrameDataUrl,
        lastFrameDataUrl: next.firstFrameDataUrl,
      });
    }
  }

  return payloads;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = t("creating");

  try {
    const mode = getGenerationMode();
    pendingSubmissions += 1;
    updateSubmitButtonState();
    const createdJobs = [];

    if (mode === "multi") {
      const payloads = await buildMultiPayloads();
      formStatus.textContent = t("creatingMultiStart", { total: payloads.length });
      for (let index = 0; index < payloads.length; index += 1) {
        const data = await submitJobPayload(payloads[index]);
        createdJobs.push(data);
        formStatus.textContent = t("creatingMultiProgress", { current: index + 1, total: payloads.length });
      }
    } else {
      const payload = await buildSinglePayload();
      const data = await submitJobPayload(payload);
      createdJobs.push(data);
    }

    await saveSettings();
    if (createdJobs.length > 1) {
      formStatus.textContent = t("multiCreated", { count: createdJobs.length });
    } else {
      const data = createdJobs[0];
      const modelNote = data.config?.modelAdjusted ? t("modelAdjustedNote", { model: data.config.model }) : "";
      formStatus.textContent = t("taskCreated", { id: data.id, note: modelNote });
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
    formStatus.textContent = t("settingsSaved");
  } catch (error) {
    formStatus.textContent = error.message;
  }
});

if (projectFolderBtn) {
  projectFolderBtn.addEventListener("click", async () => {
    await pickProjectDirectory();
  });
}

if (resetProjectFolderBtn) {
  resetProjectFolderBtn.addEventListener("click", async () => {
    projectDirectoryHandle = null;
    $("projectPath").value = "";
    updateDownloadDirectoryUI();
    await saveSettings();
    formStatus.textContent = t("usingDefaultDownloadDir");
  });
}

openDownloadsBtn.addEventListener("click", async () => {
  const response = await fetch("/api/system/open-downloads", { method: "POST" });
  const data = await response.json();
  if (!response.ok) {
    formStatus.textContent = data.error || "打开目录失败";
    return;
  }
  formStatus.textContent = data.path || "";
});

if (openDownloadsPanelBtn) {
  openDownloadsPanelBtn.addEventListener("click", async () => {
    openDownloadsBtn.click();
  });
}

if (projectFolderFallback) {
  projectFolderFallback.addEventListener("change", async () => {
    const firstFile = projectFolderFallback.files?.[0];
    if (!firstFile) return;
    const folderName = firstFile.webkitRelativePath?.split("/")[0] || t("fallbackFolder");
    $("projectPath").value = t("readonlyFolder", { folder: folderName });
    updateDownloadDirectoryUI();
    await saveSettings();
    formStatus.textContent = t("dirReadonly");
    window.alert(t("dirReadonlyAlert"));
  });
}

refreshBtn.addEventListener("click", async () => {
  await loadJobs();
});

themeToggle.addEventListener("click", () => {
  const next = document.body.dataset.theme === "light" ? "dark" : "light";
  setTheme(next);
});

langToggle.addEventListener("click", async () => {
  currentLanguage = currentLanguage === "zh" ? "en" : "zh";
  localStorage.setItem(LANGUAGE_KEY, currentLanguage);
  applyI18n();
  updateGenerationModeUI();
  updateMultiShotLabels();
  updateModelTip();
  await loadJobs();
});

document.body.classList.add("header-compact");

form.addEventListener("click", (event) => {
  const button = event.target.closest("[data-prompt-preset]");
  if (!button) return;

  const promptCard = button.closest(".prompt-card");
  const textarea = promptCard?.querySelector("textarea");
  if (!textarea) return;

  textarea.value = t(button.dataset.promptPreset);
  textarea.focus();
});

form.addEventListener("change", (event) => {
  if (!event.target.matches("#duration, .multi-duration")) return;
  event.target.value = normalizeDuration(event.target.value);
});

modelSelect.addEventListener("change", updateModelTip);
generationTemplateSelect.addEventListener("change", updateTemplateUI);
multiShotCount.addEventListener("change", () => {
  if (multiShotCountMirror) multiShotCountMirror.value = multiShotCount.value;
  renderMultiShots(Number(multiShotCount.value || 2));
});
if (multiShotCountMirror) {
  multiShotCountMirror.addEventListener("change", () => {
    multiShotCount.value = multiShotCountMirror.value;
    renderMultiShots(Number(multiShotCount.value || 2));
    updateAdvancedPreview();
  });
}
if (openMultiShotBtn) {
  openMultiShotBtn.addEventListener("click", () => {
    setGenerationMode("multi");
  });
}
if (closeMultiShotBtn) {
  closeMultiShotBtn.addEventListener("click", () => {
    setGenerationMode("single");
  });
}

document.querySelectorAll(".advanced-tab").forEach((button) => {
  button.addEventListener("click", () => {
    const nextTab = button.dataset.advancedTab;
    document.querySelectorAll(".advanced-tab").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    document.querySelectorAll(".advanced-tab-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.advancedPanel === nextTab);
    });
  });
});

form.addEventListener("input", (event) => {
  if (event.target?.id === "apiKey") {
    updateStatusSurface();
  }
  updateAdvancedPreview();
});

form.addEventListener("change", () => {
  updateStatusSurface();
  updateAdvancedPreview();
});

async function bootstrap() {
  applySavedTheme();
  applyI18n();
  await loadMeta();
  await loadSettings();
  renderMultiShots(Number(multiShotCount.value || 2));
  setGenerationMode(getGenerationMode());
  await loadJobs();
  startJobsPolling();
  updateStatusSurface();
  updateAdvancedPreview();
  updateHeaderCompactState();
}

bootstrap();
