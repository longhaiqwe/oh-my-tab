# 微信读书本地同步 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户在 OhMyTab 扩展设置中保存自己的微信读书 Skill API Key，立即同步一次读书笔记，并由后台每天自动同步一次，所有 key 和笔记都只保存在用户本机。

**Architecture:** 新增一个浏览器可加载、后台可 `importScripts`、Node 校验脚本可执行的 `src/weread-sync-core.js`，集中处理微信读书 API、分页、标准化和 IndexedDB 读写。`background.js` 负责 key 保存、手动同步消息和 `chrome.alarms` 每日同步；`newtab.js` 负责设置 UI、状态展示和从 IndexedDB 读取用户数据，没有同步数据时展示配置同步的空状态。

**Tech Stack:** Chrome MV3 extension, vanilla JavaScript, `chrome.storage.local`, IndexedDB, `chrome.alarms`, Node verification scripts.

---

### Task 1: 写失败校验，锁定功能范围

**Files:**
- Modify: `scripts/verify-integration.mjs`
- Create: `scripts/verify-weread-sync-core.mjs`
- Modify: `package.json`

- [ ] **Step 1: 在集成校验里加入微信读书本地同步断言**

Add checks for:

```js
assertIncludes(html, 'src="src/weread-sync-core.js"', "newtab.html must load the shared WeRead sync core before newtab.js.");
assertIncludes(html, 'id="wereadApiKey"', "newtab.html must expose a WeRead API key input.");
assertIncludes(html, 'id="wereadSaveSyncButton"', "newtab.html must expose a WeRead save-and-sync button.");
assertIncludes(html, 'id="wereadSyncStatus"', "newtab.html must expose WeRead sync status text.");
assertIncludes(html, 'id="wereadLastSync"', "newtab.html must expose WeRead last sync time.");
assertIncludes(html, 'id="wereadClearKeyButton"', "newtab.html must expose a WeRead key clearing button.");
assertIncludes(html, 'id="wereadClearNotesButton"', "newtab.html must expose a local WeRead notes clearing button.");
assertIncludes(html, "key 和笔记只保存在这台设备", "newtab.html must state the local-only WeRead privacy boundary.");

assertIncludes(js, "qiamuTabWereadSync", "newtab.js must use a local WeRead sync settings key.");
assertIncludes(js, "loadSyncedWereadReviewData", "newtab.js must load user-synced WeRead data before packaged JSON fallback.");
assertIncludes(js, "handleWereadSaveAndSync", "newtab.js must save the WeRead key and trigger sync from settings.");
assertIncludes(js, "handleWereadClearKey", "newtab.js must clear the local WeRead key.");
assertIncludes(js, "handleWereadClearNotes", "newtab.js must clear local WeRead notes.");

assertIncludes(background, "importScripts(\"src/weread-sync-core.js\")", "background.js must load the shared WeRead sync core.");
assertIncludes(background, "chrome.alarms.create", "background.js must register daily WeRead sync alarms.");
assertIncludes(background, "weread:saveKeyAndSync", "background.js must handle save-and-sync messages.");
assertIncludes(background, "weread:clearKey", "background.js must handle clear-key messages.");
assertIncludes(background, "weread:clearNotes", "background.js must handle clear-notes messages.");

assert(manifest.permissions.includes("alarms"), "manifest.json must request alarms permission for daily WeRead sync.");
assert(manifest.host_permissions.includes("https://i.weread.qq.com/*"), "manifest.json must allow direct WeRead gateway requests.");

assertIncludes(privacyPolicy, "微信读书 API Key", "privacy policy must mention local-only WeRead key storage.");
assertIncludes(privacyPolicy, "i.weread.qq.com", "privacy policy must mention the WeRead gateway request.");
```

- [ ] **Step 2: 新增核心同步校验脚本**

Create `scripts/verify-weread-sync-core.mjs` that loads `src/weread-sync-core.js` in a VM context and verifies:

```js
assert(core.validateApiKey("wrk-demo_key_123"), "wrk- keys must be accepted.");
assert(!core.validateApiKey("bad-key"), "non-wrk keys must be rejected.");
assert(core.maskApiKey("wrk-abcdef123456") === "wrk-...3456", "keys must be masked.");
```

Then mock `fetch` and verify:

```js
await core.callWereadGateway("wrk-test", "/user/notebooks", { count: 100, lastSort: 42 }, fetchMock);
assert(sentBody.api_name === "/user/notebooks", "api_name must be top-level.");
assert(sentBody.count === 100, "count must be top-level.");
assert(sentBody.lastSort === 42, "lastSort must be top-level.");
assert(!Object.hasOwn(sentBody, "params"), "request body must not wrap params.");
```

