importScripts("src/weread-sync-core.js");

const WEREAD_SYNC_STORAGE_KEY = "qiamuTabWereadSync";
const WEREAD_DAILY_ALARM = "ohmytab-weread-daily-sync";
const WEREAD_KEY_PAGE_URL = "https://weread.qq.com/r/weread-skills";
let wereadSyncInFlight = null;

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") });
});

function ensureWereadDailyAlarm() {
  chrome.alarms.create(WEREAD_DAILY_ALARM, {
    periodInMinutes: 24 * 60
  });
}

chrome.runtime.onInstalled.addListener(ensureWereadDailyAlarm);
chrome.runtime.onStartup.addListener(ensureWereadDailyAlarm);
ensureWereadDailyAlarm();

function createDefaultWereadState() {
  return {
    apiKey: "",
    hasKey: false,
    maskedKey: "",
    status: "idle",
    error: "",
    lastSyncedAt: "",
    totalBooks: 0,
    totalItems: 0,
    lastReason: ""
  };
}

async function getWereadState() {
  const stored = await chrome.storage.local.get(WEREAD_SYNC_STORAGE_KEY);
  const state = {
    ...createDefaultWereadState(),
    ...(stored[WEREAD_SYNC_STORAGE_KEY] || {})
  };
  state.hasKey = Boolean(state.apiKey);
  state.maskedKey = state.apiKey ? OhMyTabWereadSyncCore.maskApiKey(state.apiKey) : "";
  return state;
}

function publicWereadState(state) {
  return {
    hasKey: Boolean(state.apiKey || state.hasKey),
    maskedKey: state.maskedKey || (state.apiKey ? OhMyTabWereadSyncCore.maskApiKey(state.apiKey) : ""),
    status: state.status || "idle",
    error: state.error || "",
    lastSyncedAt: state.lastSyncedAt || "",
    totalBooks: Number(state.totalBooks || 0),
    totalItems: Number(state.totalItems || 0),
    lastReason: state.lastReason || ""
  };
}

async function setWereadState(patch) {
  const current = await getWereadState();
  const next = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  next.hasKey = Boolean(next.apiKey);
  next.maskedKey = next.apiKey ? OhMyTabWereadSyncCore.maskApiKey(next.apiKey) : "";
  await chrome.storage.local.set({ [WEREAD_SYNC_STORAGE_KEY]: next });
  return next;
}

async function runWereadSync(reason = "manual") {
  if (wereadSyncInFlight) {
    if (reason === "daily") {
      return publicWereadState(await getWereadState());
    }
    return wereadSyncInFlight;
  }

  wereadSyncInFlight = (async () => {
    const state = await getWereadState();
    if (!state.apiKey) {
      const next = await setWereadState({
        status: "idle",
        error: "微信读书同步尚未配置。",
        lastReason: reason
      });
      return publicWereadState(next);
    }

    await setWereadState({
      status: "syncing",
      error: "",
      lastReason: reason
    });

    try {
      const payload = await OhMyTabWereadSyncCore.syncWereadNotes(state.apiKey);
      await OhMyTabWereadSyncCore.writeLocalPayload(payload);
      const next = await setWereadState({
        status: payload.lastSyncStatus || "success",
        error: payload.skippedBooks && payload.skippedBooks.length ? `部分书籍同步失败：${payload.skippedBooks.length} 本` : "",
        lastSyncedAt: payload.generatedAt,
        totalBooks: payload.totalBooks,
        totalItems: payload.totalItems,
        lastReason: reason
      });
      return publicWereadState(next);
    } catch (error) {
      const next = await setWereadState({
        status: "error",
        error: error && error.message ? error.message : "微信读书同步失败。",
        lastReason: reason
      });
      return publicWereadState(next);
    }
  })();

  try {
    return await wereadSyncInFlight;
  } finally {
    wereadSyncInFlight = null;
  }
}

async function saveKeyAndSync(apiKey) {
  const trimmed = String(apiKey || "").trim();
  if (!OhMyTabWereadSyncCore.validateApiKey(trimmed)) {
    const next = await setWereadState({
      status: "error",
      error: "微信读书 API Key 格式无效，应以 wrk- 开头并包含完整 key。",
      lastReason: "manual"
    });
    return publicWereadState(next);
  }

  await setWereadState({
    apiKey: trimmed,
    status: "syncing",
    error: "",
    lastReason: "manual"
  });
  return runWereadSync("manual");
}

async function openWereadKeyPage() {
  await chrome.tabs.create({ url: WEREAD_KEY_PAGE_URL });
  return publicWereadState(await getWereadState());
}

async function clearWereadKey() {
  const next = await setWereadState({
    apiKey: "",
    hasKey: false,
    maskedKey: "",
    status: "idle",
    error: "",
    lastReason: "clear-key"
  });
  return publicWereadState(next);
}

async function clearWereadNotes() {
  await OhMyTabWereadSyncCore.clearLocalPayload();
  const next = await setWereadState({
    status: "idle",
    error: "",
    totalBooks: 0,
    totalItems: 0,
    lastSyncedAt: "",
    lastReason: "clear-notes"
  });
  return publicWereadState(next);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === WEREAD_DAILY_ALARM) {
    runWereadSync("daily");
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string" || !message.type.startsWith("weread:")) {
    return false;
  }

  (async () => {
    if (message.type === "weread:getStatus") {
      return publicWereadState(await getWereadState());
    }
    if (message.type === "weread:saveKeyAndSync") {
      return saveKeyAndSync(message.apiKey);
    }
    if (message.type === "weread:openKeyPage") {
      return openWereadKeyPage();
    }
    if (message.type === "weread:syncNow") {
      return runWereadSync("manual");
    }
    if (message.type === "weread:clearKey") {
      return clearWereadKey();
    }
    if (message.type === "weread:clearNotes") {
      return clearWereadNotes();
    }
    throw new Error(`Unknown WeRead message: ${message.type}`);
  })()
    .then((state) => sendResponse({ ok: true, state }))
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error && error.message ? error.message : "微信读书操作失败。"
      });
    });

  return true;
});
