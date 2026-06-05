import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const backgroundSource = readFileSync(new URL("background.js", root), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const storage = {};
const alarmCreates = [];
const createdTabs = [];
let messageListener = null;
let alarmListener = null;

const context = {
  console,
  fetch: async () => {
    throw new Error("network should be mocked in this test");
  },
  chrome: {
    action: {
      onClicked: { addListener: () => {} }
    },
    tabs: {
      create: (options) => {
        createdTabs.push(options);
      }
    },
    runtime: {
      getURL: (path) => path,
      onInstalled: { addListener: (listener) => listener() },
      onStartup: { addListener: () => {} },
      onMessage: {
        addListener: (listener) => {
          messageListener = listener;
        }
      }
    },
    alarms: {
      create: (name, options) => {
        alarmCreates.push({ name, options });
      },
      onAlarm: {
        addListener: (listener) => {
          alarmListener = listener;
        }
      }
    },
    storage: {
      local: {
        get: async (key) => {
          const keys = Array.isArray(key) ? key : [key];
          return Object.fromEntries(keys.map((item) => [item, storage[item]]));
        },
        set: async (payload) => {
          Object.assign(storage, payload);
        },
        remove: async (key) => {
          const keys = Array.isArray(key) ? key : [key];
          keys.forEach((item) => {
            delete storage[item];
          });
        }
      }
    }
  }
};

context.globalThis = context;
context.importScripts = (...paths) => {
  for (const path of paths) {
    vm.runInContext(readFileSync(new URL(path, root), "utf8"), context, { filename: path });
  }
};

vm.createContext(context);
vm.runInContext(backgroundSource, context, { filename: "background.js" });

assert(alarmCreates.some((alarm) => alarm.name === "ohmytab-weread-daily-sync"), "background must create the daily WeRead alarm.");
assert(alarmCreates.some((alarm) => alarm.options.periodInMinutes === 24 * 60), "daily WeRead alarm must run once per day.");
assert(typeof messageListener === "function", "background must register a runtime message listener.");
assert(typeof alarmListener === "function", "background must register an alarm listener.");

let wrotePayload = null;
let clearedPayload = false;
context.OhMyTabWereadSyncCore.syncWereadNotes = async () => ({
  schemaVersion: 1,
  generatedAt: "2026-06-04T00:00:00.000Z",
  source: "test",
  totalBooks: 1,
  totalItems: 2,
  lastSyncStatus: "success",
  skippedBooks: [],
  items: [
    {
      id: "1",
      bookId: "book",
      bookName: "Book",
      markText: "Quote",
      noteTime: 1
    }
  ]
});
context.OhMyTabWereadSyncCore.writeLocalPayload = async (payload) => {
  wrotePayload = payload;
};
context.OhMyTabWereadSyncCore.clearLocalPayload = async () => {
  clearedPayload = true;
};

function sendMessage(message) {
  return new Promise((resolve) => {
    const keepAlive = messageListener(message, {}, resolve);
    assert(keepAlive === true, `${message.type} must keep the message channel alive for async work.`);
  });
}

storage.qiamuTabWereadSync = { apiKey: "wrk-legacy-demo", status: "success" };
const migratedStatusResponse = await sendMessage({ type: "weread:getStatus" });
assert(migratedStatusResponse.ok, "get-status must return ok for legacy WeRead state.");
assert(migratedStatusResponse.state.maskedKey === "wrk-...demo", "legacy WeRead state must remain readable during migration.");
assert(storage.ohmytabWereadSync?.apiKey === "wrk-legacy-demo", "legacy WeRead state must migrate to the OhMyTab storage key.");
assert(!Object.hasOwn(storage, "qiamuTabWereadSync"), "legacy qiamu WeRead state must be removed after migration.");

const saveResponse = await sendMessage({ type: "weread:saveKeyAndSync", apiKey: "wrk-background-demo" });
assert(saveResponse.ok, "save-and-sync must return ok.");
assert(saveResponse.state.hasKey, "save-and-sync response must report that a key exists.");
assert(saveResponse.state.maskedKey === "wrk-...demo", "save-and-sync response must return a masked key.");
assert(!Object.hasOwn(saveResponse.state, "apiKey"), "public WeRead state must not expose the raw key.");
assert(wrotePayload && wrotePayload.totalItems === 2, "save-and-sync must write the synced payload.");
assert(storage.ohmytabWereadSync.apiKey === "wrk-background-demo", "raw key must be stored only in chrome.storage.local state.");

const openKeyPageResponse = await sendMessage({ type: "weread:openKeyPage" });
assert(openKeyPageResponse.ok, "open key page must return ok.");
assert(
  createdTabs.some((tab) => tab.url === "https://weread.qq.com/r/weread-skills"),
  "open key page must open the official WeRead Skill page."
);

const capturedResponse = await sendMessage({ type: "weread:capturedApiKey", apiKey: "wrk-captured-demo" });
assert(!capturedResponse.ok, "captured API keys from the WeRead page must not be accepted.");
assert(storage.ohmytabWereadSync.apiKey === "wrk-background-demo", "unknown captured-key messages must not replace the stored key.");

storage.ohmytabWereadSync.error = "/user/notebooks 请求失败：HTTP 401";
const repairedStatusResponse = await sendMessage({ type: "weread:getStatus" });
assert(repairedStatusResponse.ok, "get-status must return ok.");
assert(!repairedStatusResponse.state.hasKey, "get-status must clear a saved key after a persisted auth error.");
assert(storage.ohmytabWereadSync.apiKey === "", "get-status must remove the raw key after a persisted auth error.");
assert(!repairedStatusResponse.state.error.includes("HTTP 401"), "get-status must hide raw HTTP 401 errors from users.");
assert(repairedStatusResponse.state.error.includes("重新获取"), "get-status must tell users to get a fresh key after a persisted auth error.");

await sendMessage({ type: "weread:saveKeyAndSync", apiKey: "wrk-background-demo" });
context.OhMyTabWereadSyncCore.syncWereadNotes = async () => {
  throw new Error("/user/notebooks 请求失败：微信读书 API Key 无效、已过期或不完整，请重新获取或粘贴完整 key。");
};
const authErrorResponse = await sendMessage({ type: "weread:syncNow" });
assert(authErrorResponse.ok, "auth failures must still return public WeRead state.");
assert(!authErrorResponse.state.hasKey, "auth failures must clear the saved key from public state.");
assert(storage.ohmytabWereadSync.apiKey === "", "auth failures must clear the raw local key.");
assert(!authErrorResponse.state.error.includes("/user/notebooks"), "auth failures must hide raw endpoint details from users.");
assert(authErrorResponse.state.error.includes("重新获取"), "auth failures must tell users to get a fresh key.");

context.OhMyTabWereadSyncCore.syncWereadNotes = async () => ({
  schemaVersion: 1,
  generatedAt: "2026-06-04T00:00:00.000Z",
  source: "test",
  totalBooks: 1,
  totalItems: 2,
  lastSyncStatus: "success",
  skippedBooks: [],
  items: []
});

const clearKeyResponse = await sendMessage({ type: "weread:clearKey" });
assert(clearKeyResponse.ok, "clear-key must return ok.");
assert(!clearKeyResponse.state.hasKey, "clear-key response must remove sync access.");
assert(storage.ohmytabWereadSync.apiKey === "", "clear-key must remove the raw local key.");

const clearNotesResponse = await sendMessage({ type: "weread:clearNotes" });
assert(clearNotesResponse.ok, "clear-notes must return ok.");
assert(clearedPayload, "clear-notes must clear local IndexedDB payload.");
