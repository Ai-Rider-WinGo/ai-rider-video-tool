const MODEL_DEFINITIONS = [
  {
    id: "doubao-seedance-2-0-260128",
    label: "Seedance 2.0",
    provider: "volcengine",
    family: "seedance",
    supports: ["t2v", "i2v_first_frame", "i2v_first_last_frame_experimental", "video_extension"],
    taskTypes: ["MultimodalToVideo", "VideoExtension", "VideoEditing"],
    inputModalities: ["text", "image", "video", "audio"],
    outputModalities: ["video"],
    status: "active",
  },
  {
    id: "doubao-seedance-2-0-fast-260128",
    label: "Seedance 2.0 Fast",
    provider: "volcengine",
    family: "seedance",
    supports: ["t2v", "i2v_first_frame", "i2v_first_last_frame_experimental", "video_extension"],
    taskTypes: ["MultimodalToVideo", "VideoExtension", "VideoEditing"],
    inputModalities: ["text", "image", "video", "audio"],
    outputModalities: ["video"],
    status: "active",
  },
  {
    id: "doubao-seedance-1-0-pro-250528",
    label: "Seedance 1.0 Pro",
    provider: "volcengine",
    family: "seedance",
    supports: ["t2v", "i2v_first_frame"],
    taskTypes: ["TextToVideo", "ImageToVideo"],
    inputModalities: ["text", "image"],
    outputModalities: ["video"],
    status: "active",
  },
  {
    id: "doubao-seedance-1-0-lite-i2v-250428",
    label: "Seedance 1.0 Lite I2V",
    provider: "volcengine",
    family: "seedance",
    supports: ["i2v_first_frame"],
    taskTypes: ["ImageToVideo"],
    inputModalities: ["image"],
    outputModalities: ["video"],
    status: "active",
  },
  {
    id: "doubao-seedance-1-0-pro-fast-251015",
    label: "Seedance 1.0 Pro Fast",
    provider: "volcengine",
    family: "seedance",
    supports: ["t2v", "i2v_first_frame"],
    taskTypes: ["TextToVideo", "ImageToVideo"],
    inputModalities: ["text", "image"],
    outputModalities: ["video"],
    status: "active",
  },
  {
    id: "doubao-seedance-1-0-lite-t2v-250428",
    label: "Seedance 1.0 Lite T2V",
    provider: "volcengine",
    family: "seedance",
    supports: ["t2v"],
    taskTypes: ["TextToVideo"],
    inputModalities: ["text"],
    outputModalities: ["video"],
    status: "active",
  },
  {
    id: "doubao-seedance-1-5-pro-251215",
    label: "Seedance 1.5 Pro",
    provider: "volcengine",
    family: "seedance",
    supports: ["t2v", "i2v_first_frame", "i2v_first_last_frame_experimental"],
    taskTypes: ["TextToAudioVideo", "ImageToAudioVideo", "ImageToVideo", "TextToVideo"],
    inputModalities: ["text", "image"],
    outputModalities: ["video"],
    status: "active",
  },
  {
    id: "happy-horse-v1-planned",
    label: "Happy Horse",
    provider: "happyhorse",
    family: "happyhorse",
    supports: ["t2v", "i2v_first_frame", "i2v_first_last_frame_experimental", "video_extension"],
    taskTypes: ["MultimodalToVideo", "VideoExtension", "VideoEditing"],
    inputModalities: ["text", "image", "video", "audio"],
    outputModalities: ["video"],
    status: "planned",
  },
];

const PROVIDER_DEFINITIONS = {
  volcengine: {
    id: "volcengine",
    label: "Volcengine Ark",
    type: "user_api",
  },
  airider: {
    id: "airider",
    label: "AI-Rider API",
    type: "managed_api",
    status: "planned",
  },
  happyhorse: {
    id: "happyhorse",
    label: "Happy Horse",
    type: "user_api",
    status: "planned",
  },
};

const FALLBACK_MODELS = {
  i2v_first_last_frame: "doubao-seedance-2-0-260128",
  i2v_first_frame: "doubao-seedance-2-0-260128",
  t2v: "doubao-seedance-2-0-260128",
  video_extension: "doubao-seedance-2-0-260128",
};

const DEFAULT_MODEL_ID = "doubao-seedance-2-0-260128";

function buildRegistry() {
  const models = {};

  for (const definition of MODEL_DEFINITIONS) {
    models[definition.id] = {
      ...definition,
      modeLabels: definition.supports.map(formatModeLabel),
      taskTypeLabels: (definition.taskTypes || []).map(formatTaskTypeLabel),
    };
  }

  return models;
}

const MODEL_REGISTRY = buildRegistry();

function formatModeLabel(mode) {
  switch (mode) {
    case "t2v":
      return "Text to Video";
    case "i2v_first_frame":
      return "Image to Video";
    case "i2v_first_last_frame":
      return "First + Last Frame";
    case "i2v_first_last_frame_experimental":
      return "First + Last Frame (Experimental)";
    case "video_extension":
      return "Video Extension";
    default:
      return mode;
  }
}

function formatTaskTypeLabel(taskType) {
  switch (taskType) {
    case "MultimodalToVideo":
      return "Multimodal to Video";
    case "VideoExtension":
      return "Video Extension";
    case "VideoEditing":
      return "Video Editing";
    case "TextToVideo":
      return "Text to Video";
    case "ImageToVideo":
      return "Image to Video";
    case "TextToAudioVideo":
      return "Text to Audio Video";
    case "ImageToAudioVideo":
      return "Image to Audio Video";
    default:
      return taskType;
  }
}

function supportsMode(model, mode) {
  if (!model) return false;
  if (model.supports.includes(mode)) return true;
  if (mode === "i2v_first_last_frame" && model.supports.includes("i2v_first_last_frame_experimental")) {
    return true;
  }
  return false;
}

function listModels() {
  return MODEL_DEFINITIONS.map((definition) => MODEL_REGISTRY[definition.id]);
}

function listProviders() {
  return Object.values(PROVIDER_DEFINITIONS);
}

function getDefaultModelId() {
  return DEFAULT_MODEL_ID;
}

function getFallbackModelId(mode) {
  return FALLBACK_MODELS[mode] || DEFAULT_MODEL_ID;
}

function getCompatibleModel(mode, preferredModel) {
  const preferred = MODEL_REGISTRY[preferredModel];
  if (supportsMode(preferred, mode)) {
    return {
      requestedModel: preferredModel,
      effectiveModel: preferredModel,
      adjusted: false,
      reason: "",
    };
  }

  const fallbackModel = getFallbackModelId(mode);
  return {
    requestedModel: preferredModel,
    effectiveModel: fallbackModel,
    adjusted: fallbackModel !== preferredModel,
    reason:
      fallbackModel === preferredModel
        ? ""
        : `模型 ${preferredModel} 不支持当前模式 ${mode}，已自动切换为 ${fallbackModel}。`,
  };
}

function getRegistryMeta() {
  return {
    version: 1,
    models: MODEL_REGISTRY,
    modelList: listModels(),
    providers: listProviders(),
    defaults: {
      model: DEFAULT_MODEL_ID,
      fallbackModels: { ...FALLBACK_MODELS },
    },
  };
}

module.exports = {
  getCompatibleModel,
  getDefaultModelId,
  getRegistryMeta,
};
