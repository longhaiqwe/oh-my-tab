# 微信读书扫码连接 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the default “扫码连接微信读书” flow where OhMyTab opens the official WeRead Skill page, captures the official `wrk-...` API Key shown after scan login, saves it locally, and starts the existing sync path.

**Architecture:** Add a narrowly scoped content script for `https://weread.qq.com/r/weread-skills*` that extracts only `wrk-[A-Za-z0-9_-]+` keys from visible page text and sends them to background. Background validates and deduplicates captured keys, reuses the existing save-and-sync logic, and exposes public status only. The newtab UI defaults to scan connect, with manual API Key input retained as an advanced fallback.

**Tech Stack:** Chrome MV3 extension, vanilla JavaScript, `chrome.storage.local`, IndexedDB, existing Node verification scripts.

---

### Task 1: Add Failing Integration Coverage

**Files:**
- Modify: `scripts/verify-integration.mjs`
- Modify: `scripts/verify-weread-background.mjs`
- Create: `scripts/verify-weread-scan-connect.mjs`
- Modify: `package.json`

- [ ] **Step 1: Assert manifest, UI, docs, and release contracts**

Add integration assertions that require:

```js
assert(manifest.host_permissions.includes("https://weread.qq.com/*"), "manifest.json must allow the official WeRead Skill page.");
assert(
  manifest.content_scripts.some((script) =>
    (script.matches || []).includes("https://weread.qq.com/r/weread-skills*") &&
    (script.js || []).includes("weread-scan-connect.js")
  ),
  "manifest.json must inject the WeRead scan connector only on the official Skill page."
);
assertIncludes(html, "扫码连接微信读书", "newtab.html must expose the default WeRead scan connect action.");
assertIncludes(html, "我已有 API Key", "newtab.html must keep manual API Key fallback.");
assertIncludes(js, "weread:openScanConnect", "newtab.js must open the official WeRead Skill page.");
assertIncludes(background, "weread:capturedApiKey", "background.js must accept captured WeRead API keys from the official page.");
assertIncludes(privacyPolicy, "weread.qq.com/r/weread-skills", "privacy policy must mention the official WeRead Skill page scan flow.");
```

- [ ] **Step 2: Add a dedicated extractor test**

Create `scripts/verify-weread-scan-connect.mjs` that loads `weread-scan-connect.js` in a VM context and verifies:

```js
const key = core.extractWereadApiKey("登录后即可获取 API Key wrk-demo_123");
assert(key === "wrk-demo_123", "extractor must find wrk keys.");
assert(!core.extractWereadApiKey("wr_vid=123; wr_skey=s_abc"), "extractor must ignore cookies.");
```

- [ ] **Step 3: Run expected failing tests**

Run:

```bash
node scripts/verify-integration.mjs
node scripts/verify-weread-scan-connect.mjs
```

Expected: FAIL because manifest/UI/background/content script are not implemented yet.

### Task 2: Implement Content Script Key Capture

**Files:**
- Create: `weread-scan-connect.js`

- [ ] **Step 1: Create a focused content script**

Add an IIFE that exposes `OhMyTabWereadScanConnect` in test contexts and, in Chrome, scans visible text for `wrk-[A-Za-z0-9_-]+`.

Required behavior:

```js
function extractWereadApiKey(text) {
  const match = String(text || "").match(/\bwrk-[A-Za-z0-9_-]+\b/);
  return match ? match[0] : "";
}
```

The content script must:

- Observe page text with `MutationObserver`.
- Deduplicate the last sent key.
- Send `{ type: "weread:capturedApiKey", apiKey }` to background.
- Show a small fixed status pill after a successful background response.
- Never read cookies, localStorage, or QR image content.

- [ ] **Step 2: Verify extractor**

Run:

```bash
node scripts/verify-weread-scan-connect.mjs
```

Expected: PASS.

### Task 3: Wire Manifest And Release Package

**Files:**
- Modify: `manifest.json`
- Modify: `scripts/build-release.mjs`

- [ ] **Step 1: Add official page permission and content script**