Also verify notebook and review pagination:

```js
const notebooks = await core.fetchNotebooks("wrk-test", fetchMock);
assert(notebooks.length === 2, "notebook pagination must collect all pages.");
assert(sentBodies.some((body) => body.lastSort === 900), "notebook pagination must use lastSort from the previous page.");

const reviews = await core.fetchReviews("wrk-test", { bookId: "book-1", book: { title: "Book", author: "Author" } }, fetchMock);
assert(reviews.length === 2, "review pagination must collect all pages.");
assert(sentBodies.some((body) => body.synckey === 123), "review pagination must use synckey from the previous page.");
```

- [ ] **Step 3: 把核心校验加入 `npm test`**

Change `package.json`:

```json
"test": "node scripts/verify-anniversary-utils.mjs && node scripts/verify-weread-sync-core.mjs && node scripts/verify-integration.mjs"
```

- [ ] **Step 4: 运行校验确认失败**

Run:

```bash
npm test
```

Expected: FAIL because `src/weread-sync-core.js`, new UI controls, manifest permission, background alarm, and docs updates do not exist yet.

### Task 2: 实现共享微信读书同步核心

**Files:**
- Create: `src/weread-sync-core.js`

- [ ] **Step 1: 创建核心模块**

Implement an IIFE that attaches `globalThis.OhMyTabWereadSyncCore` with:

```js
const skillVersion = "1.0.3";
const gatewayUrl = "https://i.weread.qq.com/api/agent/gateway";
const databaseName = "ohmytab-weread";
const storeName = "payloads";
const payloadKey = "current";

return {
  skillVersion,
  gatewayUrl,
  validateApiKey,
  maskApiKey,
  callWereadGateway,
  fetchNotebooks,
  fetchReviews,
  fetchBookNotes,
  syncWereadNotes,
  normalizeItems,
  readLocalPayload,
  writeLocalPayload,
  clearLocalPayload
};
```

- [ ] **Step 2: 收敛标准化逻辑**

Use the rules now owned by `src/weread-sync-core.js`:

- Generic WeRead book name filtering.
- MP article title extraction.
- Deep link construction.
- Bookmark normalization.
- Review normalization.
- `noteTime` descending sort.

- [ ] **Step 3: 实现 IndexedDB 读写**

Expose:

```js
async function readLocalPayload() {}
async function writeLocalPayload(payload) {}
async function clearLocalPayload() {}
```

These functions use IndexedDB when available. If IndexedDB is missing, `readLocalPayload` returns `null`, and write/clear throw a short error.

- [ ] **Step 4: 运行核心校验**

Run:

```bash
node scripts/verify-weread-sync-core.mjs
```

Expected: PASS.

### Task 3: 实现后台保存、手动同步和每日同步

**Files:**
- Modify: `manifest.json`
- Modify: `background.js`

- [ ] **Step 1: 更新 manifest 权限**

Add:

```json
"alarms"
```

to `permissions`, and:

```json
"https://i.weread.qq.com/*"
```

to `host_permissions`.

- [ ] **Step 2: 后台加载核心模块**

At the top of `background.js`:

```js
importScripts("src/weread-sync-core.js");
```

- [ ] **Step 3: 增加本地状态 key 和 alarm 名称**

Use:

```js
const WEREAD_SYNC_STORAGE_KEY = "qiamuTabWereadSync";
const WEREAD_DAILY_ALARM = "ohmytab-weread-daily-sync";
let wereadSyncInFlight = null;
```

- [ ] **Step 4: 注册每日 alarm**

Implement:

```js
function ensureWereadDailyAlarm() {
  chrome.alarms.create(WEREAD_DAILY_ALARM, {
    periodInMinutes: 24 * 60
  });
}

chrome.runtime.onInstalled.addListener(ensureWereadDailyAlarm);
chrome.runtime.onStartup.addListener(ensureWereadDailyAlarm);
ensureWereadDailyAlarm();
```

- [ ] **Step 5: 实现同步状态读写和消息处理**

Handle messages:

- `weread:getStatus`
- `weread:saveKeyAndSync`
- `weread:syncNow`
- `weread:clearKey`
- `weread:clearNotes`

All key/status data lives in `chrome.storage.local` under `qiamuTabWereadSync`.

- [ ] **Step 6: 实现后台同步**

`runWereadSync(reason)` validates the local key, calls `OhMyTabWereadSyncCore.syncWereadNotes`, writes the payload to IndexedDB, and stores status:

```js
{
  hasKey: true,
  maskedKey: "wrk-...1234",
  status: "success",
  lastSyncedAt: new Date().toISOString(),
  totalBooks: payload.totalBooks,
  totalItems: payload.totalItems,
  error: ""
}
```

