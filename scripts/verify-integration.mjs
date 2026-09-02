import { existsSync, readFileSync } from "node:fs";

const root = new URL("..", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const html = read("newtab.html");
const js = read("newtab.js");
const css = read("newtab.css");
const background = read("background.js");
const providerAutosubmit = read("provider-autosubmit.js");
const noteEditorSource = read("src/note-editor.js");
const privacyPolicy = read("docs/privacy-policy.md");
const manifest = JSON.parse(read("manifest.json"));
const packageJson = JSON.parse(read("package.json"));

const readingViewHtml = html.match(/<section id="readingReviewView"[\s\S]*?<section id="anniversaryReminderView"/)?.[0] || "";
const settingsPanelHtml = html.match(/<form id="settingsPanel"[\s\S]*?<\/form>/)?.[0] || "";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertIncludes(source, needle, message) {
  assert(source.includes(needle), message);
}

assertIncludes(html, 'data-main-tab="overview"', "newtab.html must expose the overview tab.");
assertIncludes(html, 'data-main-tab="work"', "newtab.html must expose the OhMyTab daily-work tab.");
assertIncludes(html, 'data-main-tab="tabs"', "newtab.html must expose the tabout tab-management tab.");
assertIncludes(html, 'data-main-tab="reading"', "newtab.html must expose the WeRead review tab.");
assertIncludes(html, 'data-main-tab="anniversary"', "newtab.html must expose the anniversary reminder tab.");
assertIncludes(html, 'id="tabManagerView"', "newtab.html must include the tab manager view container.");
assertIncludes(html, 'id="readingReviewView"', "newtab.html must include the reading review view container.");
assertIncludes(html, 'id="anniversaryReminderView"', "newtab.html must include the anniversary reminder view container.");
assertIncludes(html, 'id="overviewView"', "newtab.html must include the overview view container.");
assertIncludes(html, 'id="overviewTodoCard"', "the overview page must show a todo area.");
assertIncludes(html, 'id="overviewTodoForm"', "the overview page must expose a quick-add todo form.");
assertIncludes(html, 'id="overviewTodoInput"', "the overview page must expose a quick-add todo input.");
assertIncludes(html, 'id="overviewTodoSubmit"', "the overview page must expose a quick-add todo submit button.");
assertIncludes(css, ".overview-todo-form", "newtab.css must style the overview quick-add todo form.");
assertIncludes(js, "overviewTodoForm", "newtab.js must wire up the overview quick-add todo form submit listener.");
assertIncludes(js, "function updateTodo", "newtab.js must provide updateTodo function to modify todo items.");
assertIncludes(js, "todo-edit-input", "newtab.js must support inline editing for work view todos.");
assertIncludes(js, "overview-todo-edit-input", "newtab.js must support inline editing for overview todos.");
assertIncludes(css, ".todo-edit-input", "newtab.css must style the work view inline edit input.");
assertIncludes(css, ".overview-todo-edit-input", "newtab.css must style the overview inline edit input.");
assertIncludes(html, 'id="overviewAnniversaryCard"', "the overview page must show an upcoming-dates area.");
assertIncludes(html, 'id="overviewTabsCard"', "the overview page must show a duplicate-tab area.");
assertIncludes(html, 'id="overviewNoteCard"', "the overview page must show a note highlight area.");
assertIncludes(html, 'id="overviewTabsCleanButton"', "the overview page must offer one-click duplicate tab cleanup.");
assertIncludes(html, 'id="overviewNoteShuffleButton"', "the overview page must offer another note highlight on demand.");
assertIncludes(html, 'data-overview-goto="work"', "overview cards must link through to their full feature view.");
assertIncludes(html, 'id="anniversaryAllButton"', "newtab.html must expose the all-anniversaries drawer button.");
assertIncludes(html, 'id="anniversaryAddButton"', "newtab.html must expose the add-anniversary dialog button.");
assertIncludes(html, 'id="anniversaryDrawer"', "newtab.html must include the all-anniversaries drawer.");
assertIncludes(html, 'id="anniversaryDialog"', "newtab.html must include the add/edit anniversary dialog.");
assertIncludes(html, 'class="anniversary-date-row"', "anniversary year, month, and day inputs must share one row.");
assertIncludes(html, 'id="anniversaryStartYear"', "newtab.html must let users enter the anniversary start year.");
assertIncludes(html, 'placeholder="例如：1998"', "anniversary year input must show an example year.");
assertIncludes(html, 'id="anniversaryAdvanceDays" required type="number" min="0" max="365" inputmode="numeric" value="7"', "new anniversary reminders must default to 7 days.");
assertIncludes(html, 'id="anniversaryReminderBanner"', "newtab.html must include the anniversary reminder banner.");
assertIncludes(css, ".anniversary-reminder-banner", "newtab.css must style the anniversary reminder banner.");
assertIncludes(background, "updateAnniversaryBadge", "background.js must update the anniversary badge.");
assertIncludes(background, "checkAndSendAnniversaryNotifications", "background.js must check and send anniversary notifications.");
assertIncludes(js, "renderAnniversaryReminderBanner", "newtab.js must render the anniversary reminder banner.");
assertIncludes(html, "src/anniversary-utils.js", "newtab.html must load the anniversary date utility before newtab.js.");
assertIncludes(html, "newtab.js?v=2", "newtab.html must cache-bust the main new tab script.");
assert(!html.includes("Quick add"), "The anniversary homepage must not expose a persistent quick-add form.");
assert(!html.includes("All events"), "The anniversary homepage must not expose a persistent all-events list.");
assertIncludes(html, 'id="readingExportButton"', "newtab.html must expose the WeRead share image export button.");
assertIncludes(html, 'id="readingShareDialog"', "newtab.html must include the WeRead share image preview dialog.");
assertIncludes(html, 'id="readingSharePreview"', "newtab.html must include the WeRead share image preview element.");
assertIncludes(html, 'id="readingShareDownloadButton"', "newtab.html must include a confirmation download button for share images.");
assertIncludes(html, 'id="readingWereadSettingsButton"', "newtab.html must expose a WeRead sync settings button on the reading review page.");
assertIncludes(html, 'id="readingWereadSyncDrawerBackdrop"', "newtab.html must render WeRead sync settings in a reading-page drawer backdrop.");
assertIncludes(html, 'class="reading-weread-sync-backdrop" hidden', "newtab.html must keep the WeRead sync settings drawer hidden by default.");
assertIncludes(readingViewHtml, 'id="wereadApiKey"', "newtab.html must keep the WeRead API key input on the reading review page.");
assertIncludes(readingViewHtml, "<h2>正在载入本地笔记</h2>", "newtab.html must use a loading placeholder before WeRead data hydration.");
assert(!readingViewHtml.includes("<h2>暂无本地笔记</h2>"), "newtab.html must not flash the empty WeRead state before local data hydration.");
assert(!settingsPanelHtml.includes('id="wereadApiKey"'), "newtab.html must not put WeRead API key settings in the general settings panel.");
assertIncludes(html, 'src="src/weread-sync-core.js', "newtab.html must load the shared WeRead sync core before newtab.js.");
assertIncludes(html, 'id="wereadApiKey"', "newtab.html must expose a WeRead API key input.");
assertIncludes(html, 'id="wereadSaveSyncButton"', "newtab.html must expose a WeRead save-and-sync button.");
assertIncludes(html, 'id="wereadSyncStatus"', "newtab.html must expose WeRead sync status text.");
assertIncludes(html, 'id="wereadLastSync"', "newtab.html must expose WeRead last sync time.");
assertIncludes(html, 'id="wereadClearKeyButton"', "newtab.html must expose a WeRead key clearing button.");
assertIncludes(html, 'id="wereadClearNotesButton"', "newtab.html must expose a local WeRead notes clearing button.");
assertIncludes(html, "key 和笔记只保存在这台设备", "newtab.html must state the local-only WeRead privacy boundary.");
assertIncludes(html, "https://github.com/joeseesun/qiaomu-tab", "newtab.html must link to the Qiaomu Tab project on the daily-work page.");
assertIncludes(html, "https://github.com/longhaiqwe/tab-out#", "newtab.html must link to the tabout project on the tab-management page.");
assertIncludes(html, "https://readecho.cn/", "newtab.html must link to the Readecho product on the reading-review page.");
assertIncludes(html, "https://x.com/vista8", "newtab.html must link to Qiaomu's X profile in the daily-work credit.");
assertIncludes(html, "https://x.com/zarazhangrui", "newtab.html must link to Zara Zhang's X profile in the tab-management credit.");
assertIncludes(html, "Zara Zhang", "newtab.html must credit Zara Zhang by name.");
assert(!html.includes("https://github.com/zarazhangrui/tab-out"), "newtab.html must not keep the old Tab Out credit URL.");
assert(!html.includes("https://github.com/joeseesun/ohmytab"), "newtab.html must not keep the old OhMyTab credit URL.");
assertIncludes(html, "基于", "newtab.html must explicitly state the product foundations for the credited features.");
assertIncludes(html, "感谢", "newtab.html must thank the referenced project authors.");

assert(manifest.permissions.includes("tabs"), "manifest.json must request tabs permission for tabout features.");
assert(manifest.permissions.includes("storage"), "manifest.json must keep storage permission for local data.");
assert(manifest.permissions.includes("alarms"), "manifest.json must request alarms permission for daily WeRead sync.");
assert(manifest.permissions.includes("notifications"), "manifest.json must request notifications permission for anniversary reminders.");
assert(manifest.host_permissions.includes("https://i.weread.qq.com/*"), "manifest.json must allow direct WeRead gateway requests.");
assert(
  !manifest.host_permissions.includes("https://weread.qq.com/*"),
  "manifest.json must not request WeRead page host permission when users manually copy API keys."
);
assert(
  !manifest.content_scripts.some((script) => (script.js || []).includes("weread-scan-connect.js")),
  "manifest.json must not inject a WeRead page key-capture content script."
);

assertIncludes(js, "fetchOpenTabs", "newtab.js must include tabout open-tab querying.");
assertIncludes(js, "renderTabManager", "newtab.js must render the tabout tab-management view.");
assertIncludes(js, "loadWereadReviewData", "newtab.js must load local WeRead review data.");
assertIncludes(js, "renderReadingReview", "newtab.js must render the WeRead review tab.");
assertIncludes(js, "ohmytabWereadSync", "newtab.js must use an OhMyTab local WeRead sync settings key.");
assertIncludes(js, "OhMyTabNoteEditor", "newtab.js must use the OhMyTab note editor global.");
assert(!js.includes("QiamuNoteEditor"), "newtab.js must not use the old Qiamu note editor global.");
assertIncludes(js, "loadSyncedWereadReviewData", "newtab.js must load user-synced WeRead data before packaged JSON fallback.");
assertIncludes(js, "prepareReadingReviewLoadingState", "newtab.js must prepare the WeRead loading state before showing the reading review page.");
assertIncludes(js, "if (state.mainView === \"reading\") {\n      prepareReadingReviewLoadingState();\n    }\n    renderMainTabs();", "newtab.js must render the restored reading view only after setting the loading placeholder.");
assert(!js.includes('console.warn("[ohmytab] WeRead review data unavailable:"'), "newtab.js must not report missing optional WeRead fallback JSON as an extension warning.");
assert(!js.includes('console.warn("[ohmytab] Synced WeRead data unavailable:"'), "newtab.js must not report transient local WeRead payload reads as extension warnings.");
assertIncludes(js, "handleWereadSaveAndSync", "newtab.js must save the WeRead key and trigger sync from settings.");
assertIncludes(html, 'id="wereadOpenKeyPageButton"', "newtab.html must expose a compact WeRead key help button.");
assertIncludes(html, "打开微信读书官方页面获取 API Key", "newtab.html must label the compact WeRead key help button.");
assertIncludes(html, "在微信读书官方 Skill 页面复制 API Key 后", "newtab.html must guide users to copy keys from the official WeRead page.");
assertIncludes(html, "复制 Key 后粘贴到这里", "newtab.html must tell users to paste the copied WeRead API Key.");
assert(!html.includes("打开微信读书获取 Key</button>"), "newtab.html must not use a large primary WeRead key page button.");
assert(!html.includes("扫码连接微信读书"), "newtab.html must not expose the old automatic scan-connect action.");
assert(!html.includes("我已有 API Key"), "newtab.html must not hide the manual API key path behind a fallback toggle.");
assertIncludes(js, "weread:openKeyPage", "newtab.js must open the official WeRead Skill page for manual key copy.");
assert(!js.includes("weread:capturedApiKey"), "newtab.js must not accept captured API keys from the WeRead page.");
assertIncludes(js, "openWereadSyncSettings", "newtab.js must open WeRead sync settings from the reading review page.");
assert(!js.includes("function openWereadSyncSettings() {\n    openDrawerTab"), "newtab.js must not open the general settings panel for WeRead sync settings.");
assertIncludes(js, "handleWereadMessageLocally", "newtab.js must fall back to page-local WeRead sync if the background receiver is unavailable.");
assertIncludes(js, "isMissingWereadReceiver", "newtab.js must detect Chrome missing-receiver errors for WeRead sync messages.");
assertIncludes(js, "Could not establish connection", "newtab.js must recognize Chrome runtime missing-receiver errors.");
assertIncludes(js, "handleWereadClearKey", "newtab.js must clear the local WeRead key.");
assertIncludes(js, "handleWereadClearNotes", "newtab.js must clear local WeRead notes.");
assertIncludes(js, "ohmytabAnniversaries", "newtab.js must persist anniversary reminders under an OhMyTab local key.");
assertIncludes(js, "defaultAnniversaryAdvanceDays = 7", "newtab.js must define 7 days as the default anniversary reminder window.");
assertIncludes(js, "memoryStorage", "newtab.js must fall back to in-memory storage when browser storage is unavailable.");
assertIncludes(js, "getLocalStorage", "newtab.js must safely detect localStorage availability.");
assertIncludes(js, "builtinAnniversaries", "newtab.js must include built-in public anniversaries.");
assertIncludes(js, "builtin-qixi", "newtab.js must include Qixi as a built-in lunar anniversary.");
assertIncludes(js, "builtin-mothers-day", "newtab.js must include Mother's Day as a built-in anniversary.");
assertIncludes(js, "builtin-valentines-day", "newtab.js must include Valentine's Day as a built-in anniversary.");
assertIncludes(js, "getAnniversaryItems", "newtab.js must merge built-in public anniversaries with custom anniversaries.");
assertIncludes(js, "item.builtin", "newtab.js must render built-in anniversaries as read-only items.");
assertIncludes(js, "loadAnniversaries", "newtab.js must load anniversary reminders.");
assertIncludes(js, "anniversaryStartYear", "newtab.js must read and write the anniversary start year field.");
assertIncludes(js, "startYear", "newtab.js must persist each anniversary start year.");
assertIncludes(js, "getAnniversaryYearText", "newtab.js must render anniversary year counts when a start year is present.");
assertIncludes(js, "anniversaryYearLabel", "newtab.js must use the shared anniversary year label.");
assertIncludes(js, "anniversaryDialogPointerStartedOnBackdrop", "newtab.js must only close the anniversary dialog when a backdrop press starts on the backdrop.");
assertIncludes(js, "renderAnniversaryReminderView", "newtab.js must render the anniversary reminder tab.");
assertIncludes(js, "getUpcomingAnniversaryOccurrences", "newtab.js must use the shared anniversary date utility.");
assertIncludes(js, "openAnniversaryDrawer", "newtab.js must open the all-anniversaries drawer on demand.");
assertIncludes(js, "openAnniversaryDialog", "newtab.js must open add/edit anniversary forms on demand.");
assertIncludes(js, "findDuplicateAnniversary", "newtab.js must check for duplicate anniversaries before saving.");
assertIncludes(js, "validateAnniversaryInput", "newtab.js must validate anniversary inputs before saving.");
assertIncludes(js, "已存在相同的纪念日", "newtab.js must toast a warning when a duplicate anniversary is submitted.");
assertIncludes(js, "handleAnniversaryYearInput", "newtab.js must advance focus when anniversary year input completes.");
assertIncludes(js, "handleAnniversaryMonthInput", "newtab.js must advance focus when anniversary month input completes.");
assertIncludes(js, "anniversary-feature-edit", "The nearest anniversary card must expose an edit affordance.");
assertIncludes(js, '["overview", "work", "tabs", "reading", "anniversary"]', "newtab.js must treat overview and anniversary as top-level main views.");
assertIncludes(js, 'const defaultMainView = "overview"', "newtab.js must land on the overview page by default.");
assert(
  !js.includes('stored[mainViewStorageKey] || "work"'),
  "newtab.js must not fall back to the daily-work view when no main view is stored."
);
assertIncludes(js, "function renderOverview()", "newtab.js must render the overview page.");
assertIncludes(js, "renderOverviewTodoCard", "the overview page must summarise open todos.");
assertIncludes(js, "renderOverviewAnniversaryCard", "the overview page must summarise upcoming anniversaries.");
assertIncludes(js, "getOverviewDuplicateGroups", "the overview page must detect duplicate open tabs.");
assertIncludes(js, "handleOverviewCleanDuplicates", "the overview page must close duplicate tabs in one action.");
assertIncludes(js, "renderOverviewNoteCard", "the overview page must recommend a WeRead highlight.");
assertIncludes(js, "shuffleOverviewNote", "the overview page must reshuffle the recommended highlight.");
assertIncludes(js, "async function refreshOverview()", "the overview page must refresh live tab and note data on demand.");
assertIncludes(js, "getInitialReadingReviewIndex", "newtab.js must randomize the initial WeRead review item.");
assertIncludes(js, "activeIndex = getInitialReadingReviewIndex", "newtab.js must not always start WeRead review at the first item.");
assertIncludes(js, "exportActiveReadingShareImage", "newtab.js must export the active WeRead review as a share image.");
assertIncludes(js, "openReadingSharePreview", "newtab.js must preview the WeRead share image before downloading.");
assertIncludes(js, "downloadReadingSharePreview", "newtab.js must download the confirmed WeRead share image preview.");
assertIncludes(js, "readingShareHierarchy", "newtab.js must document the WeRead share image visual hierarchy.");
assertIncludes(js, "readingShareHeightRange", "newtab.js must size WeRead share images based on content height.");
assertIncludes(js, "getReadingShareCanvasHeight", "newtab.js must calculate the WeRead share image final height.");
assertIncludes(js, "getWereadArticleTitle", "newtab.js must prefer article titles for WeRead公众号 items.");
assertIncludes(js, "isGenericWereadBookName", "newtab.js must detect generic WeRead公众号 book names.");
assertIncludes(js, "quoteLength > 170 ? 39 : quoteLength > 92 ? 44 : 52", "newtab.js must use calmer WeRead share quote font sizes.");
assert(!js.includes("weread-review-data.json"), "newtab.js must not load packaged local WeRead review JSON.");
assert(!js.includes("wereadReviewAsset"), "newtab.js must not keep a packaged local WeRead review asset constant.");
assert(!("download:weread" in (packageJson.scripts || {})), "package.json must not expose the local WeRead downloader.");

assertIncludes(providerAutosubmit, "runOhMyTabProviderAutosubmit", "provider autosubmit helper must use the OhMyTab global name.");
assert(!providerAutosubmit.includes("runQiamuProviderAutosubmit"), "provider autosubmit helper must not keep the old Qiamu global name.");
assertIncludes(noteEditorSource, "window.OhMyTabNoteEditor", "note editor must expose an OhMyTab global.");
assert(!noteEditorSource.includes("QiamuNoteEditor"), "note editor source must not expose the old Qiamu global.");
assert(!existsSync(new URL("scripts/download-weread-notes.mjs", root)), "local WeRead downloader script must not be shipped.");
assertIncludes(js, "getRemoteFaviconUrl", "newtab.js must expose a non-fetch favicon URL helper.");
assertIncludes(js, "is-weather-drawer-open", "newtab.js must mark the root while the weather drawer is open.");
assert(
  !js.includes("fetchGoogleFavicon") && !js.includes("fetch(faviconUrl"),
  "newtab.js must not fetch Google favicon URLs because they redirect to gstatic and raise extension CORS errors."
);
assert(
  !js.includes("把值得回看的句子留成一张图"),
  "newtab.js must not use the old heavy footer tagline in the WeRead share image."
);

assertIncludes(css, ".main-tabs", "newtab.css must style the top-level tab switcher.");
assertIncludes(css, ":root.is-weather-drawer-open", "newtab.css must move the main tabs away from the open weather drawer.");
assertIncludes(css, ".mission-card", "newtab.css must include tabout-style mission cards.");
assertIncludes(css, ".reading-review-card", "newtab.css must style WeRead review cards.");
assertIncludes(css, ".anniversary-reminder-view", "newtab.css must style the anniversary reminder view.");
assertIncludes(css, ".anniversary-feature-card", "newtab.css must style the primary upcoming anniversary card.");
assertIncludes(css, ".anniversary-drawer", "newtab.css must style the all-anniversaries drawer.");
assertIncludes(css, ".anniversary-dialog", "newtab.css must style the add/edit anniversary dialog.");
assertIncludes(css, ".anniversary-date-row", "newtab.css must keep anniversary year/month/day controls on one row.");
assertIncludes(css, "overscroll-behavior: contain;", "anniversary dialog must contain touch/trackpad scroll gestures.");
assertIncludes(css, "touch-action: pan-y;", "anniversary dialog must avoid horizontal swipe closing while editing fields.");
assertIncludes(css, ".anniversary-tag.rose", "newtab.css must visually distinguish built-in public holidays.");
assertIncludes(css, ".anniversary-drawer-item.is-readonly", "newtab.css must render built-in anniversary drawer rows as read-only.");
assertIncludes(css, ".overview-grid", "newtab.css must lay the overview page out as a four-area grid.");
assertIncludes(css, ".overview-card", "newtab.css must style the overview cards.");
assertIncludes(css, ".product-credits", "newtab.css must style the product acknowledgement links.");
assertIncludes(css, ".reading-export-button", "newtab.css must style the WeRead share image export button.");
assertIncludes(css, ".reading-weread-sync-backdrop", "newtab.css must style the WeRead sync drawer backdrop.");
assertIncludes(css, ".reading-weread-sync-drawer", "newtab.css must style the WeRead sync drawer.");
assertIncludes(css, "width: min(520px, calc(100vw - 28px));", "newtab.css must give the WeRead sync drawer enough desktop width.");
assertIncludes(css, ".reading-share-preview", "newtab.css must style the WeRead share image preview.");

assertIncludes(background, 'importScripts("src/weread-sync-core.js")', "background.js must load the shared WeRead sync core.");
assertIncludes(background, "chrome.alarms.create", "background.js must register daily WeRead sync alarms.");
assertIncludes(background, "weread:saveKeyAndSync", "background.js must handle save-and-sync messages.");
assertIncludes(background, "weread:openKeyPage", "background.js must open the official WeRead Skill page for manual key copy.");
assert(!background.includes("weread:capturedApiKey"), "background.js must not accept captured WeRead API keys from the official page.");
assertIncludes(background, "weread:clearKey", "background.js must handle clear-key messages.");
assertIncludes(background, "weread:clearNotes", "background.js must handle clear-notes messages.");

assertIncludes(privacyPolicy, "微信读书 API Key", "privacy policy must mention local-only WeRead key storage.");
assertIncludes(privacyPolicy, "i.weread.qq.com", "privacy policy must mention the WeRead gateway request.");
assertIncludes(privacyPolicy, "weread.qq.com/r/weread-skills", "privacy policy must mention the official WeRead Skill page key-copy flow.");
assert(!privacyPolicy.includes("only detects the `wrk-...` API Key"), "privacy policy must not describe automatic WeRead page key detection.");