Add `https://weread.qq.com/*` to `host_permissions`.

Add content script:

```json
{
  "matches": ["https://weread.qq.com/r/weread-skills*"],
  "js": ["weread-scan-connect.js"],
  "run_at": "document_idle"
}
```

- [ ] **Step 2: Include the content script in release packages**

Add `weread-scan-connect.js` to the release file list in `scripts/build-release.mjs`.

- [ ] **Step 3: Verify integration**

Run:

```bash
node scripts/verify-integration.mjs
```

Expected: still FAIL until background and UI are implemented.

### Task 4: Add Background Message Handling

**Files:**
- Modify: `background.js`
- Modify: `scripts/verify-weread-background.mjs`

- [ ] **Step 1: Add failing background assertions**

Extend the background verifier to send:

```js
const capturedResponse = await sendMessage({ type: "weread:capturedApiKey", apiKey: "wrk-background-demo" });
assert(capturedResponse.ok, "captured API key must be accepted.");
assert(capturedResponse.state.hasKey, "captured API key must be stored.");
assert(storage.qiamuTabWereadSync.apiKey === "wrk-background-demo", "captured API key must be stored locally.");
```

- [ ] **Step 2: Reuse existing save-and-sync path**

In `background.js`, handle `weread:capturedApiKey` by calling `saveKeyAndSync(message.apiKey)`.

If the same key is already stored and a sync is in flight, return public state to avoid repeated sync storms.

- [ ] **Step 3: Verify background**

Run:

```bash
node scripts/verify-weread-background.mjs
```

Expected: PASS.

### Task 5: Update Newtab UI Flow

**Files:**
- Modify: `newtab.html`
- Modify: `newtab.js`
- Modify: `newtab.css`

- [ ] **Step 1: Add scan connect controls**

Add a default button in the WeRead sync drawer:

```html
<button id="wereadScanConnectButton" class="primary" type="button">扫码连接微信读书</button>
<button id="wereadManualKeyToggle" class="ghost" type="button" aria-expanded="false">我已有 API Key</button>
```

Keep the existing API Key input and save button inside a hidden manual section.

- [ ] **Step 2: Open the official page**

Add `handleWereadScanConnect` that sends `{ type: "weread:openScanConnect" }` to background when available, or falls back to `window.open("https://weread.qq.com/r/weread-skills", "_blank", "noopener")`.

Background should handle `weread:openScanConnect` by opening a tab using `chrome.tabs.create`.

- [ ] **Step 3: Poll status while connecting**

After opening the official page, set local UI status to syncing/connecting and poll `weread:getStatus` a few times so the drawer updates when content script capture completes.

- [ ] **Step 4: Keep manual fallback**

Clicking “我已有 API Key” reveals the password input and existing save/sync controls.

### Task 6: Update Documentation And Store Copy

**Files:**
- Modify: `README.md`
- Modify: `docs/privacy-policy.md`
- Modify: `docs/chrome-web-store-submission.md`

- [ ] **Step 1: Replace manual-first wording**

Document scan connect as the default WeRead path.

- [ ] **Step 2: Preserve privacy boundaries**

Document that OhMyTab:

- opens `weread.qq.com/r/weread-skills`;
- reads only the official `wrk-...` key shown on that page;
- does not read WeRead cookies, QR images, passwords, phone numbers, or verification codes.

### Task 7: Final Verification

**Files:**
- All touched files.

- [ ] **Step 1: Run syntax checks**

```bash
node --check newtab.js
node --check background.js
node --check weread-scan-connect.js
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 3: Run release build**

```bash
npm run build:release
```

Expected: PASS and `weread-scan-connect.js` appears in `dist/ohmytab-0.1.0.zip`.

- [ ] **Step 4: Audit forbidden paths**

```bash
rg -n "wr_skey|wr_vid|document.cookie|localStorage|cookie 登录|网页登录协议" weread-scan-connect.js background.js newtab.js README.md docs/privacy-policy.md docs/chrome-web-store-submission.md
```

Expected: only negative/privacy-boundary documentation hits, no code reading cookies.
