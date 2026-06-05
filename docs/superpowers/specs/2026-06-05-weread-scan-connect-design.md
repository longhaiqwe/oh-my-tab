# 微信读书扫码连接设计

日期：2026-06-05

## 目标

让非技术用户不需要手动查找、复制和粘贴微信读书 API Key，也能在 OhMyTab 里完成微信读书笔记同步。

默认体验应当是：

1. 用户在 OhMyTab 的读书回顾页点击「扫码连接微信读书」。
2. 扩展打开微信读书官方 Skill 页面 `https://weread.qq.com/r/weread-skills`。
3. 用户在官方页面用微信扫码登录。
4. 官方页面展示 `wrk-...` API Key 后，OhMyTab 自动识别并保存到本机。
5. 扩展立即触发一次同步，成功后回到或刷新读书回顾页。

用户感知上是“扫码后同步”，但账号登录和授权都发生在微信读书官方页面，OhMyTab 不接触微信账号、密码、短信验证码或网页登录 cookie。

## 背景

当前产品化同步路径要求用户在设置中手动填写 `wrk-...` API Key。这个流程对技术用户可接受，但对普通用户门槛偏高。

微信读书官方 Skill 页面说明：登录微信读书后即可获取 API Key，API Key 用于连接微信读书账号并访问个人阅读信息。官方 GitHub 仓库也说明需要前往该页面获取 `WEREAD_API_KEY=wrk-xxxxxxxx`，且 API Key 绑定用户身份。

## 推荐方案

采用“官方页面扫码 + 扩展自动捕获 key”的方案。

实现方式：

- 新增 `https://weread.qq.com/*` host permission。
- 新增只在 `https://weread.qq.com/r/weread-skills*` 运行的 content script。
- content script 只查找页面中符合 `wrk-[A-Za-z0-9_-]+` 的文本。
- 找到 key 后，通过 `chrome.runtime.sendMessage` 发给 background。
- background 复用现有 `weread:saveKeyAndSync` 路径，保存 key 并立即同步。
- newtab 监听或轮询同步状态，展示连接结果。

保留手动粘贴 API Key 作为高级/兜底入口。

## 不采用的方案

不直接模拟微信读书网页登录协议，不保存 `wr_vid`、`wr_skey` 等 cookie。

原因：

- Cookie 登录属于更敏感的账号会话凭据，隐私说明和审核风险更高。
- 网页私有接口更容易变化，维护成本更高。
- 当前官方 Skill API 已经提供 `wrk-...` key 和 agent gateway，同步核心代码已经围绕这条路径实现。

不自建后端代理或 OAuth 中转。

原因：

- OhMyTab 当前定位是本地优先扩展。
- 自建服务会引入账号、服务端存储、可用性、隐私政策和运维问题。
- 目前没有必要让用户数据经过 OhMyTab 服务器。

## 用户体验

读书回顾页空状态和同步抽屉改为默认显示：

- 主按钮：「扫码连接微信读书」
- 次按钮：「我已有 API Key」
- 状态文案：连接前显示“用微信扫码登录官方页面，OhMyTab 会在本机保存连接凭证。”

点击「扫码连接微信读书」后：

- 打开官方 Skill 页面新标签页。
- 如果 content script 检测到 key，官方页上显示一个轻量提示：“OhMyTab 已获取连接凭证，正在同步。”
- OhMyTab 读书回顾页显示“正在同步微信读书笔记”。
- 同步成功后显示总书数、笔记数和上次同步时间。

手动模式：

- 点击「我已有 API Key」展开原有密码输入框。
- 文案强调 key 只保存在本机。
- 手动保存后仍走现有 `saveKeyAndSync`。

## 数据流

```text
OhMyTab newtab
  -> user clicks connect
  -> opens https://weread.qq.com/r/weread-skills
  -> user scans QR on official WeRead page
  -> official page renders wrk API key
  -> content script extracts wrk key
  -> background saveKeyAndSync
  -> chrome.storage.local stores key
  -> i.weread.qq.com/api/agent/gateway sync
  -> IndexedDB stores normalized notes
  -> reading review renders local synced notes
```

## Permission And Privacy

新增权限：

- `https://weread.qq.com/*`

用途：

- 打开微信读书官方 Skill 页面。
- 在该页面识别官方展示给用户的 `wrk-...` API Key。

隐私边界：

- OhMyTab 不读取微信读书网页 cookie。
- OhMyTab 不截取二维码图片。
- OhMyTab 不处理微信账号、密码、手机号、短信验证码或微信登录会话。
- OhMyTab 只保存 `wrk-...` API Key 到 `chrome.storage.local`。
- 同步后的笔记仍只保存在本机 IndexedDB。
- 网络同步仍只请求微信读书官方/Skill 相关域名。

文档需要更新 README、privacy policy 和 Chrome Web Store submission。

## Error Handling

- 用户关闭官方页面但没有产生 key：OhMyTab 维持未连接状态，并提示可重试或手动粘贴 key。
- 页面结构变化导致 content script 没捕获到 key：用户可以点击「我已有 API Key」手动粘贴。
- 捕获到格式不合法的 key：拒绝保存，提示“连接凭证格式无效”。
- 同步失败：保留 key，显示接口错误；不删除旧笔记。
- 多次捕获同一个 key：幂等处理，避免重复同步风暴。
- 用户点击清除 key：删除本机 key，保留“清除本地笔记”作为独立动作。

## Testing

自动测试：

- integration test 检查 manifest 包含 `https://weread.qq.com/*`。
- integration test 检查 content script 只匹配 `https://weread.qq.com/r/weread-skills*`。
- 单元测试或脚本测试 key 提取逻辑：能提取 `wrk-demo_123`，忽略非 key 文本。
- background 测试覆盖来自 content script 的保存消息，并确认 raw key 不出现在公开状态里。
- release build 校验 content script 文件被打入 zip。

手动验证：

- 未连接状态下点击「扫码连接微信读书」会打开官方页面。
- 在官方页面扫码登录后，key 被自动保存并触发同步。
- 同步成功后读书回顾页显示笔记。
- 官方页面 DOM 改版或无法捕获时，手动 API Key 兜底可用。
- 清除 key 后不会继续自动同步。

## Rollout

第一版只支持官方 Skill 页面捕获 `wrk-...` key。

不做 cookie 登录，不做多账号，不做自建服务，不做跨设备同步。

如果官方后续提供明确的扩展授权回调或 OAuth 类流程，再考虑替换当前捕获方案。

## References

- 微信读书 Skill 官方页面：`https://weread.qq.com/r/weread-skills`
- Tencent/WeChatReading GitHub：`https://github.com/tencent/wechatreading`
