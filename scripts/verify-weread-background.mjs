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
        get: async (key) => ({ [key]: storage[key] }),
        set: async (payload) => {
          Object.assign(storage, payload);
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

const saveResponse = await sendMessage({ type: "weread:saveKeyAndSync", apiKey: "wrk-background-demo" });
assert(saveResponse.ok, "save-and-sync must return ok.");
assert(saveResponse.state.hasKey, "save-and-sync response must report that a key exists.");
assert(saveResponse.state.maskedKey === "wrk-...demo", "save-and-sync response must return a masked key.");
assert(!Object.hasOwn(saveResponse.state, "apiKey"), "public WeRead state must not expose the raw key.");
assert(wrotePayload && wrotePayload.totalItems === 2, "save-and-sync must write the synced payload.");
assert(storage.qiamuTabWereadSync.apiKey === "wrk-background-demo", "raw key must be stored only in chrome.storage.local state.");

const openKeyPageResponse = await sendMessage({ type: "weread:openKeyPage" });
assert(openKeyPageResponse.ok, "open key page must return ok.");
assert(
  createdTabs.some((tab) => tab.url === "https://weread.qq.com/r/weread-skills"),
  "open key page must open the official WeRead Skill page."
);

const capturedResponse = await sendMessage({ type: "weread:capturedApiKey", apiKey: "wrk-captured-demo" });
assert(!capturedResponse.ok, "captured API keys from the WeRead page must not be accepted.");
assert(storage.qiamuTabWereadSync.apiKey === "wrk-background-demo", "unknown captured-key messages must not replace the stored key.");

const clearKeyResponse = await sendMessage({ type: "weread:clearKey" });
assert(clearKeyResponse.ok, "clear-key must return ok.");
assert(!clearKeyResponse.state.hasKey, "clear-key response must remove sync access.");
assert(storage.qiamuTabWereadSync.apiKey === "", "clear-key must remove the raw local key.");

const clearNotesResponse = await sendMessage({ type: "weread:clearNotes" });
assert(clearNotesResponse.ok, "clear-notes must return ok.");
assert(clearedPayload, "clear-notes must clear local IndexedDB payload.");
