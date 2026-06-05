import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const source = readFileSync(new URL("weread-scan-connect.js", root), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const sentMessages = [];
const inputWithKey = {
  tagName: "INPUT",
  type: "text",
  value: "wrk-input_123456",
  textContent: "",
  getAttribute: () => ""
};
const context = {
  console,
  location: {
    href: "https://weread.qq.com/r/weread-skills"
  },
  document: {
    body: {
      append: () => {},
      innerText: ""
    },
    documentElement: {
      innerText: ""
    },
    createElement: () => ({
      style: {},
      setAttribute: () => {},
      set textContent(value) {
        this._textContent = value;
      },
      get textContent() {
        return this._textContent || "";
      }
    }),
    querySelectorAll: () => [inputWithKey]
  },
  MutationObserver: class {
    observe() {}
  },
  setTimeout: () => {},
  clearTimeout: () => {},
  chrome: {
    runtime: {
      sendMessage: (message, callback) => {
        sentMessages.push(message);
        callback?.({ ok: true });
      }
    }
  }
};
context.window = context;
context.globalThis = context;

vm.createContext(context);
vm.runInContext(source, context, { filename: "weread-scan-connect.js" });

const connector = context.OhMyTabWereadScanConnect;
assert(connector, "weread-scan-connect.js must expose OhMyTabWereadScanConnect.");
assert(
  connector.extractWereadApiKey("登录后即可获取 API Key wrk-demo_123"),
  "extractor must find wrk keys."
);
assert(
  connector.extractWereadApiKey("登录后即可获取 API Key wrk-demo_123") === "wrk-demo_123",
  "extractor must return the exact wrk key."
);
assert(!connector.extractWereadApiKey("登录后显示了不完整的 key wrk-maWh"), "extractor must ignore incomplete short wrk keys.");
assert(!connector.extractWereadApiKey("wr_vid=123; wr_skey=s_abc"), "extractor must ignore cookies.");
assert(!connector.extractWereadApiKey("Authorization: Bearer abc"), "extractor must ignore non-wrk tokens.");
assert(
  sentMessages.some((message) => message.type === "weread:capturedApiKey" && message.apiKey === "wrk-input_123456"),
  "content script must capture complete wrk keys from input values and copy attributes."
);
