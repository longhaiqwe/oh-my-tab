# Privacy Policy for OhMyTab

Last updated: 2026-06-04

OhMyTab is a local-first Chrome new tab extension. It replaces the default new tab page with a personal dashboard for search, custom links, recent browsing, bookmarks, todos, notes, weather, quotes, and a lightweight music widget.

## Data The Extension Handles

OhMyTab may handle the following data only to provide its user-facing features:

- Browsing history: used to show recent visits, group them by category, and include them in local search results on the new tab page.
- Bookmarks: used to show the browser bookmarks panel and include bookmarks in local search results.
- Open tab metadata: used locally to show the tab-management view, detect duplicate new tab pages, switch to existing tabs, and close tabs only when the user chooses that action.
- User-created content: custom links, todos, notes, weather city selections, preferences, and cached UI data.
- Search text: used when the user actively submits a query to the selected search provider or AI entry point.
- 微信读书 API Key and reading notes: used only when the user enables WeRead sync. Users can open the official WeRead Skill page at `https://weread.qq.com/r/weread-skills`, copy their API Key, and paste it into OhMyTab. The key is used to request the user's own WeRead Skill data, and the notes are used to power the local reading review feature.

## Local Storage

Custom links, todos, notes, settings, weather city selections, quote cache, and icon cache are stored in Chrome extension storage on the user's device. OhMyTab does not upload browsing history, bookmarks, open tab metadata, todos, notes, custom links, or settings to an OhMyTab server.

When WeRead sync is enabled, the WeRead API Key is stored only in Chrome local extension storage on the user's device. Normalized WeRead reading notes are stored only in local IndexedDB on the user's device. OhMyTab does not upload, store, inspect, or process the user's WeRead API Key or reading notes on an OhMyTab server.

## Third-Party Requests

Some optional or user-triggered features contact third-party services:

- Weather requests are sent to the Amap weather API.
- Daily quote requests are sent to Hitokoto.
- Favicon fallback requests are sent to Google's favicon service.
- Music widget requests are sent to the public OhMyTab Music API.
- When the user actively selects Google, ChatGPT, Doubao, Kimi, Baidu, Bing, or DuckDuckGo as the search target, the query is sent to the selected service.
- WeChat article metadata requests may be sent to `mp.weixin.qq.com` to improve titles shown in recent browsing.
- When the user chooses to get a WeRead API Key, OhMyTab opens `https://weread.qq.com/r/weread-skills` in a normal tab so the user can copy the key from the official page and paste it back into OhMyTab. OhMyTab does not read the WeRead page, cookies, QR images, account passwords, phone numbers, verification codes, or web login sessions.
- If the user enables WeRead sync, sync requests are sent directly from the extension to `https://i.weread.qq.com/api/agent/gateway` using the user's own local WeRead API Key.

These requests are made over HTTPS. Third-party services may process requests according to their own privacy policies.

## Data Sharing and Sale

OhMyTab does not sell user data. OhMyTab does not use browsing history, bookmarks, open tab metadata, todos, notes, or custom links for advertising. OhMyTab does not transfer user data to third parties except for the feature-specific requests listed above.

The use of information received from Chrome APIs will adhere to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Permissions

OhMyTab requests Chrome permissions only for its stated new tab dashboard purpose:

- `history`: to display and search recent browsing locally.
- `bookmarks`: to display and search bookmarks locally.
- `tabs`: to display and manage currently open tabs locally, including duplicate new tab cleanup and switching to an already open page.
- `storage`: to save user settings and local dashboard content.
- `alarms`: to run the optional WeRead sync once per day on the user's device.
- Host permissions for ChatGPT, Doubao, Kimi, Google, WeChat articles, OhMyTab Music, Hitokoto, Amap, and the WeRead gateway: to support the corresponding user-facing integrations.

## Data Deletion

Users can delete custom links, todos, notes, weather cities, and settings inside the extension UI where available. WeRead sync settings include controls to clear the local WeRead API Key and clear locally synced WeRead notes. Users can also remove all extension data by uninstalling OhMyTab from Chrome, which removes the extension's local storage.

## Contact

For privacy questions, contact the project maintainer through the OhMyTab repository or the support contact listed on the Chrome Web Store item.
