# 微信读书本地同步设计

日期：2026-06-04

## 目标

为 OhMyTab 增加一套可产品化的微信读书同步流程：每个用户都可以在扩展里填写自己的微信读书 Skill API Key，把自己的读书笔记同步到本地，并且每天自动刷新一次，不需要使用命令行。

这个功能必须在 Windows 和 Mac 上保持一致体验。OhMyTab 不得把用户的微信读书 API Key、读书笔记、划线、想法、书架数据或同步结果上传到任何 OhMyTab 服务器。

## 当前状态

OhMyTab 已经有一个微信读书回顾页。早期本地验证曾经使用打包 JSON 和 Node 脚本导入笔记，但这条路径不适合作为对外产品流程。

这对本地开发可用，但不适合作为对外产品流程。普通用户不应该被要求安装 Node.js、运行脚本或配置 shell 环境变量。

## 推荐方案

把主要的微信读书同步路径移到 Chrome 扩展内部：

- 在现有设置抽屉里增加「微信读书」设置区块。
- 让用户把自己的 `WEREAD_API_KEY` 粘贴到密码输入框里。
- 把 key 存到本机的 `chrome.storage.local`。
- 用户保存 key 后立即触发一次同步。
- 使用 `chrome.alarms` 注册每天一次的后台同步。
- 把标准化后的笔记数据存到本机 IndexedDB，避免触发 Chrome 扩展 storage 容量限制。
- 当用户还没有同步自己的数据时，阅读页显示配置同步的空状态，不再读取打包 JSON 兜底数据。

旧的 Node 下载脚本不再保留在产品仓库里。

## 用户体验

设置抽屉新增「微信读书」区块，包含：

- API Key 输入框。
- 保存并同步按钮。
- 上次同步时间。
- 同步状态文本。
- 清除 key 按钮。
- 清除本地微信读书笔记按钮。
- 简短隐私提示：key 和笔记只保存在这台设备上，不会发送给 OhMyTab。

用户保存有效 key 后：

1. 扩展把 key 存到本机。
2. 扩展立即开始同步。
3. 同步成功后，微信读书回顾页刷新为用户自己的笔记数据。
4. 同步失败时，设置区块展示简短错误信息，但不记录或展示完整 key。

微信读书回顾页只读取用户本地同步的数据。如果本地没有用户同步数据，则展示配置同步的空状态。

## 数据流

扩展调用这些接口：

- `/user/notebooks`：获取所有有笔记的书。
- `/book/bookmarklist`：获取单本书的划线内容。
- `/review/list/mine`：获取单本书的个人想法、点评和书评。

所有请求都通过：

```text
POST https://i.weread.qq.com/api/agent/gateway
Authorization: Bearer <用户自己的 key>
Content-Type: application/json
```

每次请求都带 `skill_version`。

分页规则：

- `/user/notebooks` 使用 `count` 和 `lastSort`。
- `/review/list/mine` 使用 `count` 和 `synckey`。
- 所有业务参数都放在 JSON body 顶层，不包进 `params`。

同步模块把接口数据标准化成当前微信读书回顾渲染器已经支持的 item 结构：

- `id`
- `type`
- `bookId`
- `bookName`
- `bookAuthor`
- `sourceName`
- `articleTitle`
- `chapterUid`
- `chapterName`
- `markText`
- `noteContent`
- `noteTime`
- `range`
- `deepLink`

元数据包含：

- `schemaVersion`
- `generatedAt`
- `source`
- `totalBooks`
- `totalItems`
- `lastSyncStatus`

## 本地存储

使用两类本地存储：

- `chrome.storage.local`：保存体积小的同步设置，包括 API Key、上次同步时间和同步状态。
- IndexedDB：保存标准化后的微信读书笔记数据。

不要对微信读书 key 或笔记使用 `chrome.storage.sync`，因为那可能经过 Chrome 账号同步。

API Key 保存后，界面只显示脱敏状态。日志里不能打印 key，也不能打印请求的 `Authorization` header。

## 后台同步

在 MV3 background service worker 里使用 `chrome.alarms`：

- 扩展安装或启动时注册或刷新每天一次的 alarm。
- alarm 触发时读取本地微信读书 key。
- 如果没有 key，静默跳过。
- 如果有 key，执行与手动「保存并同步」相同的同步流程。
- 同步成功或失败后，把状态保存到本地，供设置 UI 展示。

同步流程必须避免并发运行。如果手动同步正在运行，每日后台同步直接跳过，并把当前正在运行的手动同步作为有效同步任务。

## 权限

Manifest 需要调整：

- 增加 `alarms` 权限。
- 增加 `https://i.weread.qq.com/*` host permission。

现有 `storage` 权限已经可用。

## 错误处理

需要明确处理这些情况：

- 缺少 key：显示微信读书同步尚未配置。
- key 格式无效：拒绝不以 `wrk-` 开头的 key。
- HTTP 请求失败：显示简短、可重试的同步错误。
- 微信读书返回 `errcode`：优先展示接口返回的错误信息。
- 微信读书返回 `upgrade_info`：展示升级提示，并停止当前同步。
- 用户没有笔记：视为同步成功，笔记数为 0。
- 用户书库较大：同步全部分页，但保持 UI 可响应，并避免重复并发同步。

同步失败不能删除上一次成功同步的数据。每日后台同步失败时，微信读书回顾页仍然使用最近一次成功同步的本地数据。

## 隐私要求

功能必须在 UI 和文档中说明并保证：

- 微信读书 API Key 只保存在用户设备本地。
- 读书笔记和同步结果只保存在用户设备本地。
- OhMyTab 不会上传、售卖、查看或在服务器上处理用户的微信读书 key 或笔记。
- 同步时唯一访问的远程服务是微信读书 API gateway。
- 清除 key 后，扩展不再具备后续同步权限。
- 清除本地笔记后，本机同步得到的微信读书笔记数据会被移除。

隐私政策和权限说明需要补充微信读书 gateway 请求。

## 测试

增加聚焦的测试或校验项：

- Manifest 包含 `alarms` 和微信读书 host permission。
- 设置 UI 暴露微信读书 key、同步、状态、清除 key、清除笔记控件。
- 微信读书同步代码校验 `wrk-` key。
- 请求 body 中业务参数保持顶层平铺。
- notebooks 分页使用 `lastSort`。
- reviews 分页使用 `synckey`。
- 标准化后的 item 符合现有微信读书回顾 item 结构。
- 微信读书回顾页读取 IndexedDB 用户数据；没有同步数据时展示空状态。
- 后台 alarm 注册逻辑存在。
- 隐私政策说明 key 和笔记只在本地保存。

手动验证覆盖：

- 保存 key 后立即同步。
- 重新加载扩展后，确认笔记仍可读取。
- 触发后台同步路径。
- 清除 key 后，确认不会继续同步。
- 清除本地笔记后，确认回顾页不再展示用户同步数据。

## 非目标

- 不做云同步。
- 不做 OhMyTab 账号系统。
- 不做微信读书请求的服务器代理。
- 不对微信读书 key 或笔记使用 Chrome `storage.sync`。
- 不要求用户安装 Node.js 或运行命令行脚本。