Failed syncs keep existing note data and only update status/error.

- [ ] **Step 7: 运行集成校验**

Run:

```bash
npm test
```

Expected: still FAIL until UI and docs are implemented.

### Task 4: 实现设置 UI 和阅读页本地数据优先读取

**Files:**
- Modify: `newtab.html`
- Modify: `newtab.js`
- Modify: `newtab.css`

- [ ] **Step 1: 加载共享核心模块**

Add before `newtab.js`:

```html
<script src="src/weread-sync-core.js?v=1"></script>
```

- [ ] **Step 2: 在设置区块添加微信读书表单**

Add a settings block with these exact IDs:

- `wereadApiKey`
- `wereadSaveSyncButton`
- `wereadSyncNowButton`
- `wereadClearKeyButton`
- `wereadClearNotesButton`
- `wereadSyncStatus`
- `wereadLastSync`
- `wereadSyncSummary`

- [ ] **Step 3: 在 `newtab.js` 加载同步状态**

Add state:

```js
wereadSync: {
  hasKey: false,
  maskedKey: "",
  status: "idle",
  error: "",
  lastSyncedAt: "",
  totalBooks: 0,
  totalItems: 0
}
```

Call `loadWereadSyncState()` during `init()`.

- [ ] **Step 4: 实现设置按钮行为**

Add:

- `handleWereadSaveAndSync`
- `handleWereadSyncNow`
- `handleWereadClearKey`
- `handleWereadClearNotes`
- `refreshWereadSyncState`
- `renderWereadSettings`
- `sendWereadMessage`

These functions send runtime messages to `background.js`, update status text, and reload reading review data after successful sync or clear.

- [ ] **Step 5: 修改阅读页加载顺序**

Update `loadWereadReviewData(force = false)` to:

1. Try `loadSyncedWereadReviewData()`.
2. If user payload exists, normalize and render it.
3. If not, show the empty state that points users to sync settings.

- [ ] **Step 6: 添加样式**

Add compact settings styles for:

- `.weread-sync-card`
- `.weread-key-field`
- `.weread-sync-actions`
- `.weread-sync-status`
- `.weread-sync-privacy`
- `.weread-danger-row`

Use existing quiet settings visual language.

- [ ] **Step 7: 运行集成校验**

Run:

```bash
npm test
```

Expected: FAIL only if docs are not updated yet.

### Task 5: 更新隐私和发布说明文档

**Files:**
- Modify: `docs/privacy-policy.md`
- Modify: `docs/chrome-web-store-submission.md`
- Modify: `README.md`

- [ ] **Step 1: 更新隐私政策**

Add WeRead data to handled data, local storage, third-party requests, permissions, and deletion sections:

```md
- WeRead API Key and reading notes: used only when the user enables WeRead sync. The key is stored in Chrome local extension storage, and normalized notes are stored locally in IndexedDB. OhMyTab does not upload these values to an OhMyTab server.
```

- [ ] **Step 2: 更新 Chrome Web Store 权限说明**

Mention:

- `alarms`: daily local WeRead sync.
- `https://i.weread.qq.com/*`: direct user-triggered and daily WeRead Skill API sync.

- [ ] **Step 3: 更新 README 权限与隐私说明**

Mention the settings-based WeRead key flow and local-only notes storage.

- [ ] **Step 4: 运行集成校验**

Run:

```bash
npm test
```

Expected: PASS.

### Task 6: 最终验收

**Files:**
- Read: `docs/superpowers/specs/2026-06-04-weread-local-sync-design.md`
- Inspect: all modified implementation files

- [ ] **Step 1: 运行完整测试**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: 构建便签 bundle**

Run:

```bash
npm run build:notes
```

Expected: PASS with `assets/note-editor.bundle.js` rebuilt.

- [ ] **Step 3: 对照设计文档逐条验收**

Verify evidence for:

- Settings UI can save key and trigger immediate sync.
- Daily background sync is registered with `chrome.alarms`.
- Key uses `chrome.storage.local`.
- Notes use IndexedDB.
- Reading page loads user-synced IndexedDB data before packaged JSON.
- Manifest includes `alarms` and `https://i.weread.qq.com/*`.
- Privacy docs state key and notes are local-only.
- Clear key removes future sync access.
- Clear notes removes local synced note payload.
- Sync failures do not erase previous successful notes.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git diff --stat
git diff -- manifest.json background.js src/weread-sync-core.js newtab.html newtab.js newtab.css scripts/verify-integration.mjs scripts/verify-weread-sync-core.mjs package.json README.md docs/privacy-policy.md docs/chrome-web-store-submission.md
```

Expected: diff contains only planned feature changes and no accidental unrelated edits.
