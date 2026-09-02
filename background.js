importScripts("src/weread-sync-core.js");
importScripts("src/anniversary-utils.js");

const WEREAD_SYNC_STORAGE_KEY = "ohmytabWereadSync";
const LEGACY_WEREAD_SYNC_STORAGE_KEY = "qiamuTabWereadSync";
const WEREAD_DAILY_ALARM = "ohmytab-weread-daily-sync";
const WEREAD_KEY_PAGE_URL = "https://weread.qq.com/r/weread-skills";
const WEREAD_AUTH_ERROR_MESSAGE = "微信读书 API Key 已失效，请重新获取后粘贴同步。";
const ANNIVERSARY_STORAGE_KEY = "ohmytabAnniversaries";
const ANNIVERSARY_DAILY_ALARM = "ohmytab-anniversary-daily-check";
const ANNIVERSARY_NOTIF_LOG_KEY = "ohmytabAnniversaryNotificationLog";
let wereadSyncInFlight = null;

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") });
});

function ensureDailyAlarms() {
  chrome.alarms.create(WEREAD_DAILY_ALARM, {
    periodInMinutes: 24 * 60
  });
  chrome.alarms.create(ANNIVERSARY_DAILY_ALARM, {
    periodInMinutes: 24 * 60
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureDailyAlarms();
  updateAnniversaryBadge();
  checkAndSendAnniversaryNotifications();
});
chrome.runtime.onStartup.addListener(() => {
  ensureDailyAlarms();
  updateAnniversaryBadge();
  checkAndSendAnniversaryNotifications();
});
ensureDailyAlarms();
updateAnniversaryBadge();
checkAndSendAnniversaryNotifications();

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
  const stored = await chrome.storage.local.get([WEREAD_SYNC_STORAGE_KEY, LEGACY_WEREAD_SYNC_STORAGE_KEY]);
  if (stored[WEREAD_SYNC_STORAGE_KEY] === undefined && stored[LEGACY_WEREAD_SYNC_STORAGE_KEY] !== undefined) {
    await chrome.storage.local.set({ [WEREAD_SYNC_STORAGE_KEY]: stored[LEGACY_WEREAD_SYNC_STORAGE_KEY] });
    await chrome.storage.local.remove(LEGACY_WEREAD_SYNC_STORAGE_KEY);
    stored[WEREAD_SYNC_STORAGE_KEY] = stored[LEGACY_WEREAD_SYNC_STORAGE_KEY];
  }
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

function isWereadAuthError(error) {
  const message = String(error && error.message ? error.message : error || "");
  return message.includes("HTTP 401") || (message.includes("API Key") && (message.includes("无效") || message.includes("过期") || message.includes("不完整")));
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

async function getPublicWereadStatus() {
  const state = await getWereadState();
  if (state.apiKey && state.error && isWereadAuthError(state.error)) {
    const next = await setWereadState({
      apiKey: "",
      hasKey: false,
      maskedKey: "",
      status: "error",
      error: WEREAD_AUTH_ERROR_MESSAGE,
      lastReason: state.lastReason || "auth-error"
    });
    return publicWereadState(next);
  }
  return publicWereadState(state);
}

async function runWereadSync(reason = "manual") {
  if (wereadSyncInFlight) {
    if (reason === "daily") {
      return getPublicWereadStatus();
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
      const clearKey = isWereadAuthError(error);
      const next = await setWereadState({
        ...(clearKey ? { apiKey: "", hasKey: false, maskedKey: "" } : {}),
        status: "error",
        error: clearKey ? WEREAD_AUTH_ERROR_MESSAGE : error && error.message ? error.message : "微信读书同步失败。",
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

async function getStoredAnniversaries() {
  try {
    const stored = await chrome.storage.local.get(ANNIVERSARY_STORAGE_KEY);
    const data = stored[ANNIVERSARY_STORAGE_KEY];
    const items = Array.isArray(data?.items) ? data.items : [];
    const builtin = globalThis.OhMyTabAnniversaryUtils?.builtinAnniversaries || [];
    return [...builtin, ...items];
  } catch (_error) {
    return globalThis.OhMyTabAnniversaryUtils?.builtinAnniversaries || [];
  }
}

async function updateAnniversaryBadge() {
  if (!chrome.action || !chrome.action.setBadgeText) {
    return;
  }
  try {
    const events = await getStoredAnniversaries();
    if (!globalThis.OhMyTabAnniversaryUtils?.getActiveReminderOccurrences) {
      return;
    }
    const active = globalThis.OhMyTabAnniversaryUtils.getActiveReminderOccurrences(events, new Date());
    const count = active.length;
    const hasToday = active.some((item) => item.daysUntil === 0);

    if (count > 0) {
      await chrome.action.setBadgeText({ text: String(count) });
      if (chrome.action.setBadgeBackgroundColor) {
        await chrome.action.setBadgeBackgroundColor({
          color: hasToday ? "#e05263" : "#d97706"
        });
      }
      if (chrome.action.setBadgeTextColor) {
        await chrome.action.setBadgeTextColor({ color: "#ffffff" });
      }
    } else {
      await chrome.action.setBadgeText({ text: "" });
    }
  } catch (error) {
    console.warn("[ohmytab] Anniversary badge update failed:", error);
  }
}

function getNotificationDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function checkAndSendAnniversaryNotifications() {
  if (!chrome.notifications || !chrome.notifications.create) {
    return;
  }
  try {
    const events = await getStoredAnniversaries();
    if (!globalThis.OhMyTabAnniversaryUtils?.getActiveReminderOccurrences) {
      return;
    }
    const active = globalThis.OhMyTabAnniversaryUtils.getActiveReminderOccurrences(events, new Date());
    if (!active.length) {
      return;
    }

    const todayStr = getNotificationDateKey(new Date());
    const stored = await chrome.storage.local.get(ANNIVERSARY_NOTIF_LOG_KEY);
    const notifLog = stored[ANNIVERSARY_NOTIF_LOG_KEY] || {};

    const cleanLog = {};
    for (const [key, dateStr] of Object.entries(notifLog)) {
      if (dateStr === todayStr) {
        cleanLog[key] = dateStr;
      }
    }

    for (const item of active) {
      const notifKey = `${item.id || item.title}_${item.dateIso}`;
      if (cleanLog[notifKey] === todayStr) {
        continue;
      }

      let title = "纪念日提醒";
      let message = "";
      if (item.daysUntil === 0) {
        title = `🎉 今天是【${item.title}】`;
        message = item.anniversaryYearLabel
          ? `今天是 ${item.title}（第 ${item.anniversaryYearLabel}），祝度过美好的一天！`
          : `今天是 ${item.title}，别忘了送上祝福或庆祝哦！`;
      } else {
        title = `⏳ 距离【${item.title}】还有 ${item.daysUntil} 天`;
        message = `${item.title} 即将于 ${item.currentDateLabel} 到来（${item.originalDateLabel}）。`;
      }

      const notifId = `anniversary_${item.id || item.title}_${Date.now()}`;
      await chrome.notifications.create(notifId, {
        type: "basic",
        iconUrl: chrome.runtime.getURL("assets/icon128.png"),
        title,
        message,
        priority: 2
      });

      cleanLog[notifKey] = todayStr;
    }

    await chrome.storage.local.set({ [ANNIVERSARY_NOTIF_LOG_KEY]: cleanLog });
  } catch (error) {
    console.warn("[ohmytab] Anniversary notification check failed:", error);
  }
}

if (chrome.notifications?.onClicked?.addListener) {
  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId && notificationId.startsWith("anniversary_")) {
      chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html#anniversary") });
    }
  });
}

if (chrome.storage?.onChanged?.addListener) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[ANNIVERSARY_STORAGE_KEY]) {
      updateAnniversaryBadge();
    }
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === WEREAD_DAILY_ALARM) {
    runWereadSync("daily");
  }
  if (alarm.name === ANNIVERSARY_DAILY_ALARM) {
    updateAnniversaryBadge();
    checkAndSendAnniversaryNotifications();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type.startsWith("anniversary:")) {
    (async () => {
      if (message.type === "anniversary:updateBadge") {
        await updateAnniversaryBadge();
        return { ok: true };
      }
      if (message.type === "anniversary:checkNotifications") {
        await checkAndSendAnniversaryNotifications();
        return { ok: true };
      }
      throw new Error(`Unknown Anniversary message: ${message.type}`);
    })()
      .then((res) => sendResponse(res))
      .catch((error) => sendResponse({ ok: false, error: error?.message || "操作失败" }));
    return true;
  }

  if (!message.type.startsWith("weread:")) {
    return false;
  }

  (async () => {
    if (message.type === "weread:getStatus") {
      return getPublicWereadStatus();
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
