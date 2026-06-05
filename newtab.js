(function () {
  const extensionTitle =
    (typeof chrome !== "undefined" && chrome.i18n?.getMessage?.("extensionName")) || "OhMyTab";
  document.title = extensionTitle;

  const storageKey = "ohmytabLinks";
  const settingsKey = "ohmytabSettings";
  const mainViewStorageKey = "ohmytabMainView";
  const deferredStorageKey = "deferred";
  const faviconCacheKey = "ohmytabFaviconCache";
  const historyTitleCacheKey = "ohmytabHistoryTitleCache";
  const todoStorageKey = "ohmytabTodos";
  const pomodoroStorageKey = "ohmytabPomodoro";
  const quoteStorageKey = "ohmytabQuote";
  const notesStorageKey = "ohmytabNotes";
  const weatherStorageKey = "ohmytabWeather";
  const anniversaryStorageKey = "ohmytabAnniversaries";
  const wereadSyncStorageKey = "ohmytabWereadSync";
  const legacyStorageKeys = {
    [storageKey]: "qiamuTabLinks",
    [settingsKey]: "qiamuTabSettings",
    [mainViewStorageKey]: "qiamuTabMainView",
    [faviconCacheKey]: "qiamuTabFaviconCache",
    [historyTitleCacheKey]: "qiamuTabHistoryTitleCache",
    [todoStorageKey]: "qiamuTabTodos",
    [pomodoroStorageKey]: "qiamuTabPomodoro",
    [quoteStorageKey]: "qiamuTabQuote",
    [notesStorageKey]: "qiamuTabNotes",
    [weatherStorageKey]: "qiamuTabWeather",
    [anniversaryStorageKey]: "qiamuTabAnniversaries",
    [wereadSyncStorageKey]: "qiamuTabWereadSync"
  };
  const musicApiBase = "https://music.qiaomu.ai";
  const amapWeatherKey = "856e4f19ded88246c86f3aff712bb0e7";
  const amapCityAsset = "assets/amap-cities.json";
  const anniversaryUtils = window.OhMyTabAnniversaryUtils;
  const wereadSyncCore = window.OhMyTabWereadSyncCore;
  const mainViewNames = ["work", "tabs", "reading", "anniversary"];
  const memoryStorage = {};
  const defaultAnniversaryAdvanceDays = 7;
  const genericWeChatTitles = new Set(["公众号", "微信公众平台", "wechat"]);
  const genericWereadBookNames = new Set(["", "未命名书籍", "公众号", "微信读书", "微信公众平台", "wechat", "该账号已注销"]);
  const wereadAuthErrorMessage = "微信读书 API Key 已失效，请重新获取后粘贴同步。";
  let wereadLocalSyncInFlight = null;
  const defaultSettings = {
    searchEngine: "",
    language: "auto",
    theme: "light",
    wallpaper: "none",
    showQuote: true,
    showTodos: true,
    showMusicWidget: true,
    showCustomLinks: true,
    recentLimit: 5
  };
  const i18n = {
    zh: {
      extensionTitle: "OhMyTab",
      add: "添加",
      addLink: "添加网址",
      editLink: "编辑网址",
      close: "关闭",
      cancel: "取消",
      save: "保存",
      delete: "删除",
      restore: "恢复",
      search: "搜索",
      modules: "模块",
      wallpaper: "壁纸",
      appearance: "外观",
      quote: "好句",
      sync: "同步",
      localFirst: "本地优先",
      pending: "待接入",
      language: "语言",
      autoLanguage: "跟随浏览器",
      chinese: "中文",
      english: "English",
      recent: "最近访问",
      bookmarks: "收藏夹",
      settings: "设置",
      browserBookmarks: "浏览器收藏",
      last72Hours: "72 小时",
      recentSearch: "搜索最近访问",
      bookmarkSearch: "搜索收藏夹",
      sidebar: "侧栏",
      sidebarViews: "侧栏视图",
      openSidebar: "打开侧栏",
      weather: "天气",
      openWeather: "打开天气",
      weatherSummary: "关注地区",
      addRegion: "添加地区",
      weatherSearchPlaceholder: "搜索城市、区县或 adcode",
      newTab: "新标签页",
      pomodoro: "番茄钟",
      newNote: "新建便签",
      pomodoroMode: "番茄钟模式",
      startOrPause: "开始或暂停",
      reset: "重置",
      searchLabel: "搜索网址或历史",
      searchPlaceholder: "搜索网址、历史或收藏",
      siteSearch: "站内搜索",
      exitSiteSearch: "退出站内搜索",
      switchSearchEngine: "切换搜索引擎",
      todayTodo: "今日待办",
      musicBrand: "OhMyTab Music",
      music: "音乐",
      musicLoading: "正在连接 OhMyTab Music。",
      musicUnavailable: "音乐暂时不可用",
      noMusicTracks: "还没有公开歌曲。",
      lyricsLoading: "歌词载入中",
      noLyrics: "暂无歌词",
      openMusicSite: "打开音乐站",
      previousTrack: "上一首",
      nextTrack: "下一首",
      addTodo: "添加待办",
      todoPlaceholder: "写下一件事",
      completedTodos: "查看最近完成的待办",
      customSites: "自定义网站",
      notes: "便签",
      commandPalette: "命令面板",
      commandSearch: "命令搜索",
      commandPlaceholder: "搜索命令、收藏、最近访问",
      addMethod: "添加方式",
      manual: "手动填写",
      popularSites: "常用网站",
      name: "名称",
      url: "网址",
      group: "分组",
      namePlaceholder: "例如：Notion",
      groupPlaceholder: "例如：工作",
      recentCompleted: "最近完成",
      completed: "已完成",
      noCompletedTodos: "还没有完成的待办。",
      markUndone: "标记未完成",
      markDone: "标记完成",
      archiveTodo: "归档待办",
      deleteTodo: "删除待办",
      tooManyTodos: "不要高估自己。",
      localSearch: "本地搜索",
      website: "网站",
      history: "历史",
      site: "站内",
      siteHistory: "站内历史",
      inSiteSearch: "在 {host} 中搜索",
      noSiteMatches: "这个站点里没有匹配项",
      searchHost: "搜索 {host}",
      noLocalSiteMatches: "本地历史、收藏和自定义网站里暂时没有找到。",
      siteSearchHint: "输入关键词后，会只在这个站点的本地记录里查找。",
      noMatches: "没有匹配项",
      startSearch: "输入关键词开始搜索",
      addTodoHint: "按 Shift+Enter 可把当前输入加入待办。",
      searchHint: "可搜索网址、历史、收藏，或按 Shift+Enter 添加待办。",
      noCustomMatch: "没有匹配的收藏。",
      noCustomLinks: "还没有收藏的网址。",
      editNamed: "编辑 {title}",
      deleteNamed: "删除 {title}",
      bookmarkCount: "{count} 个收藏",
      noBookmarkMatch: "没有匹配的收藏。",
      noBookmarkAccess: "当前环境不能读取浏览器收藏。",
      browserFolder: "浏览器",
      noRecentHistory: "最近三天没有访问记录。",
      copyTitleUrl: "复制标题和 URL",
      copyNamedTitleUrl: "复制 {title} 的标题和 URL",
      copied: "已复制",
      copyFailed: "复制失败",
      copiedNamed: "已复制 {title}",
      copyNamedFailed: "复制 {title} 失败",
      visitFallback: "最近访问",
      visitCount: "{count} 次访问",
      minutesAgo: "{count} 分钟前",
      hoursAgo: "{count} 小时前",
      wechatArticle: "微信文章",
      weatherRegionCount: "{count} 个地区",
      addTrackedRegion: "添加关注地区",
      weatherUpdating: "正在更新天气。",
      weatherAddPrompt: "搜索并添加一个地区。",
      cityListLoading: "城市列表加载中。",
      cityListUnavailable: "城市列表暂时不可用",
      noRegionFound: "没有找到这个地区。",
      added: "已添加",
      removeCity: "移除 {city}",
      realTimeWeather: "实时天气",
      pendingUpdate: "待更新",
      todayTemp: "今日温度",
      nextThreeDays: "未来三天",
      tempTrend: "温差趋势",
      forecast: "预报",
      refresh: "刷新",
      notUpdated: "未更新",
      weatherUnavailable: "天气暂时不可用",
      humidity: "湿度",
      windDirection: "风向",
      windPower: "风力",
      pressure: "气压",
      unavailable: "暂无",
      gentleBreeze: "轻柔微风",
      pressureStable: "气压稳定",
      waitingUpdate: "待更新",
      humid: "空气偏潮",
      dry: "空气偏干",
      comfortable: "体感舒适",
      mildWind: "风感温和",
      comfy: "舒适",
      windy: "有风感",
      strongWind: "风力较强",
      highHumidity: "湿度较高",
      feelsCool: "体感偏凉",
      bringUmbrella: "出行带伞",
      stayWarm: "注意保暖",
      mindRoad: "路面留心",
      lowVisibility: "能见度低",
      reduceExposure: "减少久留",
      sunnyDefault: "晴",
      sunshine: "光照充足",
      goodToGoOut: "适合出门",
      rainAdvice: "白天有降雨，{high}° / {low}°，出门记得带伞。",
      cloudyAdvice: "白天{weather}，夜间较凉，建议备一件薄外套。",
      snowAdvice: "气温偏低，{high}° / {low}°，注意防滑保暖。",
      sunnyAdvice: "白天较明朗，{high}° / {low}°，适合安排户外事务。",
      focusLine: "把注意力收成一个圆。",
      breakLine: "休息片刻，让下一轮更轻。",
      momentNight: "夜深了，只保留必要的光。",
      momentMorning: "晨间留白，先打开最重要的那一页。",
      momentNoon: "午间的桌面，适合轻轻整理。",
      momentAfternoon: "下午继续，把入口放在手边。",
      momentEvening: "收束今天，留下还想回看的线索。",
      operations: "操作",
      addTodoCommand: "添加 Todo",
      addTodoMeta: "记录下一件事",
      openPomodoro: "打开番茄钟",
      closePomodoro: "退出番茄钟",
      focusMeta: "切换首页专注计时",
      addWebsite: "添加网站",
      addWebsiteMeta: "加入首页启动器",
      openSettings: "打开设置",
      settingsMeta: "搜索、模块、配色",
      info: "信息",
      openWeatherCommand: "打开天气",
      weatherMeta: "关注地区和预报",
      themeLight: "浅色",
      themeDark: "深色",
      switchTheme: "切换{theme}",
      themeMeta: "插件配色",
      customSitesGroup: "自定义网站",
      noCommandMatches: "没有匹配的命令。",
      categories: {
        ai: "AI",
        dev: "开发",
        work: "工作",
        reading: "阅读",
        social: "社交",
        media: "影音",
        shopping: "购物",
        other: "其他"
      }
    },
    en: {
      extensionTitle: "OhMyTab",
      add: "Add",
      addLink: "Add Site",
      editLink: "Edit Site",
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      restore: "Restore",
      search: "Search",
      modules: "Modules",
      wallpaper: "Wallpaper",
      appearance: "Appearance",
      quote: "Quote",
      sync: "Sync",
      localFirst: "Local first",
      pending: "Coming soon",
      language: "Language",
      autoLanguage: "Auto",
      chinese: "中文",
      english: "English",
      recent: "Recent",
      bookmarks: "Bookmarks",
      settings: "Settings",
      browserBookmarks: "Browser bookmarks",
      last72Hours: "72 hours",
      recentSearch: "Search recent",
      bookmarkSearch: "Search bookmarks",
      sidebar: "Sidebar",
      sidebarViews: "Sidebar views",
      openSidebar: "Open sidebar",
      weather: "Weather",
      openWeather: "Open weather",
      weatherSummary: "Tracked regions",
      addRegion: "Add region",
      weatherSearchPlaceholder: "Search city, district, or adcode",
      newTab: "New tab",
      pomodoro: "Pomodoro",
      newNote: "New note",
      pomodoroMode: "Pomodoro mode",
      startOrPause: "Start or pause",
      reset: "Reset",
      searchLabel: "Search sites or history",
      searchPlaceholder: "Search sites, history, or bookmarks",
      siteSearch: "Site search",
      exitSiteSearch: "Exit site search",
      switchSearchEngine: "Switch search engine",
      todayTodo: "Today todos",
      musicBrand: "OhMyTab Music",
      music: "Music",
      musicLoading: "Connecting to OhMyTab Music.",
      musicUnavailable: "Music is unavailable",
      noMusicTracks: "No published tracks yet.",
      lyricsLoading: "Loading lyrics",
      noLyrics: "No lyrics",
      openMusicSite: "Open music site",
      previousTrack: "Previous track",
      nextTrack: "Next track",
      addTodo: "Add todo",
      todoPlaceholder: "Write one thing",
      completedTodos: "View recently completed todos",
      customSites: "Custom sites",
      notes: "Notes",
      commandPalette: "Command palette",
      commandSearch: "Command search",
      commandPlaceholder: "Search commands, bookmarks, recent",
      addMethod: "Add method",
      manual: "Manual",
      popularSites: "Popular sites",
      name: "Name",
      url: "URL",
      group: "Group",
      namePlaceholder: "For example: Notion",
      groupPlaceholder: "For example: Work",
      recentCompleted: "Recently Completed",
      completed: "Completed",
      noCompletedTodos: "No completed todos yet.",
      markUndone: "Mark incomplete",
      markDone: "Mark complete",
      archiveTodo: "Archive todo",
      deleteTodo: "Delete todo",
      tooManyTodos: "Do not overestimate the day.",
      localSearch: "Local search",
      website: "Site",
      history: "History",
      site: "Site",
      siteHistory: "Site history",
      inSiteSearch: "Search within {host}",
      noSiteMatches: "No matches in this site",
      searchHost: "Search {host}",
      noLocalSiteMatches: "Nothing found in local history, bookmarks, or custom sites.",
      siteSearchHint: "Type a keyword to search only local records from this site.",
      noMatches: "No matches",
      startSearch: "Start typing to search",
      addTodoHint: "Press Shift+Enter to add the text as a todo.",
      searchHint: "Search sites, history, bookmarks, or press Shift+Enter to add a todo.",
      noCustomMatch: "No matching saved sites.",
      noCustomLinks: "No saved sites yet.",
      editNamed: "Edit {title}",
      deleteNamed: "Delete {title}",
      bookmarkCount: "{count} bookmarks",
      noBookmarkMatch: "No matching bookmarks.",
      noBookmarkAccess: "Bookmarks are unavailable in this environment.",
      browserFolder: "Browser",
      noRecentHistory: "No visits in the last three days.",
      copyTitleUrl: "Copy title and URL",
      copyNamedTitleUrl: "Copy title and URL for {title}",
      copied: "Copied",
      copyFailed: "Copy failed",
      copiedNamed: "Copied {title}",
      copyNamedFailed: "Failed to copy {title}",
      visitFallback: "Recent visit",
      visitCount: "{count} visits",
      minutesAgo: "{count} min ago",
      hoursAgo: "{count} hr ago",
      wechatArticle: "WeChat article",
      weatherRegionCount: "{count} regions",
      addTrackedRegion: "Add tracked region",
      weatherUpdating: "Updating weather.",
      weatherAddPrompt: "Search and add a region.",
      cityListLoading: "Loading city list.",
      cityListUnavailable: "City list is unavailable",
      noRegionFound: "No region found.",
      added: "Added",
      removeCity: "Remove {city}",
      realTimeWeather: "Live Weather",
      pendingUpdate: "Pending",
      todayTemp: "Today's Range",
      nextThreeDays: "Next 3 Days",
      tempTrend: "Temperature trend",
      forecast: "Forecast",
      refresh: "Refresh",
      notUpdated: "Not updated",
      weatherUnavailable: "Weather unavailable",
      humidity: "Humidity",
      windDirection: "Wind",
      windPower: "Force",
      pressure: "Pressure",
      unavailable: "N/A",
      gentleBreeze: "Gentle breeze",
      pressureStable: "Stable pressure",
      waitingUpdate: "Waiting",
      humid: "Humid",
      dry: "Dry",
      comfortable: "Comfortable",
      mildWind: "Mild wind",
      comfy: "Comfortable",
      windy: "Breezy",
      strongWind: "Strong wind",
      highHumidity: "High humidity",
      feelsCool: "Feels cool",
      bringUmbrella: "Carry an umbrella",
      stayWarm: "Stay warm",
      mindRoad: "Watch the road",
      lowVisibility: "Low visibility",
      reduceExposure: "Limit exposure",
      sunnyDefault: "Clear",
      sunshine: "Bright",
      goodToGoOut: "Good to go out",
      rainAdvice: "Rain expected, {high}° / {low}°. Bring an umbrella.",
      cloudyAdvice: "{weather} today, cooler at night. A light jacket helps.",
      snowAdvice: "Low temperature, {high}° / {low}°. Stay warm and mind the road.",
      sunnyAdvice: "Mostly bright, {high}° / {low}°. Good for outdoor plans.",
      focusLine: "Gather your attention into one clean circle.",
      breakLine: "Rest for a moment; the next round will thank you.",
      momentNight: "Late night: keep only the necessary light.",
      momentMorning: "A quiet morning, open the most important page first.",
      momentNoon: "Midday is good for a gentle reset.",
      momentAfternoon: "Keep going; keep the right doors close.",
      momentEvening: "Close the day, keep the threads worth returning to.",
      operations: "Actions",
      addTodoCommand: "Add Todo",
      addTodoMeta: "Capture the next thing",
      openPomodoro: "Open Pomodoro",
      closePomodoro: "Close Pomodoro",
      focusMeta: "Toggle the focus timer",
      addWebsite: "Add Site",
      addWebsiteMeta: "Add to the home launcher",
      openSettings: "Open Settings",
      settingsMeta: "Search, modules, appearance",
      info: "Info",
      openWeatherCommand: "Open Weather",
      weatherMeta: "Tracked regions and forecast",
      themeLight: "Light",
      themeDark: "Dark",
      switchTheme: "Switch to {theme}",
      themeMeta: "Extension appearance",
      customSitesGroup: "Custom sites",
      noCommandMatches: "No matching commands.",
      categories: {
        ai: "AI",
        dev: "Development",
        work: "Work",
        reading: "Reading",
        social: "Social",
        media: "Media",
        shopping: "Shopping",
        other: "Other"
      }
    }
  };
  const searchProviders = {
    google: { label: "Google", icon: "assets/brand-icons/search-google.svg", prefix: "https://www.google.com/search?q=" },
    chatgpt: { label: "ChatGPT", icon: "assets/brand-icons/openai.svg", prefix: "https://chatgpt.com/?ohmytab=" },
    doubao: { label: "豆包", icon: "assets/brand-icons/search-doubao.svg", prefix: "https://www.doubao.com/chat/?ohmytab=" },
    kimi: { label: "Kimi", icon: "assets/brand-icons/search-kimi.svg", prefix: "https://www.kimi.com/?ohmytab=" },
    baidu: { label: "百度", icon: "assets/brand-icons/search-baidu.svg", prefix: "https://www.baidu.com/s?wd=" },
    bing: { label: "Bing", icon: "assets/brand-icons/microsoft.svg", prefix: "https://www.bing.com/search?q=" },
    duckduckgo: { label: "DuckDuckGo", icon: "assets/brand-icons/search-duckduckgo.svg", prefix: "https://duckduckgo.com/?q=" },
    todo: { label: "Todo", icon: "assets/brand-icons/mono-todo.svg", action: "todo" }
  };
  const searchProviderOrder = ["google", "chatgpt", "doubao", "kimi", "baidu", "bing", "duckduckgo", "todo"];
  const localSearchProvider = { labelKey: "localSearch", iconName: "search", action: "local" };
  const noteColorClasses = ["note-lemon", "note-mint", "note-sky", "note-lilac", "note-peach", "note-rose"];
  const defaultWeatherCity = { name: "北京市", adcode: "110000", label: "北京市", level: "province" };
  const todoLimit = 4;
  const brandIconRules = [
    { hosts: ["chatgpt.com"], asset: "assets/brand-icons/chatgpt.svg" },
    { hosts: ["openai.com", "platform.openai.com"], asset: "assets/brand-icons/openai.svg" },
    { hosts: ["claude.ai", "anthropic.com", "console.anthropic.com"], asset: "assets/brand-icons/claude.svg" },
    { hosts: ["gemini.google.com", "bard.google.com"], asset: "assets/brand-icons/googlegemini.svg" },
    { hosts: ["perplexity.ai"], asset: "assets/brand-icons/perplexity.svg" },
    { hosts: ["huggingface.co"], asset: "assets/brand-icons/huggingface.svg" },
    { hosts: ["poe.com"], asset: "assets/brand-icons/poe.svg" },
    { hosts: ["ollama.com"], asset: "assets/brand-icons/ollama.svg" },
    { hosts: ["replicate.com"], asset: "assets/brand-icons/replicate.svg" },
    { hosts: ["cursor.com", "cursor.sh"], asset: "assets/brand-icons/cursor.svg" },
    { hosts: ["windsurf.com", "codeium.com"], asset: "assets/brand-icons/windsurf.svg" },
    { hosts: ["copilot.github.com"], asset: "assets/brand-icons/githubcopilot.svg" },
    { hosts: ["deepseek.com", "chat.deepseek.com"], asset: "assets/brand-icons/deepseek.svg" },
    { hosts: ["doubao.com"], asset: "assets/brand-icons/doubao.png" },
    { hosts: ["kimi.com"], asset: "assets/brand-icons/kimi.ico" },
    { hosts: ["mistral.ai", "chat.mistral.ai"], asset: "assets/brand-icons/mistralai.svg" },
    { hosts: ["n8n.io"], asset: "assets/brand-icons/n8n.svg" },
    { hosts: ["langchain.com", "langchain.dev"], asset: "assets/brand-icons/langchain.svg" },
    { hosts: ["github.com"], asset: "assets/brand-icons/github.svg" },
    { hosts: ["gitlab.com"], asset: "assets/brand-icons/gitlab.svg" },
    { hosts: ["mail.google.com", "gmail.com"], asset: "assets/brand-icons/gmail.svg" },
    { hosts: ["drive.google.com"], asset: "assets/brand-icons/googledrive.svg" },
    { hosts: ["docs.google.com"], asset: "assets/brand-icons/googledocs.svg" },
    { hosts: ["sheets.google.com"], asset: "assets/brand-icons/googlesheets.svg" },
    { hosts: ["slides.google.com"], asset: "assets/brand-icons/googleslides.svg" },
    { hosts: ["calendar.google.com"], asset: "assets/brand-icons/googlecalendar.svg" },
    { hosts: ["google.com"], asset: "assets/brand-icons/google.svg" },
    { hosts: ["notion.so", "notion.site"], asset: "assets/brand-icons/notion.svg" },
    { hosts: ["youtube.com", "youtu.be"], asset: "assets/brand-icons/youtube.svg" },
    { hosts: ["bilibili.com"], asset: "assets/brand-icons/bilibili.svg" },
    { hosts: ["zhihu.com"], asset: "assets/brand-icons/zhihu.png" },
    { hosts: ["xiaohongshu.com"], asset: "assets/brand-icons/xiaohongshu.png" },
    { hosts: ["weibo.com"], asset: "assets/brand-icons/weibo.ico" },
    { hosts: ["x.com", "twitter.com"], asset: "assets/brand-icons/x.svg" },
    { hosts: ["slack.com"], asset: "assets/brand-icons/slack.svg" },
    { hosts: ["figma.com"], asset: "assets/brand-icons/figma.svg" },
    { hosts: ["linear.app"], asset: "assets/brand-icons/linear.svg" },
    { hosts: ["reddit.com"], asset: "assets/brand-icons/reddit.svg" },
    { hosts: ["discord.com"], asset: "assets/brand-icons/discord.svg" },
    { hosts: ["spotify.com"], asset: "assets/brand-icons/spotify.svg" },
    { hosts: ["amazon.com", "amazon.cn", "amazon.co.jp"], asset: "assets/brand-icons/amazon.svg" },
    { hosts: ["linkedin.com"], asset: "assets/brand-icons/linkedin.svg" },
    { hosts: ["instagram.com"], asset: "assets/brand-icons/instagram.svg" },
    { hosts: ["facebook.com"], asset: "assets/brand-icons/facebook.svg" },
    { hosts: ["whatsapp.com", "web.whatsapp.com"], asset: "assets/brand-icons/whatsapp.svg" },
    { hosts: ["telegram.org", "web.telegram.org"], asset: "assets/brand-icons/telegram.svg" },
    { hosts: ["medium.com"], asset: "assets/brand-icons/medium.svg" },
    { hosts: ["substack.com"], asset: "assets/brand-icons/substack.svg" },
    { hosts: ["wikipedia.org"], asset: "assets/brand-icons/wikipedia.svg" },
    { hosts: ["stackoverflow.com"], asset: "assets/brand-icons/stackoverflow.svg" },
    { hosts: ["vercel.com"], asset: "assets/brand-icons/vercel.svg" },
    { hosts: ["npmjs.com", "npmjs.org"], asset: "assets/brand-icons/npm.svg" },
    { hosts: ["cloudflare.com"], asset: "assets/brand-icons/cloudflare.svg" },
    { hosts: ["stripe.com"], asset: "assets/brand-icons/stripe.svg" },
    { hosts: ["paypal.com"], asset: "assets/brand-icons/paypal.svg" },
    { hosts: ["netflix.com"], asset: "assets/brand-icons/netflix.svg" },
    { hosts: ["apple.com", "icloud.com"], asset: "assets/brand-icons/apple.svg" },
    { hosts: ["microsoft.com", "office.com", "live.com"], asset: "assets/brand-icons/microsoft.svg" },
    { hosts: ["dropbox.com"], asset: "assets/brand-icons/dropbox.svg" },
    { hosts: ["zoom.us"], asset: "assets/brand-icons/zoom.svg" },
    { hosts: ["trello.com"], asset: "assets/brand-icons/trello.svg" },
    { hosts: ["asana.com"], asset: "assets/brand-icons/asana.svg" },
    { hosts: ["atlassian.net", "jira.com"], asset: "assets/brand-icons/jira.svg" },
    { hosts: ["obsidian.md"], asset: "assets/brand-icons/obsidian.svg" },
    { hosts: ["weixin.qq.com", "mp.weixin.qq.com"], asset: "assets/brand-icons/wechat.svg" },
    { hosts: ["feishu.cn"], asset: "assets/brand-icons/feishu.png" },
    { hosts: ["yuque.com"], asset: "assets/brand-icons/yuque.png" },
    { hosts: ["juejin.cn"], asset: "assets/brand-icons/juejin.png" },
    { hosts: ["sspai.com"], asset: "assets/brand-icons/sspai.ico" },
    { hosts: ["tiktok.com"], asset: "assets/brand-icons/tiktok.svg" },
    { hosts: ["pinterest.com"], asset: "assets/brand-icons/pinterest.svg" },
    { hosts: ["producthunt.com"], asset: "assets/brand-icons/producthunt.svg" },
    { hosts: ["dribbble.com"], asset: "assets/brand-icons/dribbble.svg" },
    { hosts: ["behance.net"], asset: "assets/brand-icons/behance.svg" },
    { hosts: ["codepen.io"], asset: "assets/brand-icons/codepen.svg" },
    { hosts: ["jsdelivr.com", "jsdelivr.net"], asset: "assets/brand-icons/jsdelivr.svg" }
  ];
  const popularSites = [
    { title: "YouTube", url: "https://www.youtube.com", group: "影音", icon: "assets/site-icons/youtube.png" },
    { title: "知乎", url: "https://www.zhihu.com", group: "阅读", icon: "assets/site-icons/zhihu.png" },
    { title: "ChatGPT", url: "https://chatgpt.com", group: "AI", icon: "assets/site-icons/chatgpt.svg" },
    { title: "Twitter (X)", url: "https://x.com", group: "社交", icon: "assets/site-icons/x.png" },
    { title: "GitHub", url: "https://github.com", group: "开发", icon: "assets/site-icons/github.svg" },
    { title: "Gmail", url: "https://mail.google.com", group: "工作", icon: "assets/site-icons/gmail.ico" },
    { title: "Google Drive", url: "https://drive.google.com", group: "工作", icon: "assets/site-icons/googledrive.png" },
    { title: "Notion", url: "https://www.notion.so", group: "工作", icon: "assets/site-icons/notion.png" },
    { title: "Bilibili", url: "https://www.bilibili.com", group: "影音", icon: "assets/site-icons/bilibili.ico" },
    { title: "小红书", url: "https://www.xiaohongshu.com", group: "社交", icon: "assets/site-icons/xiaohongshu.png" },
    { title: "微博", url: "https://weibo.com", group: "社交", icon: "assets/site-icons/weibo.ico" },
    { title: "豆包", url: "https://www.doubao.com", group: "AI", icon: "assets/site-icons/doubao.png" },
    { title: "Kimi", url: "https://www.kimi.com", group: "AI", icon: "assets/site-icons/kimi.ico" },
    { title: "Claude", url: "https://claude.ai", group: "AI", icon: "assets/site-icons/claude.ico" },
    { title: "Perplexity", url: "https://www.perplexity.ai", group: "AI", icon: "assets/site-icons/perplexity.ico" },
    { title: "Figma", url: "https://www.figma.com", group: "设计", icon: "assets/site-icons/figma.png" },
    { title: "Linear", url: "https://linear.app", group: "工作", icon: "assets/site-icons/linear.png" },
    { title: "Slack", url: "https://slack.com", group: "工作", icon: "assets/site-icons/slack.png" },
    { title: "飞书", url: "https://www.feishu.cn", group: "工作", icon: "assets/site-icons/feishu.png" },
    { title: "语雀", url: "https://www.yuque.com", group: "工作", icon: "assets/site-icons/yuque.png" },
    { title: "掘金", url: "https://juejin.cn", group: "开发", icon: "assets/site-icons/juejin.png" },
    { title: "少数派", url: "https://sspai.com", group: "阅读", icon: "assets/site-icons/sspai.ico" },
    { title: "Medium", url: "https://medium.com", group: "阅读", icon: "assets/site-icons/medium.png" },
    { title: "Reddit", url: "https://www.reddit.com", group: "社交", icon: "assets/site-icons/reddit.ico" },
    { title: "Product Hunt", url: "https://www.producthunt.com", group: "产品", icon: "assets/site-icons/producthunt.ico" }
  ];
  const defaultLinks = [
    { id: crypto.randomUUID(), title: "Gmail", url: "https://mail.google.com", group: "日常" },
    { id: crypto.randomUUID(), title: "GitHub", url: "https://github.com", group: "开发" },
    { id: crypto.randomUUID(), title: "ChatGPT", url: "https://chatgpt.com", group: "AI" }
  ];
  const builtinAnniversaries = [
    { id: "builtin-valentines-day", title: "情人节", calendar: "solar", solarMonth: 2, solarDay: 14, advanceDays: defaultAnniversaryAdvanceDays, repeat: "yearly", builtin: true },
    { id: "builtin-womens-day", title: "妇女节", calendar: "solar", solarMonth: 3, solarDay: 8, advanceDays: defaultAnniversaryAdvanceDays, repeat: "yearly", builtin: true },
    { id: "builtin-mothers-day", title: "母亲节", calendar: "nthWeekday", solarMonth: 5, nth: 2, weekday: 0, advanceDays: defaultAnniversaryAdvanceDays, repeat: "yearly", builtin: true },
    { id: "builtin-fathers-day", title: "父亲节", calendar: "nthWeekday", solarMonth: 6, nth: 3, weekday: 0, advanceDays: defaultAnniversaryAdvanceDays, repeat: "yearly", builtin: true },
    { id: "builtin-childrens-day", title: "儿童节", calendar: "solar", solarMonth: 6, solarDay: 1, advanceDays: defaultAnniversaryAdvanceDays, repeat: "yearly", builtin: true },
    { id: "builtin-qixi", title: "七夕", calendar: "lunar", lunarMonth: 7, lunarDay: 7, advanceDays: defaultAnniversaryAdvanceDays, repeat: "yearly", builtin: true },
    { id: "builtin-mid-autumn", title: "中秋节", calendar: "lunar", lunarMonth: 8, lunarDay: 15, advanceDays: defaultAnniversaryAdvanceDays, repeat: "yearly", builtin: true },
    { id: "builtin-double-ninth", title: "重阳节", calendar: "lunar", lunarMonth: 9, lunarDay: 9, advanceDays: defaultAnniversaryAdvanceDays, repeat: "yearly", builtin: true }
  ];

  const categoryRules = [
    { name: "ai", keywords: ["openai", "chatgpt", "claude", "perplexity", "gemini", "poe", "huggingface"] },
    { name: "dev", keywords: ["github", "gitlab", "vercel", "npm", "stackoverflow", "developer", "docs", "localhost"] },
    { name: "work", keywords: ["notion", "slack", "figma", "linear", "jira", "asana", "calendar", "mail", "docs.google"] },
    { name: "reading", keywords: ["medium", "substack", "wikipedia", "news", "blog", "read", "arxiv"] },
    { name: "social", keywords: ["x.com", "twitter", "weibo", "linkedin", "reddit", "discord"] },
    { name: "media", keywords: ["youtube", "bilibili", "netflix", "spotify", "music"] },
    { name: "shopping", keywords: ["amazon", "taobao", "tmall", "jd.com", "shop", "store"] }
  ];

  const mockHistory = [
    { title: "OpenAI Platform", url: "https://platform.openai.com/docs", lastVisitTime: Date.now() - 1000 * 60 * 18, visitCount: 8 },
    { title: "GitHub Pull Requests", url: "https://github.com/pulls", lastVisitTime: Date.now() - 1000 * 60 * 46, visitCount: 12 },
    { title: "Notion Workspace", url: "https://notion.so", lastVisitTime: Date.now() - 1000 * 60 * 80, visitCount: 5 },
    { title: "The Verge", url: "https://www.theverge.com", lastVisitTime: Date.now() - 1000 * 60 * 130, visitCount: 2 }
  ];

  const state = {
    mainView: "work",
    links: [],
    bookmarks: [],
    todos: { schemaVersion: 1, updatedAt: Date.now(), items: [] },
    notes: { schemaVersion: 1, updatedAt: Date.now(), items: [] },
    anniversaries: { schemaVersion: 1, updatedAt: Date.now(), items: [] },
    faviconCache: {},
    history: [],
    openTabs: [],
    domainGroups: [],
    historyTitleCache: {},
    settings: { ...defaultSettings },
    rangeHours: 72,
    drawerTab: "bookmarks",
    focusMode: false,
    recentQuery: "",
    bookmarkQuery: "",
    commandOpen: false,
    commandQuery: "",
    commandIndex: 0,
    linkDialogTab: "manual",
    searchIndex: 0,
    siteSearch: null,
    tabCandidate: null,
    quickSitePage: 0,
    quickSitesEditing: false,
    anniversaryQuery: "",
    anniversaryCalendar: "lunar",
    quote: null,
    weather: {
      cities: [],
      reports: {},
      cityList: [],
      query: "",
      loading: false,
      error: "",
      updatedAt: 0
    },
    readingReview: {
      items: [],
      activeIndex: 0,
      history: [],
      loading: false,
      loaded: false,
      error: "",
      metadata: null,
      sharePreview: {
        url: "",
        filename: "",
        blob: null
      }
    },
    wereadSync: {
      hasKey: false,
      maskedKey: "",
      status: "idle",
      error: "",
      lastSyncedAt: "",
      totalBooks: 0,
      totalItems: 0,
      lastReason: ""
    },
    music: {
      tracks: [],
      activeIndex: 0,
      activeLine: 0,
      loading: false,
      loaded: false,
      error: "",
      isPlaying: false
    },
    pomodoro: {
      mode: "focus",
      running: false,
      remaining: 25 * 60,
      durations: { focus: 25 * 60, break: 5 * 60 },
      timerId: 0
    },
    query: "",
    firstResultUrl: "",
    dragLinkId: ""
  };

  const elements = {
    mainTabs: document.querySelector("#mainTabs"),
    mainTabButtons: document.querySelectorAll("[data-main-tab]"),
    mainViews: document.querySelectorAll(".main-view"),
    workView: document.querySelector("#workView"),
    tabManagerView: document.querySelector("#tabManagerView"),
    readingReviewView: document.querySelector("#readingReviewView"),
    dayLine: document.querySelector("#dayLine"),
    focusToggle: document.querySelector("#focusToggle"),
    noteCreateButton: document.querySelector("#noteCreateButton"),
    todoModuleToggle: document.querySelector("#todoModuleToggle"),
    musicModuleToggle: document.querySelector("#musicModuleToggle"),
    clockFace: document.querySelector("#clockFace"),
    focusFace: document.querySelector("#focusFace"),
    timeLine: document.querySelector("#timeLine"),
    homePomodoroTime: document.querySelector("#homePomodoroTime"),
    homePomodoroStart: document.querySelector("#homePomodoroStart"),
    homePomodoroReset: document.querySelector("#homePomodoroReset"),
    momentLine: document.querySelector("#momentLine"),
    searchForm: document.querySelector("#searchForm"),
    searchInput: document.querySelector("#globalSearch"),
    searchProviderButton: document.querySelector("#searchProviderButton"),
    searchProviderMenu: document.querySelector("#searchProviderMenu"),
    searchPanel: document.querySelector("#searchPanel"),
    searchResults: document.querySelector("#searchResults"),
    searchTabHint: document.querySelector("#searchTabHint"),
    siteSearchPill: document.querySelector("#siteSearchPill"),
    siteSearchLabel: document.querySelector("#siteSearchLabel"),
    clearSiteSearch: document.querySelector("#clearSiteSearch"),
    quickSites: document.querySelector("#quickSites"),
    musicWidget: document.querySelector("#musicWidget"),
    musicPlayer: document.querySelector("#musicPlayer"),
    musicAudio: document.querySelector("#musicAudio"),
    notesLayer: document.querySelector("#notesLayer"),
    quickSiteRail: document.querySelector("#quickSiteRail"),
    quickSiteDots: document.querySelector("#quickSiteDots"),
    todoHome: document.querySelector("#todoHome"),
    todoForm: document.querySelector("#todoForm"),
    todoInput: document.querySelector("#todoInput"),
    todoArchiveButton: document.querySelector("#todoArchiveButton"),
    todoArchiveDialog: document.querySelector("#todoArchiveDialog"),
    todoArchiveList: document.querySelector("#todoArchiveList"),
    closeTodoArchiveButton: document.querySelector("#closeTodoArchiveButton"),
    todoList: document.querySelector("#todoList"),
    drawerEdge: document.querySelector("#drawerEdge"),
    weatherEdge: document.querySelector("#weatherEdge"),
    weatherDrawer: document.querySelector("#weatherDrawer"),
    closeWeatherButton: document.querySelector("#closeWeatherButton"),
    weatherSummary: document.querySelector("#weatherSummary"),
    weatherSearchForm: document.querySelector("#weatherSearchForm"),
    weatherCitySearch: document.querySelector("#weatherCitySearch"),
    weatherCityResults: document.querySelector("#weatherCityResults"),
    weatherCards: document.querySelector("#weatherCards"),
    recentDrawer: document.querySelector("#recentDrawer"),
    drawerScrim: document.querySelector("#drawerScrim"),
    closeRecentButton: document.querySelector("#closeRecentButton"),
    customGroups: document.querySelector("#customGroups"),
    historyGroups: document.querySelector("#historyGroups"),
    recentSearch: document.querySelector("#recentSearch"),
    drawerTabs: document.querySelectorAll("[data-drawer-tab]"),
    drawerPanels: document.querySelectorAll("[data-panel]"),
    bookmarkList: document.querySelector("#bookmarkList"),
    bookmarkSearch: document.querySelector("#bookmarkSearch"),
    bookmarkSummary: document.querySelector("#bookmarkSummary"),
    pomodoroModeButtons: document.querySelectorAll("[data-pomodoro-mode]"),
    linkDialog: document.querySelector("#linkDialog"),
    linkForm: document.querySelector("#linkForm"),
    dialogTitle: document.querySelector("#dialogTitle"),
    linkDialogTabs: document.querySelector("#linkDialogTabs"),
    linkDialogTabButtons: document.querySelectorAll("[data-link-dialog-tab]"),
    linkDialogPanels: document.querySelectorAll("[data-link-dialog-panel]"),
    popularSiteList: document.querySelector("#popularSiteList"),
    closeDialogButton: document.querySelector("#closeDialogButton"),
    cancelDialogButton: document.querySelector("#cancelDialogButton"),
    deleteLinkButton: document.querySelector("#deleteLinkButton"),
    linkId: document.querySelector("#linkId"),
    linkTitle: document.querySelector("#linkTitle"),
    linkUrl: document.querySelector("#linkUrl"),
    linkGroup: document.querySelector("#linkGroup"),
    settingsPanel: document.querySelector("#settingsPanel"),
    commandPalette: document.querySelector("#commandPalette"),
    commandInput: document.querySelector("#commandInput"),
    commandResults: document.querySelector("#commandResults"),
    commandSearchProviderButton: document.querySelector("#commandSearchProviderButton"),
    commandSearchProviderMenu: document.querySelector("#commandSearchProviderMenu"),
    showTodos: document.querySelector("#showTodos"),
    tabManagerGreeting: document.querySelector("#tabManagerGreeting"),
    tabManagerDateDisplay: document.querySelector("#tabManagerDateDisplay"),
    tabOutDupeBanner: document.querySelector("#tabOutDupeBanner"),
    tabOutDupeCount: document.querySelector("#tabOutDupeCount"),
    openTabsSection: document.querySelector("#openTabsSection"),
    openTabsSectionTitle: document.querySelector("#openTabsSectionTitle"),
    openTabsSectionCount: document.querySelector("#openTabsSectionCount"),
    openTabsMissions: document.querySelector("#openTabsMissions"),
    statTabs: document.querySelector("#statTabs"),
    deferredColumn: document.querySelector("#deferredColumn"),
    deferredList: document.querySelector("#deferredList"),
    deferredEmpty: document.querySelector("#deferredEmpty"),
    deferredCount: document.querySelector("#deferredCount"),
    deferredArchive: document.querySelector("#deferredArchive"),
    archiveToggle: document.querySelector("#archiveToggle"),
    archiveBody: document.querySelector("#archiveBody"),
    archiveCount: document.querySelector("#archiveCount"),
    archiveSearch: document.querySelector("#archiveSearch"),
    archiveList: document.querySelector("#archiveList"),
    readingProgress: document.querySelector("#readingProgress"),
    readingReviewCard: document.querySelector("#readingReviewCard"),
    readingWereadSettingsButton: document.querySelector("#readingWereadSettingsButton"),
    readingWereadSyncDrawerBackdrop: document.querySelector("#readingWereadSyncDrawerBackdrop"),
    readingWereadSyncPanel: document.querySelector("#readingWereadSyncPanel"),
    readingWereadSettingsCloseButton: document.querySelector("#readingWereadSettingsCloseButton"),
    readingCopyButton: document.querySelector("#readingCopyButton"),
    readingExportButton: document.querySelector("#readingExportButton"),
    readingPreviousButton: document.querySelector("#readingPreviousButton"),
    readingRandomButton: document.querySelector("#readingRandomButton"),
    readingOpenButton: document.querySelector("#readingOpenButton"),
    readingShareDialog: document.querySelector("#readingShareDialog"),
    readingSharePreview: document.querySelector("#readingSharePreview"),
    readingShareCloseButton: document.querySelector("#readingShareCloseButton"),
    readingShareCancelButton: document.querySelector("#readingShareCancelButton"),
    readingShareDownloadButton: document.querySelector("#readingShareDownloadButton"),
    wereadOpenKeyPageButton: document.querySelector("#wereadOpenKeyPageButton"),
    wereadManualKeyPanel: document.querySelector("#wereadManualKeyPanel"),
    wereadApiKey: document.querySelector("#wereadApiKey"),
    wereadSaveSyncButton: document.querySelector("#wereadSaveSyncButton"),
    wereadSyncNowButton: document.querySelector("#wereadSyncNowButton"),
    wereadClearKeyButton: document.querySelector("#wereadClearKeyButton"),
    wereadClearNotesButton: document.querySelector("#wereadClearNotesButton"),
    wereadSyncStatus: document.querySelector("#wereadSyncStatus"),
    wereadLastSync: document.querySelector("#wereadLastSync"),
    wereadSyncSummary: document.querySelector("#wereadSyncSummary"),
    anniversaryReminderView: document.querySelector("#anniversaryReminderView"),
    anniversaryDateDisplay: document.querySelector("#anniversaryDateDisplay"),
    anniversaryAllButton: document.querySelector("#anniversaryAllButton"),
    anniversaryAddButton: document.querySelector("#anniversaryAddButton"),
    anniversaryShownCount: document.querySelector("#anniversaryShownCount"),
    anniversaryUpcomingList: document.querySelector("#anniversaryUpcomingList"),
    anniversaryTotalCount: document.querySelector("#anniversaryTotalCount"),
    anniversaryUpcomingCount: document.querySelector("#anniversaryUpcomingCount"),
    anniversaryLunarCount: document.querySelector("#anniversaryLunarCount"),
    anniversaryDrawerBackdrop: document.querySelector("#anniversaryDrawerBackdrop"),
    anniversaryDrawer: document.querySelector("#anniversaryDrawer"),
    anniversaryDrawerCloseButton: document.querySelector("#anniversaryDrawerCloseButton"),
    anniversarySearchInput: document.querySelector("#anniversarySearchInput"),
    anniversaryDrawerList: document.querySelector("#anniversaryDrawerList"),
    anniversaryDrawerAddButton: document.querySelector("#anniversaryDrawerAddButton"),
    anniversaryDialog: document.querySelector("#anniversaryDialog"),
    anniversaryForm: document.querySelector("#anniversaryForm"),
    anniversaryDialogTitle: document.querySelector("#anniversaryDialogTitle"),
    anniversaryDialogCloseButton: document.querySelector("#anniversaryDialogCloseButton"),
    anniversaryId: document.querySelector("#anniversaryId"),
    anniversaryTitle: document.querySelector("#anniversaryTitle"),
    anniversaryStartYear: document.querySelector("#anniversaryStartYear"),
    anniversaryCalendarButtons: document.querySelectorAll("[data-anniversary-calendar]"),
    anniversaryLunarFields: document.querySelector("#anniversaryLunarFields"),
    anniversarySolarFields: document.querySelector("#anniversarySolarFields"),
    anniversaryLunarMonth: document.querySelector("#anniversaryLunarMonth"),
    anniversaryLunarDay: document.querySelector("#anniversaryLunarDay"),
    anniversarySolarMonth: document.querySelector("#anniversarySolarMonth"),
    anniversarySolarDay: document.querySelector("#anniversarySolarDay"),
    anniversaryAdvanceDays: document.querySelector("#anniversaryAdvanceDays"),
    anniversaryDeleteButton: document.querySelector("#anniversaryDeleteButton"),
    anniversaryCancelButton: document.querySelector("#anniversaryCancelButton"),
    settingButtons: document.querySelectorAll("[data-setting] button, [data-toggle]"),
    toast: null
  };

  function hasChromeApi(apiName) {
    return typeof chrome !== "undefined" && chrome[apiName];
  }

  function getBrowserLanguage() {
    const language = (navigator.language || "zh-CN").toLowerCase();
    return language.startsWith("en") ? "en" : "zh";
  }

  function getAppLanguage() {
    return state.settings.language === "en" || state.settings.language === "zh"
      ? state.settings.language
      : getBrowserLanguage();
  }

  function getLocaleCode() {
    return getAppLanguage() === "en" ? "en-US" : "zh-CN";
  }

  function t(key, params = {}) {
    const language = getAppLanguage();
    const value = key.split(".").reduce((copy, part) => copy?.[part], i18n[language]) ?? key;
    return String(value).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? "");
  }

  function setText(selector, key) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = t(key);
    }
  }

  function setAttr(selector, attribute, key) {
    const element = document.querySelector(selector);
    if (element) {
      element.setAttribute(attribute, t(key));
    }
  }

  function setFieldLabel(inputSelector, key) {
    const input = document.querySelector(inputSelector);
    const label = input?.closest("label");
    if (!label) {
      return;
    }
    const textNode = Array.from(label.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = `\n            ${t(key)}\n            `;
    }
  }

  function applyLanguage() {
    const language = getAppLanguage();
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.title = t("extensionTitle");

    setAttr(".hero", "aria-label", "newTab");
    setAttr("#focusToggle", "aria-label", "pomodoro");
    setAttr("#noteCreateButton", "aria-label", "newNote");
    setAttr("#todoModuleToggle", "aria-label", "todayTodo");
    setAttr("#musicModuleToggle", "aria-label", "musicBrand");
    setAttr(".pomodoro-modes", "aria-label", "pomodoroMode");
    setAttr("#homePomodoroStart", "aria-label", "startOrPause");
    setAttr("#homePomodoroReset", "aria-label", "reset");
    setText("label[for='globalSearch'] .sr-only, label[for='globalSearch']", "searchLabel");
    setAttr("#globalSearch", "placeholder", state.siteSearch ? "siteSearch" : "searchPlaceholder");
    setText("#siteSearchLabel", state.siteSearch ? "siteSearch" : "siteSearch");
    setAttr("#clearSiteSearch", "aria-label", "exitSiteSearch");
    setAttr("#searchProviderButton", "aria-label", "switchSearchEngine");
    setAttr("#todoHome", "aria-label", "todayTodo");
    setText("label[for='todoInput'] .sr-only, label[for='todoInput']", "addTodo");
    setAttr("#todoInput", "placeholder", "todoPlaceholder");
    setAttr("#todoArchiveButton", "aria-label", "completedTodos");
    setAttr("#musicWidget", "aria-label", "musicBrand");
    setAttr("#quickSites", "aria-label", "customSites");
    setAttr("#notesLayer", "aria-label", "notes");
    setAttr("#weatherEdge", "aria-label", "openWeather");
    setAttr("#weatherDrawer", "aria-label", "weather");
    setText(".weather-drawer-head p", "weather");
    setText("#weatherSummary", "weatherSummary");
    setAttr("#closeWeatherButton", "aria-label", "close");
    setText("label[for='weatherCitySearch'] .sr-only, label[for='weatherCitySearch']", "addRegion");
    setAttr("#weatherCitySearch", "placeholder", "weatherSearchPlaceholder");
    setAttr("#drawerEdge", "aria-label", "openSidebar");
    setAttr("#recentDrawer", "aria-label", "sidebar");
    setAttr("#closeRecentButton", "aria-label", "close");
    setAttr(".drawer-tabs", "aria-label", "sidebarViews");
    document.querySelector("[data-drawer-tab='recent']").textContent = t("recent");
    document.querySelector("[data-drawer-tab='bookmarks']").textContent = t("bookmarks");
    document.querySelector("[data-drawer-tab='settings']").textContent = t("settings");
    setText("#historyPanel h2", "recent");
    setText("#historyPanel .drawer-section-head span", "last72Hours");
    setText("label[for='recentSearch'] .sr-only, label[for='recentSearch']", "recentSearch");
    setAttr("#recentSearch", "placeholder", "recentSearch");
    setText("#bookmarksPanel h2", "bookmarks");
    setText("#bookmarkSummary", "browserBookmarks");
    setText("label[for='bookmarkSearch'] .sr-only, label[for='bookmarkSearch']", "bookmarkSearch");
    setAttr("#bookmarkSearch", "placeholder", "bookmarkSearch");
    setText("#settingsPanel h2", "settings");

    const settingTitles = Array.from(document.querySelectorAll("#settingsPanel .setting-block > p"));
    ["language", "search", "modules", "wallpaper", "appearance", "quote", "sync"].forEach((key, index) => {
      if (settingTitles[index]) settingTitles[index].textContent = t(key);
    });
    const languageButtons = document.querySelectorAll("[data-setting='language'] button");
    if (languageButtons[0]) languageButtons[0].textContent = t("autoLanguage");
    if (languageButtons[1]) languageButtons[1].textContent = t("chinese");
    if (languageButtons[2]) languageButtons[2].textContent = t("english");
    document.querySelector("#showTodos").textContent = t("addTodo").replace(/^添加\s*/, "");
    document.querySelector("#showMusicWidget").textContent = t("music");
    document.querySelector("#showCustomLinks").textContent = t("customSites");
    const themeButtons = document.querySelectorAll("[data-setting='theme'] button");
    if (themeButtons[0]) themeButtons[0].textContent = t("themeLight");
    if (themeButtons[1]) themeButtons[1].textContent = t("themeDark");
    const quoteButtons = document.querySelectorAll("[data-setting='showQuote'] button");
    if (quoteButtons[0]) quoteButtons[0].textContent = language === "en" ? "On" : "开";
    if (quoteButtons[1]) quoteButtons[1].textContent = language === "en" ? "Off" : "关";
    setText(".settings-row > span:first-child", "localFirst");
    setText(".settings-pill", "pending");

    setAttr(".command-menu", "aria-label", "commandPalette");
    setText("label[for='commandInput']", "commandSearch");
    setAttr("#commandInput", "placeholder", "commandPlaceholder");
    setText("#dialogTitle", elements.linkId.value ? "editLink" : "addLink");
    setAttr("#closeDialogButton", "aria-label", "close");
    setAttr("#linkDialogTabs", "aria-label", "addMethod");
    document.querySelector("[data-link-dialog-tab='manual']").textContent = t("manual");
    document.querySelector("[data-link-dialog-tab='popular']").textContent = t("popularSites");
    setFieldLabel("#linkTitle", "name");
    setFieldLabel("#linkUrl", "url");
    setFieldLabel("#linkGroup", "group");
    setAttr("#linkTitle", "placeholder", "namePlaceholder");
    setAttr("#linkGroup", "placeholder", "groupPlaceholder");
    setText("#deleteLinkButton", "delete");
    setText("#cancelDialogButton", "cancel");
    setText("#linkForm .dialog-actions .primary", "save");
    setText("#anniversaryForm .dialog-actions .primary", "save");
    setAttr(".todo-archive-card", "aria-label", "recentCompleted");
    setText(".todo-archive-card h2", "recentCompleted");
    setAttr("#closeTodoArchiveButton", "aria-label", "close");
  }

  async function storageGet(key) {
    const keys = Array.isArray(key) ? key : [key];
    const legacyKeys = keys.map((item) => legacyStorageKeys[item]).filter(Boolean);
    const stored = await storageRead([...keys, ...legacyKeys]);
    const migrationPayload = {};
    const removeKeys = [];

    keys.forEach((item) => {
      const legacyKey = legacyStorageKeys[item];
      if (stored[item] === undefined && legacyKey && stored[legacyKey] !== undefined) {
        stored[item] = stored[legacyKey];
        migrationPayload[item] = stored[legacyKey];
        removeKeys.push(legacyKey);
      }
    });

    if (Object.keys(migrationPayload).length) {
      await storageSet(migrationPayload);
      await storageRemove(removeKeys);
    }

    return Object.fromEntries(keys.map((item) => [item, stored[item]]));
  }

  function storageRead(key) {
    if (hasChromeApi("storage")) {
      return chrome.storage.local.get(key);
    }
    const store = getLocalStorage();
    const keys = Array.isArray(key) ? key : [key];
    const result = {};
    if (!store) {
      keys.forEach((item) => {
        result[item] = memoryStorage[item];
      });
      return Promise.resolve(result);
    }
    keys.forEach((item) => {
      const value = store.getItem(item);
      result[item] = value ? JSON.parse(value) : undefined;
    });
    return Promise.resolve(result);
  }

  function storageSet(payload) {
    if (hasChromeApi("storage")) {
      return chrome.storage.local.set(payload);
    }
    const store = getLocalStorage();
    Object.entries(payload).forEach(([key, value]) => {
      if (store) {
        store.setItem(key, JSON.stringify(value));
      } else {
        memoryStorage[key] = value;
      }
    });
    return Promise.resolve();
  }

  function storageRemove(keys) {
    if (!keys.length) {
      return Promise.resolve();
    }
    if (hasChromeApi("storage") && chrome.storage.local.remove) {
      return chrome.storage.local.remove(keys);
    }
    const store = getLocalStorage();
    keys.forEach((key) => {
      if (store) {
        store.removeItem(key);
      } else {
        delete memoryStorage[key];
      }
    });
    return Promise.resolve();
  }

  function getLocalStorage() {
    try {
      return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
      return null;
    }
  }

  async function loadLinks() {
    const stored = await storageGet(storageKey);
    state.links = Array.isArray(stored[storageKey]) ? stored[storageKey] : defaultLinks;
    if (!stored[storageKey]) {
      await saveLinks();
    }
  }

  async function loadBookmarks() {
    if (!hasChromeApi("bookmarks")) {
      state.bookmarks = [];
      return;
    }
    const tree = await chrome.bookmarks.getTree();
    state.bookmarks = flattenBookmarks(tree).slice(0, 200);
  }

  function flattenBookmarks(nodes, folder = "浏览器") {
    return nodes.flatMap((node) => {
      if (node.url) {
        return [{
          id: `bookmark:${node.id}`,
          bookmarkId: node.id,
          title: node.title || getHost(node.url),
          url: node.url,
          group: folder,
          source: "bookmark"
        }];
      }
      return flattenBookmarks(node.children || [], node.title || folder);
    });
  }

  async function loadHistoryTitleCache() {
    const stored = await storageGet(historyTitleCacheKey);
    state.historyTitleCache = stored[historyTitleCacheKey] || {};
  }

  async function loadFaviconCache() {
    const stored = await storageGet(faviconCacheKey);
    state.faviconCache = stored[faviconCacheKey] || {};
  }

  async function loadSettings() {
    const stored = await storageGet(settingsKey);
    state.settings = { ...defaultSettings, ...(stored[settingsKey] || {}) };
    if (state.settings.theme === "auto" || state.settings.theme === "ink") {
      state.settings.theme = "light";
    }
    if (state.settings.searchEngine && !searchProviders[state.settings.searchEngine]) {
      state.settings.searchEngine = defaultSettings.searchEngine;
    }
    state.settings.searchEngine = "";
    if (!["auto", "zh", "en"].includes(state.settings.language)) {
      state.settings.language = "auto";
    }
    if (!["none", "mist", "dune", "rain", "blue"].includes(state.settings.wallpaper)) {
      state.settings.wallpaper = "none";
    }
    if (typeof state.settings.showQuote !== "boolean") {
      state.settings.showQuote = true;
    }
    if (typeof state.settings.showMusicWidget !== "boolean") {
      state.settings.showMusicWidget = true;
    }
    if (typeof state.settings.showCustomLinks !== "boolean") {
      state.settings.showCustomLinks = true;
    }
  }

  async function loadTodos() {
    const stored = await storageGet(todoStorageKey);
    const saved = stored[todoStorageKey];
    if (saved?.items && Array.isArray(saved.items)) {
      state.todos = {
        schemaVersion: saved.schemaVersion || 1,
        updatedAt: saved.updatedAt || Date.now(),
        items: saved.items
      };
      return;
    }
    state.todos = { schemaVersion: 1, updatedAt: Date.now(), items: [] };
  }

  async function loadNotes() {
    const stored = await storageGet(notesStorageKey);
    const saved = stored[notesStorageKey];
    if (saved?.items && Array.isArray(saved.items)) {
      state.notes = {
        schemaVersion: saved.schemaVersion || 1,
        updatedAt: saved.updatedAt || Date.now(),
        items: saved.items
      };
      return;
    }
    state.notes = { schemaVersion: 1, updatedAt: Date.now(), items: [] };
  }

  async function loadAnniversaries() {
    const stored = await storageGet(anniversaryStorageKey);
    const saved = stored[anniversaryStorageKey];
    if (saved?.items && Array.isArray(saved.items)) {
      state.anniversaries = {
        schemaVersion: saved.schemaVersion || 1,
        updatedAt: saved.updatedAt || Date.now(),
        items: saved.items.filter(isValidAnniversary)
      };
      return;
    }
    state.anniversaries = { schemaVersion: 1, updatedAt: Date.now(), items: [] };
  }

  async function loadWeather() {
    const stored = await storageGet(weatherStorageKey);
    const saved = stored[weatherStorageKey];
    state.weather.cities = Array.isArray(saved?.cities) && saved.cities.length ? saved.cities : [defaultWeatherCity];
    state.weather.reports = saved?.reports || {};
    state.weather.updatedAt = saved?.updatedAt || 0;
    renderWeather();
    await loadWeatherCities();
    renderWeather();
    refreshWeatherIfNeeded();
  }

  async function loadWeatherCities() {
    if (state.weather.cityList.length) {
      return;
    }
    try {
      const response = await fetch(amapCityAsset);
      if (!response.ok) {
        throw new Error(`city list ${response.status}`);
      }
      const data = await response.json();
      state.weather.cityList = Array.isArray(data.items) ? data.items : [];
    } catch {
      state.weather.error = t("cityListUnavailable");
    }
  }

  async function loadPomodoro() {
    const stored = await storageGet(pomodoroStorageKey);
    const saved = stored[pomodoroStorageKey] || {};
    const durations = { ...state.pomodoro.durations, ...(saved.durations || {}) };
    const mode = saved.mode === "break" ? "break" : "focus";
    state.pomodoro = {
      ...state.pomodoro,
      mode,
      running: false,
      durations,
      remaining: Number.isFinite(saved.remaining) ? saved.remaining : durations[mode]
    };
  }

  function saveLinks() {
    return storageSet({ [storageKey]: state.links });
  }

  function saveSettings() {
    return storageSet({ [settingsKey]: state.settings });
  }

  function normalizeWereadSyncState(value = {}) {
    const apiKey = value.apiKey || "";
    const error = value.error || "";
    return {
      hasKey: Boolean(value.hasKey || apiKey),
      maskedKey: value.maskedKey || (apiKey && wereadSyncCore?.maskApiKey ? wereadSyncCore.maskApiKey(apiKey) : ""),
      status: value.status || "idle",
      error: isWereadAuthError(error) ? wereadAuthErrorMessage : error,
      lastSyncedAt: value.lastSyncedAt || "",
      totalBooks: Number(value.totalBooks || 0),
      totalItems: Number(value.totalItems || 0),
      lastReason: value.lastReason || ""
    };
  }

  async function getStoredWereadSyncState() {
    const stored = await storageGet(wereadSyncStorageKey);
    return stored[wereadSyncStorageKey] || {};
  }

  async function setStoredWereadSyncState(patch) {
    const current = await getStoredWereadSyncState();
    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    next.hasKey = Boolean(next.apiKey);
    next.maskedKey = next.apiKey && wereadSyncCore?.maskApiKey ? wereadSyncCore.maskApiKey(next.apiKey) : "";
    await storageSet({ [wereadSyncStorageKey]: next });
    return next;
  }

  async function getLocalWereadStatus() {
    const current = await getStoredWereadSyncState();
    if (current.apiKey && current.error && isWereadAuthError(current.error)) {
      const next = await setStoredWereadSyncState({
        apiKey: "",
        hasKey: false,
        maskedKey: "",
        status: "error",
        error: wereadAuthErrorMessage,
        lastReason: current.lastReason || "auth-error"
      });
      return normalizeWereadSyncState(next);
    }
    return normalizeWereadSyncState(current);
  }

  function isMissingWereadReceiver(error) {
    const message = String(error?.message || error || "");
    return message.includes("Could not establish connection") || message.includes("Receiving end does not exist");
  }

  function isWereadAuthError(error) {
    const message = String(error?.message || error || "");
    return message.includes("HTTP 401") || (message.includes("API Key") && (message.includes("无效") || message.includes("过期") || message.includes("不完整")));
  }

  async function runLocalWereadSync(reason = "manual") {
    if (!wereadSyncCore?.syncWereadNotes || !wereadSyncCore?.writeLocalPayload) {
      return {
        status: "error",
        error: "当前环境不支持微信读书本地同步。",
        lastReason: reason
      };
    }

    if (wereadLocalSyncInFlight) {
      return wereadLocalSyncInFlight;
    }

    wereadLocalSyncInFlight = (async () => {
      const current = await getStoredWereadSyncState();
      if (!current.apiKey) {
        const next = await setStoredWereadSyncState({
          status: "idle",
          error: "微信读书同步尚未配置。",
          lastReason: reason
        });
        return normalizeWereadSyncState(next);
      }

      await setStoredWereadSyncState({
        status: "syncing",
        error: "",
        lastReason: reason
      });

      try {
        const payload = await wereadSyncCore.syncWereadNotes(current.apiKey);
        await wereadSyncCore.writeLocalPayload(payload);
        const next = await setStoredWereadSyncState({
          status: payload.lastSyncStatus || "success",
          error: payload.skippedBooks && payload.skippedBooks.length ? `部分书籍同步失败：${payload.skippedBooks.length} 本` : "",
          lastSyncedAt: payload.generatedAt,
          totalBooks: payload.totalBooks,
          totalItems: payload.totalItems,
          lastReason: reason
        });
        return normalizeWereadSyncState(next);
      } catch (error) {
        const clearKey = isWereadAuthError(error);
        const next = await setStoredWereadSyncState({
          ...(clearKey ? { apiKey: "", hasKey: false, maskedKey: "" } : {}),
          status: "error",
          error: clearKey ? wereadAuthErrorMessage : error?.message || "微信读书同步失败。",
          lastReason: reason
        });
        return normalizeWereadSyncState(next);
      }
    })();

    try {
      return await wereadLocalSyncInFlight;
    } finally {
      wereadLocalSyncInFlight = null;
    }
  }

  async function handleWereadMessageLocally(message) {
    if (message.type === "weread:getStatus") {
      return { ok: true, state: await getLocalWereadStatus() };
    }

    if (message.type === "weread:saveKeyAndSync") {
      const apiKey = String(message.apiKey || "").trim();
      if (!wereadSyncCore?.validateApiKey?.(apiKey)) {
        const next = await setStoredWereadSyncState({
          status: "error",
          error: "微信读书 API Key 格式无效，应以 wrk- 开头并包含完整 key。",
          lastReason: "manual"
        });
        return { ok: true, state: normalizeWereadSyncState(next) };
      }
      await setStoredWereadSyncState({
        apiKey,
        status: "syncing",
        error: "",
        lastReason: "manual"
      });
      return { ok: true, state: await runLocalWereadSync("manual") };
    }

    if (message.type === "weread:openKeyPage") {
      window.open("https://weread.qq.com/r/weread-skills", "_blank", "noopener");
      return { ok: true, state: normalizeWereadSyncState(await getStoredWereadSyncState()) };
    }

    if (message.type === "weread:syncNow") {
      return { ok: true, state: await runLocalWereadSync("manual") };
    }

    if (message.type === "weread:clearKey") {
      const next = await setStoredWereadSyncState({
        apiKey: "",
        hasKey: false,
        maskedKey: "",
        status: "idle",
        error: "",
        lastReason: "clear-key"
      });
      return { ok: true, state: normalizeWereadSyncState(next) };
    }

    if (message.type === "weread:clearNotes") {
      if (!wereadSyncCore?.clearLocalPayload) {
        return { ok: false, error: "当前环境不支持清除微信读书本地笔记。" };
      }
      await wereadSyncCore.clearLocalPayload();
      const next = await setStoredWereadSyncState({
        status: "idle",
        error: "",
        totalBooks: 0,
        totalItems: 0,
        lastSyncedAt: "",
        lastReason: "clear-notes"
      });
      return { ok: true, state: normalizeWereadSyncState(next) };
    }

    return { ok: false, error: "未知的微信读书操作。" };
  }

  async function loadWereadSyncState() {
    await refreshWereadSyncState(false);
  }

  async function refreshWereadSyncState(shouldRender = true) {
    const response = await sendWereadMessage({ type: "weread:getStatus" });
    if (response?.ok && response.state) {
      state.wereadSync = normalizeWereadSyncState(response.state);
    } else {
      state.wereadSync = normalizeWereadSyncState(await getStoredWereadSyncState());
    }
    if (shouldRender) {
      renderWereadSettings();
    }
  }

  async function sendWereadMessage(message) {
    if (hasChromeApi("runtime") && chrome.runtime?.sendMessage) {
      try {
        return await chrome.runtime.sendMessage(message);
      } catch (error) {
        if (isMissingWereadReceiver(error)) {
          return handleWereadMessageLocally(message);
        }
        return {
          ok: false,
          error: error?.message || "微信读书后台服务暂时不可用。"
        };
      }
    }
    return handleWereadMessageLocally(message);
  }

  function saveFaviconCache() {
    return storageSet({ [faviconCacheKey]: state.faviconCache });
  }

  function saveTodos() {
    state.todos.updatedAt = Date.now();
    return storageSet({ [todoStorageKey]: state.todos });
  }

  function saveNotes() {
    state.notes.updatedAt = Date.now();
    return storageSet({ [notesStorageKey]: state.notes });
  }

  function saveAnniversaries() {
    state.anniversaries.updatedAt = Date.now();
    return storageSet({ [anniversaryStorageKey]: state.anniversaries });
  }

  function saveWeather() {
    state.weather.updatedAt = Date.now();
    return storageSet({
      [weatherStorageKey]: {
        schemaVersion: 1,
        updatedAt: state.weather.updatedAt,
        cities: state.weather.cities,
        reports: state.weather.reports
      }
    });
  }

  function savePomodoro() {
    const { mode, remaining, durations } = state.pomodoro;
    return storageSet({ [pomodoroStorageKey]: { schemaVersion: 1, updatedAt: Date.now(), mode, remaining, durations } });
  }

  async function loadQuote() {
    const stored = await storageGet(quoteStorageKey);
    const cached = stored[quoteStorageKey];
    if (cached?.text) {
      state.quote = cached;
    }
    renderQuote();
    await refreshQuoteIfNeeded(true);
  }

  function saveQuote() {
    return storageSet({ [quoteStorageKey]: state.quote });
  }

  function loadHistory() {
    const startTime = Date.now() - 72 * 60 * 60 * 1000;
    if (!hasChromeApi("history")) {
      state.history = mockHistory;
      render();
      return;
    }

    chrome.history.search(
      {
        text: "",
        startTime,
        maxResults: 120
      },
      (items) => {
        state.history = items
          .filter((item) => item.url && !item.url.startsWith("chrome://"))
          .map(withCachedHistoryTitle)
          .sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0));
        render();
        enrichWeChatHistoryTitles();
      }
    );
  }

  function normalizeUrl(value) {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  function getHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  function isWeChatArticle(url) {
    try {
      return new URL(url).hostname === "mp.weixin.qq.com";
    } catch {
      return false;
    }
  }

  function getHistoryCacheKey(url) {
    try {
      const parsed = new URL(url);
      const biz = parsed.searchParams.get("__biz") || "";
      const mid = parsed.searchParams.get("mid") || "";
      const idx = parsed.searchParams.get("idx") || "";
      const sn = parsed.searchParams.get("sn") || "";
      return [parsed.hostname, biz, mid, idx, sn].filter(Boolean).join("|") || url;
    } catch {
      return url;
    }
  }

  function isGenericWeChatTitle(title) {
    return genericWeChatTitles.has((title || "").trim().toLowerCase());
  }

  function withCachedHistoryTitle(item) {
    if (!item.url) {
      return item;
    }
    const cached = state.historyTitleCache[getHistoryCacheKey(item.url)];
    return cached ? { ...item, enhancedTitle: cached.title, enhancedSource: cached.source } : item;
  }

  function getInitial(title, url) {
    const source = title || getHost(url);
    return source.trim().charAt(0).toUpperCase() || "?";
  }

  function categorize(item) {
    const haystack = `${item.title || ""} ${item.url || ""}`.toLowerCase();
    const match = categoryRules.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)));
    return t(`categories.${match ? match.name : "other"}`);
  }

  function groupBy(items, getKey) {
    return items.reduce((groups, item) => {
      const key = getKey(item);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(item);
      return groups;
    }, new Map());
  }

  function matchesQuery(item) {
    return itemMatchesQuery(item, state.query);
  }

  function itemMatchesQuery(item, query) {
    if (!query) {
      return true;
    }
    const haystack = `${getHistoryTitle(item) || ""} ${getHistorySubtitle(item) || ""} ${item.url || ""} ${item.group || ""} ${categorize(item)}`.toLowerCase();
    return haystack.includes((query || "").toLowerCase());
  }

  function getSearchItems(query) {
    const normalizedQuery = (query || "").toLowerCase();
    if (!normalizedQuery) {
      return [];
    }
    const seen = new Set();
    const addKind = (items, kind) => items
      .filter((item) => itemMatchesQuery(item, normalizedQuery))
      .map((item) => ({ ...item, kind }))
      .filter((item) => {
        const key = normalizeComparableUrl(item.url);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return [
      ...addKind(getAllLinks(), t("website")),
      ...addKind(state.history, t("history"))
    ].slice(0, 8);
  }

  function sameHost(url, host) {
    const itemHost = getHost(url).toLowerCase();
    const target = (host || "").toLowerCase();
    return itemHost === target || itemHost.endsWith(`.${target}`) || target.endsWith(`.${itemHost}`);
  }

  function getSiteScopedItems(query) {
    if (!state.siteSearch) {
      return [];
    }
    const normalizedQuery = (query || "").toLowerCase();
    const seen = new Set();
    const addKind = (items, kind) => items
      .filter((item) => item.url && sameHost(item.url, state.siteSearch.host))
      .filter((item) => !normalizedQuery || itemMatchesQuery(item, normalizedQuery))
      .map((item) => ({ ...item, kind }))
      .filter((item) => {
        const key = normalizeComparableUrl(item.url);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return [
      ...addKind(getAllLinks(), t("site")),
      ...addKind(state.history, t("siteHistory"))
    ].slice(0, 10);
  }

  function getSiteSearchCandidate(query) {
    if (state.siteSearch || !query) {
      return null;
    }
    const cleaned = query.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase();
    if (cleaned.length < 2) {
      return null;
    }
    const items = [...getAllLinks(), ...state.history];
    const match = items.find((item) => {
      const host = getHost(item.url).toLowerCase();
      const title = (item.title || getHistoryTitle(item) || "").toLowerCase();
      return host.startsWith(cleaned) || host.includes(cleaned) || title === cleaned;
    });
    if (!match) {
      return null;
    }
    return {
      title: match.title || getHistoryTitle(match) || getHost(match.url),
      host: getHost(match.url),
      url: match.url
    };
  }

  function activateSiteSearch(candidate) {
    if (!candidate) {
      return;
    }
    state.siteSearch = candidate;
    state.query = "";
    state.searchIndex = 0;
    elements.searchInput.value = "";
    elements.searchInput.placeholder = t("siteSearch");
    renderSearchPanel();
    renderSiteSearchPill();
  }

  function clearSiteSearch() {
    state.siteSearch = null;
    state.searchIndex = 0;
    elements.searchInput.placeholder = t("searchPlaceholder");
    renderSiteSearchPill();
    renderSearchPanel();
  }

  function getAllLinks() {
    const bookmarkUrls = new Set(state.bookmarks.map((bookmark) => normalizeComparableUrl(bookmark.url)));
    const customLinks = state.links.map((link) => ({ ...link, source: "custom" }));
    const visibleCustomLinks = customLinks.filter((link) => !bookmarkUrls.has(normalizeComparableUrl(link.url)));
    return [...visibleCustomLinks, ...state.bookmarks];
  }

  function normalizeComparableUrl(url) {
    try {
      const parsed = new URL(url);
      parsed.hash = "";
      return parsed.href.replace(/\/$/, "");
    } catch {
      return url;
    }
  }

  function formatMusicTime(value) {
    if (!Number.isFinite(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function parseLrcTime(raw) {
    const match = /^(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?$/.exec(raw);
    if (!match) return null;
    const fraction = match[3] ? Number(`0.${match[3].padEnd(3, "0").slice(0, 3)}`) : 0;
    return Number(match[1]) * 60 + Number(match[2]) + fraction;
  }

  function isMusicLyricPlaceholder(text = "") {
    return /^[.\u2026…·・。\\-\s]+$/.test(String(text).trim());
  }

  function isMusicLyricMetadata(text = "") {
    return /^\[(?:ti|ar|al|by|offset|length|re|ve):[^\]]*\]$/i.test(String(text).trim());
  }

  function normalizeMusicLyricLines(lines = []) {
    return lines.reduce((normalized, line, index) => {
      const text = String(typeof line === "string" ? line : line?.text || "").trim();
      if (!text || isMusicLyricPlaceholder(text) || isMusicLyricMetadata(text)) {
        return normalized;
      }
      const time = typeof line?.time === "number" ? line.time : undefined;
      normalized.push({
        ...(typeof line === "object" && line ? line : {}),
        id: line?.id || `${index}-${time ?? "plain"}-${text}`,
        text,
        ...(time === undefined ? {} : { time })
      });
      return normalized;
    }, []);
  }

  function parseMusicLyrics(lyrics = "") {
    const lines = [];
    String(lyrics || "").split(/\r?\n/).forEach((rawLine, index) => {
      const trimmed = rawLine.trim();
      if (!trimmed) return;
      const stamps = [...trimmed.matchAll(/\[([0-9]{1,2}:[0-9]{2}(?:[.:][0-9]{1,3})?)\]/g)]
        .map((match) => parseLrcTime(match[1]))
        .filter((value) => value !== null);
      const text = trimmed.replace(/\[[^\]]+\]/g, "").trim();
      if (!text || isMusicLyricPlaceholder(text)) return;
      if (stamps.length) {
        stamps.forEach((stamp) => lines.push({ id: `${index}-${stamp}-${text}`, text, time: stamp }));
        return;
      }
      lines.push({ id: `${index}-${trimmed}`, text: trimmed });
    });
    return lines.sort((a, b) => (a.time ?? Number.MAX_SAFE_INTEGER) - (b.time ?? Number.MAX_SAFE_INTEGER));
  }

  function getActiveMusicLine(lines, time, duration) {
    if (!lines.length) return 0;
    if (lines.some((line) => typeof line.time === "number")) {
      let active = 0;
      lines.forEach((line, index) => {
        if (typeof line.time === "number" && line.time <= time + 0.08) active = index;
      });
      return active;
    }
    return duration ? Math.max(0, Math.min(lines.length - 1, Math.floor((time / duration) * lines.length))) : 0;
  }

  function createElement(tagName, className, textContent) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (textContent !== undefined) {
      element.textContent = textContent;
    }
    return element;
  }

  function showToast(message) {
    if (!elements.toast) {
      elements.toast = createElement("div", "toast");
      elements.toast.setAttribute("role", "status");
      document.body.appendChild(elements.toast);
    }
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    window.clearTimeout(elements.toast._timer);
    elements.toast._timer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 1600);
  }

  function renderMainTabs() {
    document.documentElement.dataset.mainView = state.mainView;
    elements.mainTabButtons.forEach((button) => {
      const active = button.dataset.mainTab === state.mainView;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.mainViews.forEach((view) => {
      view.hidden = view.dataset.mainView !== state.mainView;
    });
  }

  async function loadMainView() {
    const stored = await storageGet(mainViewStorageKey);
    const value = stored[mainViewStorageKey] || "work";
    state.mainView = mainViewNames.includes(value) ? value : "work";
    if (state.mainView === "reading") {
      prepareReadingReviewLoadingState();
    }
    renderMainTabs();
  }

  function saveMainView() {
    return storageSet({ [mainViewStorageKey]: state.mainView });
  }

  async function setMainView(viewName) {
    if (!mainViewNames.includes(viewName) || state.mainView === viewName) {
      return;
    }
    state.mainView = viewName;
    await saveMainView();
    renderMainTabs();
    if (viewName !== "work") {
      closeDrawers();
      closeCommandPalette(false);
    }
    if (viewName === "tabs") {
      await renderTabManager();
    }
    if (viewName === "reading") {
      await loadWereadReviewData();
      renderReadingReview();
    }
    if (viewName === "anniversary") {
      renderAnniversaryReminderView();
    }
  }

  function getTabManagerGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  function getTabManagerDateDisplay() {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date());
  }

  async function fetchOpenTabs() {
    if (!hasChromeApi("tabs")) {
      state.openTabs = [];
      return;
    }
    const extensionId = chrome.runtime?.id || "";
    const newtabUrl = extensionId ? `chrome-extension://${extensionId}/newtab.html` : "";
    const tabs = await chrome.tabs.query({});
    state.openTabs = tabs.map((tab) => ({
      id: tab.id,
      url: tab.url || "",
      title: tab.title || "",
      windowId: tab.windowId,
      active: tab.active,
      isTabOut: tab.url === newtabUrl || tab.url === "chrome://newtab/"
    }));
  }

  function getRealTabs() {
    return state.openTabs.filter((tab) => {
      const url = tab.url || "";
      return !(
        url.startsWith("chrome://") ||
        url.startsWith("chrome-extension://") ||
        url.startsWith("about:") ||
        url.startsWith("edge://") ||
        url.startsWith("brave://")
      );
    });
  }

  async function closeTabsByUrls(urls) {
    if (!hasChromeApi("tabs") || !urls?.length) return;
    const targetHostnames = [];
    const exactUrls = new Set();
    urls.forEach((url) => {
      if (url.startsWith("file://")) {
        exactUrls.add(url);
        return;
      }
      try {
        targetHostnames.push(new URL(url).hostname);
      } catch {}
    });
    const allTabs = await chrome.tabs.query({});
    const tabIds = allTabs
      .filter((tab) => {
        const url = tab.url || "";
        if (url.startsWith("file://") && exactUrls.has(url)) return true;
        try {
          return targetHostnames.includes(new URL(url).hostname);
        } catch {
          return false;
        }
      })
      .map((tab) => tab.id)
      .filter(Boolean);
    if (tabIds.length) {
      await chrome.tabs.remove(tabIds);
    }
    await fetchOpenTabs();
  }

  async function closeTabsExact(urls) {
    if (!hasChromeApi("tabs") || !urls?.length) return;
    const urlSet = new Set(urls);
    const allTabs = await chrome.tabs.query({});
    const tabIds = allTabs.filter((tab) => urlSet.has(tab.url)).map((tab) => tab.id).filter(Boolean);
    if (tabIds.length) {
      await chrome.tabs.remove(tabIds);
    }
    await fetchOpenTabs();
  }

  async function focusTab(url) {
    if (!hasChromeApi("tabs") || !url) return;
    const allTabs = await chrome.tabs.query({});
    const currentWindow = hasChromeApi("windows") ? await chrome.windows.getCurrent() : null;
    let matches = allTabs.filter((tab) => tab.url === url);
    if (!matches.length) {
      try {
        const targetHost = new URL(url).hostname;
        matches = allTabs.filter((tab) => {
          try {
            return new URL(tab.url || "").hostname === targetHost;
          } catch {
            return false;
          }
        });
      } catch {}
    }
    if (!matches.length) return;
    const match = matches.find((tab) => currentWindow && tab.windowId !== currentWindow.id) || matches[0];
    await chrome.tabs.update(match.id, { active: true });
    if (hasChromeApi("windows")) {
      await chrome.windows.update(match.windowId, { focused: true });
    }
  }

  async function closeDuplicateTabs(urls, keepOne = true) {
    if (!hasChromeApi("tabs") || !urls?.length) return;
    const allTabs = await chrome.tabs.query({});
    const tabIds = [];
    urls.forEach((url) => {
      const matching = allTabs.filter((tab) => tab.url === url);
      const keep = keepOne ? (matching.find((tab) => tab.active) || matching[0]) : null;
      matching.forEach((tab) => {
        if (!keep || tab.id !== keep.id) {
          tabIds.push(tab.id);
        }
      });
    });
    if (tabIds.length) {
      await chrome.tabs.remove(tabIds);
    }
    await fetchOpenTabs();
  }

  async function closeTabOutDupes() {
    if (!hasChromeApi("tabs")) return;
    const extensionId = chrome.runtime?.id || "";
    const newtabUrl = extensionId ? `chrome-extension://${extensionId}/newtab.html` : "";
    const allTabs = await chrome.tabs.query({});
    const currentWindow = hasChromeApi("windows") ? await chrome.windows.getCurrent() : null;
    const ownTabs = allTabs.filter((tab) => tab.url === newtabUrl || tab.url === "chrome://newtab/");
    if (ownTabs.length <= 1) return;
    const keep =
      ownTabs.find((tab) => tab.active && currentWindow && tab.windowId === currentWindow.id) ||
      ownTabs.find((tab) => tab.active) ||
      ownTabs[0];
    const tabIds = ownTabs.filter((tab) => tab.id !== keep.id).map((tab) => tab.id).filter(Boolean);
    if (tabIds.length) {
      await chrome.tabs.remove(tabIds);
    }
    await fetchOpenTabs();
  }

  async function saveTabForLater(tab) {
    const stored = await storageGet(deferredStorageKey);
    const deferred = Array.isArray(stored[deferredStorageKey]) ? stored[deferredStorageKey] : [];
    deferred.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      url: tab.url,
      title: tab.title || tab.url,
      savedAt: new Date().toISOString(),
      completed: false,
      dismissed: false
    });
    await storageSet({ [deferredStorageKey]: deferred });
  }

  async function getSavedTabs() {
    const stored = await storageGet(deferredStorageKey);
    const deferred = Array.isArray(stored[deferredStorageKey]) ? stored[deferredStorageKey] : [];
    const visible = deferred.filter((item) => !item.dismissed);
    return {
      active: visible.filter((item) => !item.completed),
      archived: visible.filter((item) => item.completed)
    };
  }

  async function checkOffSavedTab(id) {
    const stored = await storageGet(deferredStorageKey);
    const deferred = Array.isArray(stored[deferredStorageKey]) ? stored[deferredStorageKey] : [];
    const item = deferred.find((tab) => tab.id === id);
    if (item) {
      item.completed = true;
      item.completedAt = new Date().toISOString();
      await storageSet({ [deferredStorageKey]: deferred });
    }
  }

  async function dismissSavedTab(id) {
    const stored = await storageGet(deferredStorageKey);
    const deferred = Array.isArray(stored[deferredStorageKey]) ? stored[deferredStorageKey] : [];
    const item = deferred.find((tab) => tab.id === id);
    if (item) {
      item.dismissed = true;
      await storageSet({ [deferredStorageKey]: deferred });
    }
  }

  function friendlyDomain(hostname) {
    const known = {
      "mail.google.com": "Gmail",
      "docs.google.com": "Google Docs",
      "drive.google.com": "Google Drive",
      "calendar.google.com": "Google Calendar",
      "github.com": "GitHub",
      "www.github.com": "GitHub",
      "youtube.com": "YouTube",
      "www.youtube.com": "YouTube",
      "x.com": "X",
      "twitter.com": "X",
      "chatgpt.com": "ChatGPT",
      "claude.ai": "Claude",
      "notion.so": "Notion",
      "figma.com": "Figma",
      "localhost": "Localhost",
      "local-files": "Local Files"
    };
    if (known[hostname]) return known[hostname];
    return String(hostname || "")
      .replace(/^www\./, "")
      .replace(/\.(com|org|net|io|co|ai|dev|app|so|me|xyz)$/i, "")
      .split(".")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function stripTabTitleNoise(title = "") {
    return String(title)
      .replace(/^\(\d+\+?\)\s*/, "")
      .replace(/\s*\([\d,]+\+?\)\s*/g, " ")
      .replace(/\s*\/\s*X\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanTabTitle(title, hostname) {
    if (!title) return "";
    const friendly = friendlyDomain(hostname).toLowerCase();
    const host = String(hostname || "").replace(/^www\./, "").toLowerCase();
    for (const separator of [" - ", " | ", " — ", " · ", " – "]) {
      const index = title.lastIndexOf(separator);
      if (index === -1) continue;
      const suffix = title.slice(index + separator.length).trim().toLowerCase();
      if (suffix === host || suffix === friendly || host.includes(suffix) || friendly.includes(suffix)) {
        const cleaned = title.slice(0, index).trim();
        if (cleaned.length >= 4) return cleaned;
      }
    }
    return title;
  }

  function smartTabTitle(title, url) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const titleIsUrl = !title || title === url || title.startsWith("http") || title.startsWith(parsed.hostname);
      if (parsed.hostname.includes("github.com") && parts.length >= 2 && titleIsUrl) {
        return `${parts[0]}/${parts[1]}`;
      }
      if ((parsed.hostname === "x.com" || parsed.hostname === "twitter.com") && parts[1] === "status" && titleIsUrl) {
        return `Post by @${parts[0]}`;
      }
    } catch {}
    return title || url;
  }

  function formatAgo(dateString) {
    const then = new Date(dateString);
    const diff = Date.now() - then.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
    if (days === 1) return "yesterday";
    return `${days} days ago`;
  }

  function getLandingPagePatterns() {
    return [
      {
        hostname: "mail.google.com",
        test: (pathname, href) => !href.includes("#inbox/") && !href.includes("#sent/") && !href.includes("#search/")
      },
      { hostname: "x.com", pathExact: ["/home"] },
      { hostname: "www.linkedin.com", pathExact: ["/"] },
      { hostname: "github.com", pathExact: ["/"] },
      { hostname: "www.youtube.com", pathExact: ["/"] }
    ];
  }

  function isLandingPage(url) {
    try {
      const parsed = new URL(url);
      return getLandingPagePatterns().some((pattern) => {
        if (pattern.hostname && parsed.hostname !== pattern.hostname) return false;
        if (pattern.test) return pattern.test(parsed.pathname, url);
        if (pattern.pathExact) return pattern.pathExact.includes(parsed.pathname);
        if (pattern.pathPrefix) return parsed.pathname.startsWith(pattern.pathPrefix);
        return parsed.pathname === "/";
      });
    } catch {
      return false;
    }
  }

  function buildTabGroups(realTabs) {
    const groupMap = new Map();
    const landingTabs = [];
    realTabs.forEach((tab) => {
      try {
        if (isLandingPage(tab.url)) {
          landingTabs.push(tab);
          return;
        }
        const hostname = tab.url.startsWith("file://") ? "local-files" : new URL(tab.url).hostname;
        if (!hostname) return;
        if (!groupMap.has(hostname)) {
          groupMap.set(hostname, { domain: hostname, tabs: [] });
        }
        groupMap.get(hostname).tabs.push(tab);
      } catch {}
    });
    if (landingTabs.length) {
      groupMap.set("__landing-pages__", { domain: "__landing-pages__", tabs: landingTabs });
    }
    const priorityDomains = new Set(getLandingPagePatterns().map((pattern) => pattern.hostname).filter(Boolean));
    return [...groupMap.values()].sort((a, b) => {
      if (a.domain === "__landing-pages__") return -1;
      if (b.domain === "__landing-pages__") return 1;
      const aPriority = priorityDomains.has(a.domain);
      const bPriority = priorityDomains.has(b.domain);
      if (aPriority !== bPriority) return aPriority ? -1 : 1;
      return b.tabs.length - a.tabs.length;
    });
  }

  function getDomainId(domain) {
    return `domain-${String(domain).replace(/[^a-z0-9]/gi, "-")}`;
  }

  function createBadge(label, iconName = "tabs") {
    const badge = createElement("span", "open-tabs-badge");
    badge.append(createIconSvg(iconName), document.createTextNode(label));
    return badge;
  }

  function createTabChip(tab, urlCounts, groupDomain) {
    const chip = createElement("div", `page-chip clickable${urlCounts[tab.url] > 1 ? " chip-has-dupes" : ""}`);
    chip.dataset.tabAction = "focus-tab";
    chip.dataset.tabUrl = tab.url;
    let hostname = "";
    try {
      hostname = new URL(tab.url).hostname;
    } catch {}
    let label = cleanTabTitle(smartTabTitle(stripTabTitleNoise(tab.title), tab.url), groupDomain);
    try {
      const parsed = new URL(tab.url);
      if (parsed.hostname === "localhost" && parsed.port) {
        label = `${parsed.port} ${label}`;
      }
    } catch {}
    chip.title = label || tab.url;

    if (hostname) {
      const favicon = createElement("img", "chip-favicon");
      favicon.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
      favicon.alt = "";
      favicon.addEventListener("error", () => favicon.remove());
      chip.append(favicon);
    }

    chip.append(createElement("span", "chip-text", label || tab.url));
    if (urlCounts[tab.url] > 1) {
      chip.append(createElement("span", "chip-dupe-badge", `(${urlCounts[tab.url]}x)`));
    }
    const actions = createElement("div", "chip-actions");
    const save = createElement("button", "chip-action chip-save");
    save.type = "button";
    save.title = "Save for later";
    save.dataset.tabAction = "defer-single-tab";
    save.dataset.tabUrl = tab.url;
    save.dataset.tabTitle = label || tab.title || tab.url;
    save.append(createIconSvg("bookmark"));
    const close = createElement("button", "chip-action chip-close");
    close.type = "button";
    close.title = "Close this tab";
    close.dataset.tabAction = "close-single-tab";
    close.dataset.tabUrl = tab.url;
    close.append(createIconSvg("close"));
    actions.append(save, close);
    chip.append(actions);
    return chip;
  }

  function renderDomainCard(group) {
    const tabs = group.tabs || [];
    const urlCounts = tabs.reduce((counts, tab) => {
      counts[tab.url] = (counts[tab.url] || 0) + 1;
      return counts;
    }, {});
    const duplicateUrls = Object.entries(urlCounts).filter(([, count]) => count > 1);
    const totalExtras = duplicateUrls.reduce((sum, [, count]) => sum + count - 1, 0);
    const card = createElement("div", `mission-card domain-card${duplicateUrls.length ? " has-amber-bar" : ""}`);
    card.dataset.domainId = getDomainId(group.domain);

    const content = createElement("div", "mission-content");
    const top = createElement("div", "mission-top");
    const name = group.domain === "__landing-pages__" ? "Homepages" : friendlyDomain(group.domain);
    top.append(createElement("span", "mission-name", name), createBadge(`${tabs.length} tab${tabs.length === 1 ? "" : "s"} open`));
    if (duplicateUrls.length) {
      top.append(createBadge(`${totalExtras} duplicate${totalExtras === 1 ? "" : "s"}`, "copy"));
    }

    const pages = createElement("div", "mission-pages");
    const seen = new Set();
    const uniqueTabs = tabs.filter((tab) => {
      if (seen.has(tab.url)) return false;
      seen.add(tab.url);
      return true;
    });
    uniqueTabs.slice(0, 8).forEach((tab) => pages.append(createTabChip(tab, urlCounts, group.domain)));
    if (uniqueTabs.length > 8) {
      const overflow = createElement("div", "page-chips-overflow");
      overflow.hidden = true;
      uniqueTabs.slice(8).forEach((tab) => overflow.append(createTabChip(tab, urlCounts, group.domain)));
      const more = createElement("div", "page-chip page-chip-overflow clickable", `+${uniqueTabs.length - 8} more`);
      more.dataset.tabAction = "expand-chips";
      pages.append(overflow, more);
    }

    const actions = createElement("div", "actions");
    const closeAll = createElement("button", "action-btn close-tabs");
    closeAll.type = "button";
    closeAll.dataset.tabAction = "close-domain-tabs";
    closeAll.dataset.domainId = getDomainId(group.domain);
    closeAll.append(createIconSvg("close"), document.createTextNode(`Close all ${tabs.length}`));
    actions.append(closeAll);
    if (duplicateUrls.length) {
      const dedupe = createElement("button", "action-btn");
      dedupe.type = "button";
      dedupe.dataset.tabAction = "dedup-keep-one";
      dedupe.dataset.dupeUrls = duplicateUrls.map(([url]) => encodeURIComponent(url)).join(",");
      dedupe.textContent = `Close ${totalExtras} duplicate${totalExtras === 1 ? "" : "s"}`;
      actions.append(dedupe);
    }

    content.append(top, pages, actions);
    card.append(content);
    return card;
  }

  function renderEmptyTabsState() {
    const empty = createElement("div", "missions-empty-state");
    empty.append(
      createElement("div", "empty-title", "Inbox zero, but for tabs."),
      createElement("div", "empty-subtitle", "You're free.")
    );
    return empty;
  }

  async function renderDeferredColumn() {
    if (!elements.deferredColumn) return;
    const { active, archived } = await getSavedTabs();
    const hasItems = active.length || archived.length;
    elements.deferredColumn.hidden = !hasItems;
    if (!hasItems) return;

    elements.deferredList.replaceChildren();
    elements.deferredEmpty.hidden = Boolean(active.length);
    elements.deferredList.hidden = !active.length;
    elements.deferredCount.textContent = active.length ? `${active.length} item${active.length === 1 ? "" : "s"}` : "";
    active.forEach((item) => elements.deferredList.append(renderDeferredItem(item)));

    elements.deferredArchive.hidden = !archived.length;
    elements.archiveCount.textContent = archived.length ? `(${archived.length})` : "";
    elements.archiveList.replaceChildren();
    archived.forEach((item) => elements.archiveList.append(renderArchiveItem(item)));
  }

  function renderDeferredItem(item) {
    const row = createElement("div", "deferred-item");
    row.dataset.deferredId = item.id;
    const check = createElement("input", "deferred-checkbox");
    check.type = "checkbox";
    check.dataset.tabAction = "check-deferred";
    check.dataset.deferredId = item.id;
    const info = createElement("div", "deferred-info");
    const link = createElement("a", "deferred-title", item.title || item.url);
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener";
    const meta = createElement("div", "deferred-meta");
    meta.append(createElement("span", "", getHost(item.url)), createElement("span", "", formatAgo(item.savedAt)));
    info.append(link, meta);
    const dismiss = createElement("button", "deferred-dismiss");
    dismiss.type = "button";
    dismiss.title = "Dismiss";
    dismiss.dataset.tabAction = "dismiss-deferred";
    dismiss.dataset.deferredId = item.id;
    dismiss.append(createIconSvg("close"));
    row.append(check, info, dismiss);
    return row;
  }

  function renderArchiveItem(item) {
    const row = createElement("div", "archive-item");
    const link = createElement("a", "archive-item-title", item.title || item.url);
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener";
    const date = createElement("span", "archive-item-date", formatAgo(item.completedAt || item.savedAt));
    row.append(link, date);
    return row;
  }

  async function renderTabManager() {
    if (!elements.tabManagerView) return;
    elements.tabManagerGreeting.textContent = getTabManagerGreeting();
    elements.tabManagerDateDisplay.textContent = getTabManagerDateDisplay();
    await fetchOpenTabs();
    const realTabs = getRealTabs();
    state.domainGroups = buildTabGroups(realTabs);

    const ownTabs = state.openTabs.filter((tab) => tab.isTabOut);
    if (ownTabs.length > 1) {
      elements.tabOutDupeCount.textContent = String(ownTabs.length);
      elements.tabOutDupeBanner.hidden = false;
    } else {
      elements.tabOutDupeBanner.hidden = true;
    }

    elements.statTabs.textContent = String(state.openTabs.length);
    elements.openTabsMissions.replaceChildren();
    if (state.domainGroups.length) {
      elements.openTabsSection.hidden = false;
      elements.openTabsSectionTitle.textContent = "Open tabs";
      elements.openTabsSectionCount.replaceChildren(
        document.createTextNode(`${state.domainGroups.length} domain${state.domainGroups.length === 1 ? "" : "s"} · `)
      );
      const closeAll = createElement("button", "action-btn close-tabs");
      closeAll.type = "button";
      closeAll.dataset.tabAction = "close-all-open-tabs";
      closeAll.append(createIconSvg("close"), document.createTextNode(`Close all ${realTabs.length} tabs`));
      elements.openTabsSectionCount.append(closeAll);
      state.domainGroups.forEach((group) => elements.openTabsMissions.append(renderDomainCard(group)));
    } else {
      elements.openTabsSection.hidden = false;
      elements.openTabsSectionTitle.textContent = "Open tabs";
      elements.openTabsSectionCount.textContent = "0 domains";
      elements.openTabsMissions.append(renderEmptyTabsState());
    }
    await renderDeferredColumn();
  }

  async function handleTabManagerAction(event) {
    const actionElement = event.target.closest("[data-tab-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.tabAction;
    const card = actionElement.closest(".mission-card");
    if (action === "expand-chips") {
      const overflow = actionElement.parentElement?.querySelector(".page-chips-overflow");
      if (overflow) {
        overflow.hidden = false;
        actionElement.remove();
      }
      return;
    }
    if (action === "focus-tab") {
      await focusTab(actionElement.dataset.tabUrl);
      return;
    }
    if (action === "close-single-tab") {
      event.stopPropagation();
      await closeTabsExact([actionElement.dataset.tabUrl]);
      showToast("Tab closed");
      await renderTabManager();
      return;
    }
    if (action === "defer-single-tab") {
      event.stopPropagation();
      await saveTabForLater({ url: actionElement.dataset.tabUrl, title: actionElement.dataset.tabTitle });
      await closeTabsExact([actionElement.dataset.tabUrl]);
      showToast("Saved for later");
      await renderTabManager();
      return;
    }
    if (action === "check-deferred") {
      await checkOffSavedTab(actionElement.dataset.deferredId);
      await renderDeferredColumn();
      return;
    }
    if (action === "dismiss-deferred") {
      await dismissSavedTab(actionElement.dataset.deferredId);
      await renderDeferredColumn();
      return;
    }
    if (action === "close-tabout-dupes") {
      await closeTabOutDupes();
      showToast("Closed extra new tabs");
      await renderTabManager();
      return;
    }
    if (action === "close-domain-tabs") {
      const group = state.domainGroups.find((item) => getDomainId(item.domain) === actionElement.dataset.domainId);
      if (!group) return;
      const urls = group.tabs.map((tab) => tab.url);
      if (group.domain === "__landing-pages__") {
        await closeTabsExact(urls);
      } else {
        await closeTabsByUrls(urls);
      }
      card?.classList.add("closing");
      showToast(`Closed ${urls.length} tab${urls.length === 1 ? "" : "s"}`);
      await renderTabManager();
      return;
    }
    if (action === "dedup-keep-one") {
      const urls = (actionElement.dataset.dupeUrls || "").split(",").map((url) => decodeURIComponent(url)).filter(Boolean);
      await closeDuplicateTabs(urls, true);
      showToast("Closed duplicates");
      await renderTabManager();
      return;
    }
    if (action === "close-all-open-tabs") {
      await closeTabsExact(getRealTabs().map((tab) => tab.url));
      showToast("All tabs closed");
      await renderTabManager();
    }
  }

  async function filterArchiveItems() {
    if (!elements.archiveSearch || !elements.archiveList) return;
    const query = elements.archiveSearch.value.trim().toLowerCase();
    const { archived } = await getSavedTabs();
    const results = query.length < 2
      ? archived
      : archived.filter((item) => `${item.title || ""} ${item.url || ""}`.toLowerCase().includes(query));
    elements.archiveList.replaceChildren();
    results.forEach((item) => elements.archiveList.append(renderArchiveItem(item)));
  }

  function firstWereadText(...values) {
    return values.map((value) => cleanText(value)).find(Boolean) || "";
  }

  function isWereadMpItem(item = {}) {
    const bookId = String(item.bookId || item.book?.bookId || "");
    const author = cleanText(item.bookAuthor || item.author || item.book?.author || "");
    return bookId.startsWith("MP_") || author === "公众号";
  }

  function isGenericWereadBookName(title) {
    return genericWereadBookNames.has(cleanText(title).toLowerCase());
  }

  function getWereadArticleTitle(item = {}) {
    const bookTitle = firstWereadText(item.bookName, item.book?.title);
    return [
      item.articleTitle,
      item.mpArticleTitle,
      item.refMpInfo?.title,
      item.mpInfo?.title,
      item.book?.articleTitle,
      item.book?.chapterTitle,
      item.chapterTitle,
      item.chapterName,
      item.title,
      item.book?.title
    ]
      .map((value) => cleanText(value))
      .find((title) => title && title !== bookTitle && !isGenericWereadBookName(title)) || "";
  }

  function getWereadDisplayBookName(item = {}) {
    const bookTitle = firstWereadText(item.bookName, item.title, item.book?.title);
    if (isWereadMpItem(item)) {
      return getWereadArticleTitle(item) || (isGenericWereadBookName(bookTitle) ? "公众号文章" : bookTitle);
    }
    return bookTitle || "未命名书籍";
  }

  function getWereadDisplayChapterName(item = {}, bookName = "") {
    const chapterName = firstWereadText(item.chapterName, item.chapterTitle);
    if (isWereadMpItem(item) && chapterName === bookName) return "";
    return chapterName;
  }

  function getWereadSourceName(item = {}, bookName = "") {
    const sourceName = firstWereadText(item.sourceName, item.mpName);
    if (sourceName && sourceName !== bookName && !isGenericWereadBookName(sourceName)) return sourceName;
    return firstWereadText(item.bookAuthor, item.author, item.book?.author);
  }

  function normalizeWereadItems(items = []) {
    return items
      .map((item, index) => {
        const bookName = getWereadDisplayBookName(item);
        const chapterName = getWereadDisplayChapterName(item, bookName);
        const sourceName = getWereadSourceName(item, bookName);
        return {
          id: item.id || item.bookmarkId || item.reviewId || `${item.bookId || "book"}-${index}`,
          bookId: item.bookId || "",
          bookName,
          bookAuthor: firstWereadText(item.bookAuthor, item.author, item.book?.author),
          sourceName,
          articleTitle: getWereadArticleTitle(item),
          chapterUid: item.chapterUid || "",
          chapterName,
          markText: cleanText(item.markText || item.abstract || item.text || ""),
          noteContent: cleanText(item.noteContent || item.content || item.reviewContent || ""),
          noteTime: Number(item.noteTime || item.createTime || item.updateTime || 0),
          range: item.range || "",
          deepLink: item.deepLink || buildWereadDeepLink(item)
        };
      })
      .filter((item) => item.bookName && (item.markText || item.noteContent));
  }

  function buildWereadDeepLink(item) {
    if (!item.bookId) return "";
    const range = String(item.range || "");
    const [rangeStart, rangeEnd] = range.split("-");
    if (item.chapterUid && rangeStart && rangeEnd) {
      return `weread://bestbookmark?bookId=${encodeURIComponent(item.bookId)}&chapterUid=${encodeURIComponent(item.chapterUid)}&rangeStart=${encodeURIComponent(rangeStart)}&rangeEnd=${encodeURIComponent(rangeEnd)}`;
    }
    return `weread://reading?bId=${encodeURIComponent(item.bookId)}`;
  }

  async function loadSyncedWereadReviewData() {
    if (!wereadSyncCore?.readLocalPayload) {
      return null;
    }
    try {
      const payload = await wereadSyncCore.readLocalPayload();
      if (!payload || !Array.isArray(payload.items)) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  async function loadWereadReviewData(force = false) {
    if (state.readingReview.loaded && !force) return;
    prepareReadingReviewLoadingState();
    try {
      const syncedData = await loadSyncedWereadReviewData();
      if (syncedData) {
        state.readingReview.items = normalizeWereadItems(syncedData.items || []);
        state.readingReview.metadata = syncedData;
        state.readingReview.activeIndex = getInitialReadingReviewIndex(state.readingReview.items);
        state.readingReview.history = [];
        state.readingReview.loaded = true;
        return;
      }

      state.readingReview.items = [];
      state.readingReview.metadata = null;
      state.readingReview.activeIndex = getInitialReadingReviewIndex(state.readingReview.items);
      state.readingReview.history = [];
      state.readingReview.loaded = true;
    } catch {
      state.readingReview.error = "读取本机同步数据失败。";
      state.readingReview.items = [];
    } finally {
      state.readingReview.loading = false;
    }
  }

  function prepareReadingReviewLoadingState() {
    state.readingReview.loading = true;
    state.readingReview.error = "";
    renderReadingReview();
  }

  function getInitialReadingReviewIndex(items) {
    return items.length ? Math.floor(Math.random() * items.length) : 0;
  }

  function getActiveReadingItem() {
    return state.readingReview.items[state.readingReview.activeIndex] || null;
  }

  function formatWereadDate(timestamp) {
    if (!timestamp) return "";
    const milliseconds = timestamp > 9999999999 ? timestamp : timestamp * 1000;
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(milliseconds));
  }

  function renderReadingReview() {
    if (!elements.readingReviewCard) return;
    const { items, loading, error, activeIndex } = state.readingReview;
    elements.readingProgress.textContent = items.length ? `${activeIndex + 1} / ${items.length}` : "0 / 0";
    elements.readingReviewCard.replaceChildren();
    const active = getActiveReadingItem();
    elements.readingPreviousButton.disabled = state.readingReview.history.length === 0;
    elements.readingCopyButton.disabled = !active;
    elements.readingExportButton.disabled = !active;
    elements.readingRandomButton.disabled = loading || items.length === 0;
    elements.readingOpenButton.hidden = !active?.deepLink;
    elements.readingOpenButton.href = active?.deepLink || "#";

    if (loading) {
      elements.readingReviewCard.append(createReadingEmpty("正在载入本地笔记", "正在读取本机同步数据。"));
      return;
    }
    if (!active) {
      elements.readingReviewCard.append(createReadingEmpty("暂无本地笔记", error || "点击右上角「同步设置」配置微信读书 API Key，同步后这里会显示你的划线和想法。"));
      return;
    }

    const meta = createElement("div", "reading-book-meta");
    meta.append(createElement("span", "reading-book-title", `《${active.bookName}》`));
    if (active.sourceName) meta.append(createElement("span", "", active.sourceName));
    if (active.chapterName) meta.append(createElement("span", "", active.chapterName));

    const quote = createElement("blockquote", "reading-mark", active.markText || active.noteContent);
    elements.readingReviewCard.append(meta, quote);
    if (active.markText && active.noteContent) {
      elements.readingReviewCard.append(createElement("p", "reading-note", active.noteContent));
    }
    const footer = createElement("div", "reading-card-footer");
    footer.append(
      createElement("span", "", active.chapterName || active.sourceName || "微信读书"),
      createElement("span", "", formatWereadDate(active.noteTime))
    );
    elements.readingReviewCard.append(footer);
  }

  function formatWereadSyncDate(value) {
    if (!value) return "尚未同步";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "尚未同步";
    return new Intl.DateTimeFormat(getLocaleCode(), {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function getWereadSyncStatusText() {
    const sync = state.wereadSync;
    if (sync.status === "syncing") return "正在同步微信读书笔记";
    if (sync.status === "success") return "同步完成";
    if (sync.status === "partial") return sync.error || "部分书籍同步失败";
    if (sync.status === "error") return sync.error || "同步失败";
    if (sync.error) return sync.error;
    return sync.hasKey ? "已保存 key，等待同步" : "未配置微信读书同步";
  }

  function renderWereadSettings() {
    if (!elements.wereadSyncStatus) return;
    const sync = state.wereadSync;
    const syncing = sync.status === "syncing";
    elements.wereadSyncStatus.textContent = getWereadSyncStatusText();
    elements.wereadLastSync.textContent = `上次同步：${formatWereadSyncDate(sync.lastSyncedAt)}`;
    elements.wereadSyncSummary.textContent = sync.hasKey
      ? `${sync.totalBooks || 0} 本书 · ${sync.totalItems || 0} 条笔记${sync.maskedKey ? ` · ${sync.maskedKey}` : ""}`
      : "复制 Key 后粘贴到这里并同步";
    if (elements.wereadApiKey && document.activeElement !== elements.wereadApiKey) {
      elements.wereadApiKey.placeholder = sync.maskedKey || "wrk-...";
    }
    elements.wereadOpenKeyPageButton.disabled = syncing;
    elements.wereadSaveSyncButton.disabled = syncing;
    elements.wereadSyncNowButton.disabled = syncing || !sync.hasKey;
    elements.wereadClearKeyButton.disabled = syncing || !sync.hasKey;
    elements.wereadClearNotesButton.disabled = syncing;
  }

  async function applyWereadResponse(response, { reloadReading = false } = {}) {
    if (response?.ok && response.state) {
      state.wereadSync = normalizeWereadSyncState(response.state);
    } else {
      state.wereadSync = {
        ...state.wereadSync,
        status: "error",
        error: response?.error || "微信读书操作失败。"
      };
    }
    renderWereadSettings();
    if (reloadReading) {
      state.readingReview.loaded = false;
      await loadWereadReviewData(true);
      renderReadingReview();
    }
  }

  async function handleWereadOpenKeyPage(event) {
    event.preventDefault();
    const response = await sendWereadMessage({ type: "weread:openKeyPage" });
    if (!response?.ok) {
      state.wereadSync = {
        ...state.wereadSync,
        status: "error",
        error: response?.error || "无法打开微信读书官方页面。"
      };
      renderWereadSettings();
      return;
    }
    window.requestAnimationFrame(() => elements.wereadApiKey?.focus());
  }

  async function handleWereadSaveAndSync(event) {
    event.preventDefault();
    const apiKey = elements.wereadApiKey.value.trim();
    if (!wereadSyncCore?.validateApiKey?.(apiKey)) {
      state.wereadSync = {
        ...state.wereadSync,
        status: "error",
        error: "微信读书 API Key 格式无效，应以 wrk- 开头并包含完整 key。"
      };
      renderWereadSettings();
      return;
    }
    state.wereadSync = { ...state.wereadSync, status: "syncing", error: "" };
    renderWereadSettings();
    const response = await sendWereadMessage({ type: "weread:saveKeyAndSync", apiKey });
    elements.wereadApiKey.value = "";
    await applyWereadResponse(response, { reloadReading: response?.ok });
  }

  async function handleWereadSyncNow(event) {
    event.preventDefault();
    state.wereadSync = { ...state.wereadSync, status: "syncing", error: "" };
    renderWereadSettings();
    const response = await sendWereadMessage({ type: "weread:syncNow" });
    await applyWereadResponse(response, { reloadReading: response?.ok });
  }

  async function handleWereadClearKey(event) {
    event.preventDefault();
    const response = await sendWereadMessage({ type: "weread:clearKey" });
    elements.wereadApiKey.value = "";
    await applyWereadResponse(response);
  }

  async function handleWereadClearNotes(event) {
    event.preventDefault();
    const response = await sendWereadMessage({ type: "weread:clearNotes" });
    await applyWereadResponse(response, { reloadReading: true });
  }

  function openWereadSyncSettings() {
    if (elements.readingWereadSyncDrawerBackdrop) {
      elements.readingWereadSyncDrawerBackdrop.hidden = false;
    }
    elements.readingWereadSyncPanel?.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => {
      elements.wereadOpenKeyPageButton?.focus();
    });
  }

  function closeWereadSyncSettings() {
    if (elements.readingWereadSyncDrawerBackdrop) {
      elements.readingWereadSyncDrawerBackdrop.hidden = true;
    }
    elements.readingWereadSyncPanel?.setAttribute("aria-hidden", "true");
  }

  function createReadingEmpty(title, copy) {
    const empty = createElement("div", "reading-empty");
    empty.append(createElement("h2", "", title), createElement("p", "", copy));
    return empty;
  }

  function showRandomReadingReview() {
    const { items } = state.readingReview;
    if (!items.length) return;
    const current = state.readingReview.activeIndex;
    let next = current;
    if (items.length > 1) {
      while (next === current) {
        next = Math.floor(Math.random() * items.length);
      }
      state.readingReview.history.push(current);
    }
    state.readingReview.activeIndex = next;
    renderReadingReview();
  }

  function showPreviousReadingReview() {
    const previous = state.readingReview.history.pop();
    if (previous === undefined) return;
    state.readingReview.activeIndex = previous;
    renderReadingReview();
  }

  async function copyActiveReadingReview() {
    const item = getActiveReadingItem();
    if (!item) return;
    const source = item.sourceName || item.bookAuthor;
    const text = `《${item.bookName}》${source ? ` / ${source}` : ""}\n${item.markText || ""}${item.noteContent ? `\n\n想法：${item.noteContent}` : ""}`;
    try {
      await navigator.clipboard.writeText(text.trim());
      showToast("已复制读书笔记");
    } catch {
      showToast("复制失败");
    }
  }

  const readingShareHierarchy = Object.freeze({
    quote: 1,
    note: 2,
    bookMeta: 3,
    brand: 4
  });
  const readingShareHeightRange = Object.freeze({
    min: 760,
    max: 1440,
    bottomPadding: 156
  });

  function withCanvasTextStyle(context, { font, fillStyle, textAlign = "left", textBaseline = "alphabetic" }) {
    context.font = font;
    context.fillStyle = fillStyle;
    context.textAlign = textAlign;
    context.textBaseline = textBaseline;
  }

  function drawCanvasTextBlock(context, text, x, y, maxWidth, lineHeight, maxLines) {
    const normalized = cleanText(text);
    if (!normalized) return y;

    const characters = Array.from(normalized);
    const lines = [];
    let line = "";
    let truncated = false;

    for (const character of characters) {
      const nextLine = `${line}${character}`;
      if (!line || context.measureText(nextLine).width <= maxWidth) {
        line = nextLine;
        continue;
      }

      lines.push(line.trimEnd());
      line = character.trimStart();
      if (lines.length === maxLines) {
        truncated = true;
        break;
      }
    }

    if (!truncated && line && lines.length < maxLines) {
      lines.push(line.trimEnd());
    }

    if (truncated && lines.length) {
      const lastIndex = lines.length - 1;
      let lastLine = lines[lastIndex].trimEnd();
      while (lastLine && context.measureText(`${lastLine}…`).width > maxWidth) {
        lastLine = Array.from(lastLine).slice(0, -1).join("");
      }
      lines[lastIndex] = `${lastLine}…`;
    }

    lines.forEach((lineText, index) => {
      context.fillText(lineText, x, y + index * lineHeight);
    });

    return y + lines.length * lineHeight;
  }

  function fillRoundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.fill();
  }

  function strokeRoundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    context.stroke();
  }

  function getReadingShareCanvasHeight(contentBottom) {
    return Math.max(
      readingShareHeightRange.min,
      Math.min(readingShareHeightRange.max, Math.ceil(contentBottom + readingShareHeightRange.bottomPadding))
    );
  }

  function createReadingShareCanvas(item) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = readingShareHeightRange.max;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is unavailable.");
    }

    const paper = "#fbfaf7";
    const ink = "#171410";
    const muted = "#8b8178";
    const quiet = "#d9d1c7";
    const accent = "#c8713a";
    const left = 142;
    const right = 938;
    const contentWidth = right - left;
    const date = formatWereadDate(item.noteTime);
    const quoteText = item.markText || item.noteContent;
    const quoteLength = Array.from(cleanText(quoteText)).length;
    const quoteFontSize = quoteLength > 170 ? 39 : quoteLength > 92 ? 44 : 52;
    const quoteLineHeight = Math.round(quoteFontSize * 1.72);
    const quoteMaxLines = item.noteContent && item.markText
      ? Math.max(5, Math.floor(620 / quoteLineHeight))
      : Math.max(7, Math.floor(760 / quoteLineHeight));

    context.fillStyle = paper;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(200, 113, 58, 0.055)";
    context.fillRect(0, 0, canvas.width, 12);

    withCanvasTextStyle(context, {
      font: "700 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fillStyle: accent
    });
    context.fillText("微信读书划线", left, 132);

    if (date) {
      withCanvasTextStyle(context, {
        font: "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fillStyle: muted,
        textAlign: "right"
      });
      context.fillText(date, right, 132);
      context.textAlign = "left";
    }

    withCanvasTextStyle(context, {
      font: "600 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif",
      fillStyle: ink
    });
    const titleBottom = drawCanvasTextBlock(context, `《${item.bookName}》`, left, 208, contentWidth, 46, 2);

    const detail = [item.sourceName || item.bookAuthor, item.chapterName].filter(Boolean).join(" · ");
    if (detail) {
      withCanvasTextStyle(context, {
        font: "500 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fillStyle: muted
      });
      drawCanvasTextBlock(context, detail, left, titleBottom + 20, contentWidth, 34, 2);
    }

    context.fillStyle = quiet;
    context.fillRect(left, 318, 196, 2);

    withCanvasTextStyle(context, {
      font: "700 132px Georgia, 'Times New Roman', 'Songti SC', serif",
      fillStyle: "rgba(200, 113, 58, 0.12)"
    });
    context.fillText("“", left - 28, 444);

    withCanvasTextStyle(context, {
      font: `500 ${quoteFontSize}px Georgia, 'Times New Roman', 'Songti SC', serif`,
      fillStyle: ink
    });
    let y = drawCanvasTextBlock(context, quoteText, left + 24, 420, contentWidth - 48, quoteLineHeight, quoteMaxLines);
    let contentBottom = y;

    if (item.noteContent && item.markText) {
      y += 70;
      const noteTop = y;

      withCanvasTextStyle(context, {
        font: "700 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fillStyle: accent
      });
      context.fillText("我的想法", left + 28, noteTop);

      withCanvasTextStyle(context, {
        font: "400 31px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif",
        fillStyle: "#3a332d"
      });
      const noteBottom = drawCanvasTextBlock(context, item.noteContent, left + 28, noteTop + 54, contentWidth - 48, 50, 3);

      context.strokeStyle = accent;
      context.lineWidth = 5;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(left, noteTop - 24);
      context.lineTo(left, noteBottom - 12);
      context.stroke();
      contentBottom = noteBottom;
    }

    const finalHeight = getReadingShareCanvasHeight(contentBottom);

    const brandColor = readingShareHierarchy.brand === 4 ? "#aca49b" : muted;
    withCanvasTextStyle(context, {
      font: "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fillStyle: brandColor
    });
    context.fillText("OhMyTab", left, finalHeight - 68);

    if (finalHeight === canvas.height) {
      return canvas;
    }

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = canvas.width;
    croppedCanvas.height = finalHeight;
    const croppedContext = croppedCanvas.getContext("2d");
    if (!croppedContext) {
      return canvas;
    }
    croppedContext.drawImage(canvas, 0, 0, canvas.width, finalHeight, 0, 0, canvas.width, finalHeight);
    return croppedCanvas;
  }

  function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("PNG export failed."));
        }
      }, "image/png");
    });
  }

  function getReadingShareFilename(item) {
    const title = String(item.bookName || "weread")
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 36) || "weread";
    const date = formatWereadDate(item.noteTime).replace(/\//g, "-") || "note";
    return `weread-${title}-${date}.png`;
  }

  function clearReadingSharePreview() {
    const preview = state.readingReview.sharePreview;
    if (preview.url) {
      URL.revokeObjectURL(preview.url);
    }
    state.readingReview.sharePreview = { url: "", filename: "", blob: null };
    if (elements.readingSharePreview) {
      elements.readingSharePreview.removeAttribute("src");
    }
    if (elements.readingShareDownloadButton) {
      elements.readingShareDownloadButton.disabled = true;
    }
  }

  function openReadingSharePreview({ blob, filename }) {
    clearReadingSharePreview();
    const url = URL.createObjectURL(blob);
    state.readingReview.sharePreview = { url, filename, blob };
    elements.readingSharePreview.src = url;
    elements.readingShareDownloadButton.disabled = false;
    if (!elements.readingShareDialog.open) {
      elements.readingShareDialog.showModal();
    }
  }

  function closeReadingSharePreview() {
    if (elements.readingShareDialog.open) {
      elements.readingShareDialog.close();
    }
    clearReadingSharePreview();
  }

  function downloadReadingSharePreview() {
    const preview = state.readingReview.sharePreview;
    if (!preview.url || !preview.blob) {
      showToast("暂无可下载的预览图");
      return;
    }
    const link = document.createElement("a");
    link.href = preview.url;
    link.download = preview.filename || "weread-note.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("分享图已下载");
    if (elements.readingShareDialog.open) {
      elements.readingShareDialog.close();
    }
    window.setTimeout(clearReadingSharePreview, 1200);
  }

  async function exportActiveReadingShareImage() {
    const item = getActiveReadingItem();
    if (!item) {
      showToast("暂无可导出的笔记");
      return;
    }

    const button = elements.readingExportButton;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "生成中";

    try {
      const canvas = createReadingShareCanvas(item);
      const blob = await canvasToPngBlob(canvas);
      openReadingSharePreview({
        blob,
        filename: getReadingShareFilename(item)
      });
    } catch (error) {
      console.warn("[ohmytab] Reading share image export failed:", error);
      showToast("导出失败");
    } finally {
      button.textContent = originalText;
      button.disabled = !getActiveReadingItem();
    }
  }

  function isValidAnniversary(item) {
    if (!item || !String(item.title || "").trim()) {
      return false;
    }
    if (item.calendar === "lunar") {
      return Number.isFinite(Number(item.lunarMonth)) && Number.isFinite(Number(item.lunarDay));
    }
    if (item.calendar === "solar") {
      return Number.isFinite(Number(item.solarMonth)) && Number.isFinite(Number(item.solarDay));
    }
    if (item.calendar === "nthWeekday") {
      return (
        Number.isFinite(Number(item.solarMonth)) &&
        Number.isFinite(Number(item.nth)) &&
        Number.isFinite(Number(item.weekday))
      );
    }
    return false;
  }

  function getAnniversaryItems() {
    return [...builtinAnniversaries, ...state.anniversaries.items];
  }

  function getAnniversaryOccurrences(limit = 3) {
    if (!anniversaryUtils?.getUpcomingAnniversaryOccurrences) {
      return [];
    }
    return anniversaryUtils.getUpcomingAnniversaryOccurrences(getAnniversaryItems(), new Date(), limit);
  }

  function getAllAnniversaryOccurrences() {
    return getAnniversaryOccurrences(Math.max(getAnniversaryItems().length, 1));
  }

  function getAnniversaryCalendarLabel(item) {
    return item.calendar === "lunar" ? "农历" : "公历";
  }

  function getAnniversaryDaysLabel(daysUntil) {
    if (daysUntil === 0) return "今天";
    if (daysUntil === 1) return "明天";
    return `${daysUntil} 天后`;
  }

  function getAnniversaryYearText(item) {
    if (!item.anniversaryYearLabel) {
      return "";
    }
    const startYear = Number(item.startYear);
    return Number.isInteger(startYear) && startYear > 0
      ? `${startYear} 年起 · ${item.anniversaryYearLabel}`
      : item.anniversaryYearLabel;
  }

  function renderAnniversaryReminderView() {
    if (!elements.anniversaryUpcomingList) {
      return;
    }
    const today = new Date();
    elements.anniversaryDateDisplay.textContent = new Intl.DateTimeFormat(getLocaleCode(), {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(today);

    const upcoming = getAnniversaryOccurrences(3);
    const allItems = getAnniversaryItems();
    elements.anniversaryUpcomingList.replaceChildren();
    elements.anniversaryShownCount.textContent = `${upcoming.length} shown`;
    elements.anniversaryTotalCount.textContent = String(allItems.length);
    elements.anniversaryUpcomingCount.textContent = String(upcoming.length);
    elements.anniversaryLunarCount.textContent = String(allItems.filter((item) => item.calendar === "lunar").length);

    if (!allItems.length) {
      const empty = createElement("div", "anniversary-empty");
      empty.append(
        createElement("h2", "", "还没有纪念日"),
        createElement("p", "", "添加家人的生日、结婚纪念日或其他重要日子后，这里只显示最近 3 个提醒。")
      );
      const button = createElement("button", "action-btn primary", "新增纪念日");
      button.type = "button";
      button.addEventListener("click", () => openAnniversaryDialog());
      empty.append(button);
      elements.anniversaryUpcomingList.append(empty);
      return;
    }

    if (!upcoming.length) {
      elements.anniversaryUpcomingList.append(createElement("p", "anniversary-empty-text", "纪念日日期暂时无法换算，请检查日期设置。"));
      return;
    }

    elements.anniversaryUpcomingList.append(createAnniversaryFeatureCard(upcoming[0]));
    upcoming.slice(1).forEach((item, index) => {
      elements.anniversaryUpcomingList.append(createAnniversaryListCard(item, index));
    });
  }

  function createAnniversaryFeatureCard(item) {
    const card = createElement("article", "anniversary-feature-card");
    const countdown = createElement("div", "anniversary-countdown");
    countdown.append(
      createElement("span", "anniversary-countdown-label", "Next"),
      createElement("strong", "anniversary-countdown-number", String(item.daysUntil)),
      createElement("span", "anniversary-countdown-unit", item.daysUntil === 0 ? "今天" : "天后")
    );

    const content = createElement("div", "anniversary-feature-content");
    const tags = createElement("div", "anniversary-tags");
    tags.append(
      createElement("span", "anniversary-tag sage", getAnniversaryCalendarLabel(item)),
      createElement("span", "anniversary-tag slate", "每年重复")
    );
    if (item.builtin) {
      tags.append(createElement("span", "anniversary-tag rose", "内置节日"));
    }
    const title = createElement("h2", "anniversary-feature-title", item.title);
    const details = createElement("div", "anniversary-detail-grid");
    const yearText = getAnniversaryYearText(item);
    const detailItems = [
      createAnniversaryDetail("原始日期", item.originalDateLabel),
      createAnniversaryDetail("今年日期", item.currentDateLabel)
    ];
    if (yearText) {
      detailItems.push(createAnniversaryDetail("年数", yearText));
    }
    detailItems.push(
      createAnniversaryDetail("提醒", `${Number(item.advanceDays || 0)} 天前`)
    );
    details.append(...detailItems);
    content.append(tags, title, details);
    card.append(countdown, content);
    if (!item.builtin) {
      const edit = createElement("button", "anniversary-icon-button anniversary-feature-edit");
      edit.type = "button";
      edit.setAttribute("aria-label", `编辑 ${item.title}`);
      edit.append(createIconSvg("edit"));
      edit.addEventListener("click", () => openAnniversaryDialog(item));
      card.append(edit);
    }
    return card;
  }

  function createAnniversaryDetail(label, value) {
    const detail = createElement("div", "anniversary-detail");
    detail.append(createElement("span", "", label), createElement("strong", "", value));
    return detail;
  }

  function createAnniversaryListCard(item, index) {
    const tone = index % 2 === 0 ? "sage" : "slate";
    const card = createElement("article", `anniversary-event-card ${tone}${item.builtin ? " is-builtin" : ""}`);
    const count = createElement("div", "anniversary-small-count");
    count.append(createElement("strong", "", String(item.daysUntil)), createElement("span", "", "days"));
    const copy = createElement("div", "anniversary-event-copy");
    const yearText = getAnniversaryYearText(item);
    const noteText = item.builtin
      ? `${item.originalDateLabel} · ${item.currentDateLabel} · 内置节日`
      : `${item.originalDateLabel} · ${item.currentDateLabel}${yearText ? ` · ${yearText}` : ""}`;
    copy.append(createElement("h3", "anniversary-event-title", item.title), createElement("p", "anniversary-event-note", noteText));
    card.append(count, copy);
    if (!item.builtin) {
      const edit = createElement("button", "anniversary-icon-button");
      edit.type = "button";
      edit.setAttribute("aria-label", `编辑 ${item.title}`);
      edit.append(createIconSvg("edit"));
      edit.addEventListener("click", () => openAnniversaryDialog(item));
      card.append(edit);
    }
    return card;
  }

  function renderAnniversaryDrawer() {
    if (!elements.anniversaryDrawerList) {
      return;
    }
    const query = state.anniversaryQuery.trim().toLowerCase();
    const items = getAllAnniversaryOccurrences().filter((item) => {
      if (!query) return true;
      return `${item.title} ${item.originalDateLabel} ${item.currentDateLabel} ${getAnniversaryYearText(item)}`.toLowerCase().includes(query);
    });
    elements.anniversaryDrawerList.replaceChildren();
    if (!items.length) {
      elements.anniversaryDrawerList.append(createElement("p", "anniversary-empty-text", query ? "没有匹配的纪念日。" : "还没有纪念日。"));
      return;
    }
    items.forEach((item) => {
      const row = createElement(item.builtin ? "div" : "button", `anniversary-drawer-item${item.builtin ? " is-readonly" : ""}`);
      if (!item.builtin) {
        row.type = "button";
      }
      row.append(createElement("span", "anniversary-drawer-copy"));
      const copy = row.querySelector(".anniversary-drawer-copy");
      const yearText = getAnniversaryYearText(item);
      copy.append(
        createElement("strong", "", item.title),
        createElement("span", "", item.builtin ? `${item.originalDateLabel} · 内置节日` : `${item.originalDateLabel}${yearText ? ` · ${yearText}` : ""}`)
      );
      row.append(createElement("em", "", `${item.daysUntil} 天`));
      if (!item.builtin) {
        row.addEventListener("click", () => openAnniversaryDialog(item));
      }
      elements.anniversaryDrawerList.append(row);
    });
  }

  function setAnniversaryCalendar(calendar) {
    state.anniversaryCalendar = calendar === "solar" ? "solar" : "lunar";
    elements.anniversaryCalendarButtons.forEach((button) => {
      const active = button.dataset.anniversaryCalendar === state.anniversaryCalendar;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    elements.anniversaryLunarFields.hidden = state.anniversaryCalendar !== "lunar";
    elements.anniversarySolarFields.hidden = state.anniversaryCalendar !== "solar";
    elements.anniversaryLunarMonth.required = state.anniversaryCalendar === "lunar";
    elements.anniversaryLunarDay.required = state.anniversaryCalendar === "lunar";
    elements.anniversarySolarMonth.required = state.anniversaryCalendar === "solar";
    elements.anniversarySolarDay.required = state.anniversaryCalendar === "solar";
  }

  function openAnniversaryDrawer() {
    closeAnniversaryDialog();
    renderAnniversaryDrawer();
    elements.anniversaryDrawerBackdrop.hidden = false;
    elements.anniversaryDrawer.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => elements.anniversarySearchInput.focus());
  }

  function closeAnniversaryDrawer() {
    elements.anniversaryDrawerBackdrop.hidden = true;
    elements.anniversaryDrawer.setAttribute("aria-hidden", "true");
  }

  function openAnniversaryDialog(item = null) {
    if (item?.builtin) {
      showToast("内置节日无需维护");
      return;
    }
    closeAnniversaryDrawer();
    const isEditing = Boolean(item);
    elements.anniversaryDialogTitle.textContent = isEditing ? "编辑纪念日" : "新增纪念日";
    elements.anniversaryId.value = item?.id || "";
    elements.anniversaryTitle.value = item?.title || "";
    elements.anniversaryStartYear.value = item?.startYear || "";
    elements.anniversaryAdvanceDays.value = item?.advanceDays ?? defaultAnniversaryAdvanceDays;
    elements.anniversaryDeleteButton.hidden = !isEditing;
    setAnniversaryCalendar(item?.calendar || "lunar");
    elements.anniversaryLunarMonth.value = item?.lunarMonth || "";
    elements.anniversaryLunarDay.value = item?.lunarDay || "";
    elements.anniversarySolarMonth.value = item?.solarMonth || "";
    elements.anniversarySolarDay.value = item?.solarDay || "";
    if (!elements.anniversaryDialog.open) {
      elements.anniversaryDialog.showModal();
    }
    window.requestAnimationFrame(() => elements.anniversaryTitle.focus());
  }

  function closeAnniversaryDialog() {
    if (elements.anniversaryDialog.open) {
      elements.anniversaryDialog.close();
    }
    elements.anniversaryForm.reset();
    elements.anniversaryId.value = "";
    elements.anniversaryStartYear.value = "";
    setAnniversaryCalendar("lunar");
  }

  function closeAnniversarySurfaces() {
    closeAnniversaryDrawer();
    closeAnniversaryDialog();
  }

  async function handleAnniversarySubmit(event) {
    event.preventDefault();
    const id = elements.anniversaryId.value || crypto.randomUUID();
    const item = {
      id,
      title: elements.anniversaryTitle.value.trim(),
      calendar: state.anniversaryCalendar,
      advanceDays: Math.max(0, Math.min(365, Number(elements.anniversaryAdvanceDays.value) || 0)),
      repeat: "yearly",
      updatedAt: Date.now()
    };
    const startYear = Number(elements.anniversaryStartYear.value);
    if (Number.isInteger(startYear) && startYear > 0) {
      item.startYear = startYear;
    }
    if (state.anniversaryCalendar === "lunar") {
      item.lunarMonth = Number(elements.anniversaryLunarMonth.value);
      item.lunarDay = Number(elements.anniversaryLunarDay.value);
    } else {
      item.solarMonth = Number(elements.anniversarySolarMonth.value);
      item.solarDay = Number(elements.anniversarySolarDay.value);
    }
    if (!isValidAnniversary(item)) {
      showToast("请补全纪念日信息");
      return;
    }
    const index = state.anniversaries.items.findIndex((eventItem) => eventItem.id === id);
    if (index >= 0) {
      state.anniversaries.items.splice(index, 1, item);
    } else {
      state.anniversaries.items.unshift({ ...item, createdAt: Date.now() });
    }
    await saveAnniversaries();
    closeAnniversaryDialog();
    renderAnniversaryReminderView();
    renderAnniversaryDrawer();
    showToast("纪念日已保存");
  }

  async function deleteActiveAnniversary() {
    const id = elements.anniversaryId.value;
    if (!id) {
      return;
    }
    state.anniversaries.items = state.anniversaries.items.filter((item) => item.id !== id);
    await saveAnniversaries();
    closeAnniversaryDialog();
    renderAnniversaryReminderView();
    renderAnniversaryDrawer();
    showToast("纪念日已删除");
  }

  function renderQuickSites() {
    elements.quickSiteRail.replaceChildren();
    const sites = state.links.slice(0, 15);
    const quickItems = sites.map((link) => createQuickSiteItem(link));
    elements.quickSites.classList.toggle("is-editing", state.quickSitesEditing);

    const add = createElement("button", "quick-site quick-add");
    add.type = "button";
    add.setAttribute("aria-label", t("addLink"));
    const icon = createElement("span", "quick-site-icon");
    icon.append(createIconSvg("plus"));
    add.append(icon, createElement("span", "quick-site-title", t("add")));
    add.addEventListener("click", () => openDialog());
    quickItems.push(add);

    elements.quickSiteRail.classList.toggle("has-multiple-rows", quickItems.length > 5);
    chunkItems(quickItems, getQuickSiteItemsPerPage()).forEach((pageItems, index) => {
      const page = createElement("div", "quick-site-page");
      page.dataset.page = String(index);
      page.dataset.itemCount = String(pageItems.length);
      pageItems.forEach((item) => page.append(item));
      elements.quickSiteRail.append(page);
    });

    renderQuickSiteDots();
  }

  function createQuickSiteItem(link) {
    const item = createElement("div", "quick-site-card");
    const anchor = createElement("a", "quick-site");
    const edit = createElement("button", "quick-site-action quick-site-edit", "✎");
    const remove = createElement("button", "quick-site-action quick-site-delete", "×");
    anchor.href = link.url;
    anchor.title = link.title;
    edit.type = "button";
    remove.type = "button";
    edit.setAttribute("aria-label", t("editNamed", { title: link.title }));
    remove.setAttribute("aria-label", t("deleteNamed", { title: link.title }));
    anchor.addEventListener("click", (event) => {
      if (!state.quickSitesEditing) {
        return;
      }
      event.preventDefault();
      openDialog(link);
    });
    anchor.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      enterQuickSitesEditMode();
    });
    edit.addEventListener("click", () => openDialog(link));
    remove.addEventListener("click", () => openDialog(link));
    const icon = createElement("span", "quick-site-icon");
    icon.append(createFavicon(link));
    anchor.append(icon, createElement("span", "quick-site-title", link.title));
    item.append(anchor, edit, remove);
    bindQuickSiteLongPress(item);
    return item;
  }

  function enterQuickSitesEditMode() {
    if (state.quickSitesEditing) {
      return;
    }
    state.quickSitesEditing = true;
    renderQuickSites();
  }

  function exitQuickSitesEditMode() {
    if (!state.quickSitesEditing) {
      return;
    }
    state.quickSitesEditing = false;
    renderQuickSites();
  }

  function bindQuickSiteLongPress(item) {
    let timer = 0;
    let longPressed = false;
    const clearTimer = () => {
      window.clearTimeout(timer);
      timer = 0;
    };
    item.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || state.quickSitesEditing) {
        return;
      }
      clearTimer();
      longPressed = false;
      timer = window.setTimeout(() => {
        longPressed = true;
        enterQuickSitesEditMode();
      }, 520);
    });
    item.addEventListener("click", (event) => {
      if (!longPressed) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      longPressed = false;
    }, true);
    item.addEventListener("pointerup", clearTimer);
    item.addEventListener("pointerleave", clearTimer);
    item.addEventListener("pointercancel", clearTimer);
  }

  function chunkItems(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  function renderQuickSiteDots() {
    const pageCount = Math.max(1, elements.quickSiteRail.children.length);
    state.quickSitePage = Math.min(state.quickSitePage, pageCount - 1);
    elements.quickSiteDots.replaceChildren();
    elements.quickSiteDots.hidden = pageCount <= 1;
    if (pageCount <= 1) {
      return;
    }
    for (let index = 0; index < pageCount; index += 1) {
      const dot = createElement("span");
      dot.classList.toggle("is-active", index === state.quickSitePage);
      dot.addEventListener("click", () => scrollQuickSitesToPage(index));
      elements.quickSiteDots.append(dot);
    }
  }

  function getQuickSiteItemsPerPage() {
    return elements.quickSiteRail.classList.contains("has-multiple-rows") ? 10 : 5;
  }

  function getQuickSitePageOffsets() {
    return Array.from(elements.quickSiteRail.querySelectorAll(".quick-site-page")).map((page) => page.offsetLeft);
  }

  function getNearestQuickSitePage() {
    const offsets = getQuickSitePageOffsets();
    const left = elements.quickSiteRail.scrollLeft;
    return offsets.reduce((nearest, offset, index) => (
      Math.abs(offset - left) < Math.abs(offsets[nearest] - left) ? index : nearest
    ), 0);
  }

  function updateQuickSitePage() {
    state.quickSitePage = getNearestQuickSitePage();
    renderQuickSiteDots();
  }

  function scrollQuickSitesToPage(index) {
    const pages = Array.from(elements.quickSiteRail.querySelectorAll(".quick-site-page"));
    const page = pages[Math.max(0, Math.min(index, pages.length - 1))];
    page?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  function renderTodos() {
    elements.todoList.replaceChildren();
    elements.todoArchiveButton.replaceChildren(createIconSvg("archive"));
    const visible = [...state.todos.items]
      .filter((todo) => !todo.archived)
      .sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt)
      .slice(0, todoLimit);
    if (!visible.length) {
      return;
    }

    visible.forEach((todo) => {
      const item = createElement("div", `todo-item${todo.done ? " is-done" : ""}`);
      const check = createElement("button", `todo-check${todo.done ? " is-done" : ""}`, todo.done ? "✓" : "");
      check.type = "button";
      check.setAttribute("aria-label", todo.done ? t("markUndone") : t("markDone"));
      check.addEventListener("click", () => toggleTodoDone(todo.id));

      const text = createElement("span", "todo-text", todo.title);
      text.setAttribute("role", "button");
      text.tabIndex = 0;
      text.addEventListener("click", () => toggleTodoDone(todo.id));
      text.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleTodoDone(todo.id);
        }
      });

      const action = createElement("button", `todo-action${todo.done ? " todo-archive-action" : " todo-delete-action"}`);
      action.type = "button";
      if (todo.done) {
        action.setAttribute("aria-label", t("archiveTodo"));
        action.append(createIconSvg("paperPlane"));
        action.addEventListener("click", () => archiveTodoWithFlight(todo.id, action));
      } else {
        action.textContent = "×";
        action.setAttribute("aria-label", t("deleteTodo"));
        action.addEventListener("click", () => deleteTodo(todo.id));
      }

      item.append(check, text, action);
      elements.todoList.append(item);
    });
  }

  function getActiveMusicTrack() {
    return state.music.tracks[state.music.activeIndex];
  }

  async function loadMusicTracks(force = false) {
    if (!state.settings.showMusicWidget || state.music.loading || (state.music.loaded && !force)) {
      return;
    }
    state.music.loading = true;
    state.music.error = "";
    renderMusicWidget();
    try {
      const response = await fetch(`${musicApiBase}/api/public/tracks`, { cache: "no-store" });
      if (!response.ok) throw new Error("music_unavailable");
      const data = await response.json();
      state.music.tracks = Array.isArray(data.tracks) ? data.tracks : [];
      state.music.activeIndex = Math.min(state.music.activeIndex, Math.max(0, state.music.tracks.length - 1));
      state.music.loaded = true;
      await hydrateActiveMusicTrack();
    } catch {
      state.music.error = t("musicUnavailable");
    } finally {
      state.music.loading = false;
      renderMusicWidget();
    }
  }

  async function hydrateActiveMusicTrack() {
    const track = getActiveMusicTrack();
    if (!track || track.lyricLines || track.lyricsLoaded) {
      return;
    }
    try {
      const response = await fetch(track.apiUrl || `${musicApiBase}/api/public/tracks/${encodeURIComponent(track.id)}`, { cache: "no-store" });
      if (!response.ok) {
        track.lyricsLoaded = true;
        track.lyricLines = [];
        return;
      }
      const data = await response.json();
      const detail = data.track || {};
      Object.assign(track, detail, {
        lyricLines: Array.isArray(detail.lyricLines) ? normalizeMusicLyricLines(detail.lyricLines) : parseMusicLyrics(detail.lyrics || ""),
        lyricsLoaded: true
      });
    } catch {
      track.lyricsLoaded = true;
      track.lyricLines = [];
    }
  }

  function renderMusicWidget() {
    if (!elements.musicWidget || !elements.musicPlayer) {
      return;
    }
    const visible = Boolean(state.settings.showMusicWidget);
    elements.musicWidget.hidden = !visible;
    if (!visible) {
      elements.musicAudio.pause();
      return;
    }
    elements.musicPlayer.replaceChildren();

    if (state.music.loading) {
      elements.musicPlayer.append(createElement("p", "music-empty", t("musicLoading")));
      return;
    }
    if (state.music.error) {
      const empty = createElement("div", "music-empty");
      empty.append(createElement("strong", "", state.music.error));
      const link = createElement("a", "music-link", t("openMusicSite"));
      link.href = musicApiBase;
      empty.append(link);
      elements.musicPlayer.append(empty);
      return;
    }
    const track = getActiveMusicTrack();
    if (!track) {
      elements.musicPlayer.append(createElement("p", "music-empty", t("noMusicTracks")));
      return;
    }

    const cover = track.coverUrl ? createElement("img", "music-cover") : createElement("div", "music-cover music-cover-fallback");
    if (track.coverUrl) {
      cover.src = track.coverUrl;
      cover.alt = "";
    } else {
      cover.textContent = (track.title || "QM").slice(0, 2).toUpperCase();
    }

    const copy = createElement("div", "music-copy");
    copy.append(createElement("span", "music-kicker", t("musicBrand")));
    copy.append(createElement("strong", "music-title", track.title || t("musicBrand")));
    copy.append(createElement("span", "music-artist", [track.artist, track.album || track.source].filter(Boolean).join(" · ")));

    const controls = createElement("div", "music-controls");
    const prev = createElement("button", "music-control", "‹");
    const play = createElement("button", "music-control music-play", state.music.isPlaying ? "||" : "▶");
    const next = createElement("button", "music-control", "›");
    prev.type = play.type = next.type = "button";
    prev.setAttribute("aria-label", t("previousTrack"));
    play.setAttribute("aria-label", t("startOrPause"));
    next.setAttribute("aria-label", t("nextTrack"));
    prev.dataset.musicAction = "prev";
    play.dataset.musicAction = "toggle";
    next.dataset.musicAction = "next";
    controls.append(prev, play, next);

    const seek = createElement("input", "music-seek");
    seek.type = "range";
    seek.min = "0";
    seek.max = "1000";
    seek.value = "0";
    seek.setAttribute("aria-label", "播放进度");
    seek.dataset.musicAction = "seek";

    const time = createElement("span", "music-time", "0:00");
    const lyrics = createElement("div", "music-lyrics");
    renderMusicLyrics(lyrics, track.lyricLines || [], Boolean(track.lyricsLoaded));

    elements.musicPlayer.append(cover, copy, controls, seek, time, lyrics);
    syncMusicAudio(false);
    updateMusicProgress();
  }

  function renderMusicLyrics(container, lines, lyricsLoaded = false) {
    const visibleLines = lines.length ? lines : [{ text: lyricsLoaded ? t("noLyrics") : t("lyricsLoading"), placeholder: true }];
    const activeIndex = Math.max(0, Math.min(state.music.activeLine, visibleLines.length - 1));
    container.classList.toggle("is-empty", !lines.length);
    visibleLines.forEach((line, index) => {
      const item = createElement("p", `music-lyric${index === activeIndex ? " is-active" : ""}${line.placeholder ? " is-placeholder" : ""}`, line.text);
      item.dataset.index = String(index);
      container.append(item);
    });
    window.requestAnimationFrame(() => scrollMusicLyricIntoView(activeIndex, "auto"));
  }

  function scrollMusicLyricIntoView(index, behavior = "smooth") {
    const container = elements.musicPlayer.querySelector(".music-lyrics");
    const lines = Array.from(container?.querySelectorAll(".music-lyric") || []);
    const activeLine = lines[Math.max(0, Math.min(index, lines.length - 1))];
    if (!container || !activeLine) {
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const activeRect = activeLine.getBoundingClientRect();
    const delta = activeRect.top - containerRect.top - (container.clientHeight - activeRect.height) / 2;
    container.scrollTo({ top: Math.max(0, container.scrollTop + delta), behavior });
  }

  function syncMusicAudio(autoplay) {
    const audio = elements.musicAudio;
    const track = getActiveMusicTrack();
    if (!audio || !track?.audioUrl) {
      return;
    }
    if (audio.src !== track.audioUrl) {
      audio.src = track.audioUrl;
      audio.load();
    }
    if (autoplay) {
      audio.play().catch(() => {
        state.music.isPlaying = false;
        updateMusicProgress();
      });
    }
  }

  async function playMusicTrack(index = state.music.activeIndex) {
    if (!state.music.tracks.length) {
      await loadMusicTracks(true);
    }
    if (!state.music.tracks.length) {
      return;
    }
    state.music.activeIndex = (index + state.music.tracks.length) % state.music.tracks.length;
    state.music.activeLine = 0;
    await hydrateActiveMusicTrack();
    renderMusicWidget();
    syncMusicAudio(true);
  }

  function updateMusicProgress() {
    const audio = elements.musicAudio;
    if (!audio || elements.musicWidget.hidden) {
      return;
    }
    const duration = audio.duration || 0;
    const time = audio.currentTime || 0;
    const seek = elements.musicPlayer.querySelector(".music-seek");
    const label = elements.musicPlayer.querySelector(".music-time");
    if (seek) seek.value = duration ? String(Math.round((time / duration) * 1000)) : "0";
    if (label) label.textContent = `${formatMusicTime(time)}${duration ? ` / ${formatMusicTime(duration)}` : ""}`;

    const track = getActiveMusicTrack();
    const lines = track?.lyricLines || [];
    const nextLine = getActiveMusicLine(lines, time, duration);
    if (nextLine !== state.music.activeLine) {
      state.music.activeLine = nextLine;
      elements.musicPlayer.querySelectorAll(".music-lyric").forEach((line, index) => {
        line.classList.toggle("is-active", index === nextLine);
      });
      scrollMusicLyricIntoView(nextLine);
    }

    const play = elements.musicPlayer.querySelector(".music-play");
    if (play) play.textContent = state.music.isPlaying ? "||" : "▶";
  }

  function handleMusicClick(event) {
    const button = event.target.closest("[data-music-action]");
    if (!button) return;
    const action = button.dataset.musicAction;
    if (action === "toggle") {
      const audio = elements.musicAudio;
      if (audio.paused) {
        playMusicTrack(state.music.activeIndex);
      } else {
        audio.pause();
      }
    }
    if (action === "prev") playMusicTrack(state.music.activeIndex - 1);
    if (action === "next") playMusicTrack(state.music.activeIndex + 1);
  }

  function handleMusicSeek(event) {
    if (!event.target.matches("[data-music-action='seek']")) {
      return;
    }
    const audio = elements.musicAudio;
    if (audio.duration) {
      audio.currentTime = (Number(event.target.value) / 1000) * audio.duration;
    }
  }

  function renderTodoArchive() {
    elements.todoArchiveList.replaceChildren();
    const completed = state.todos.items
      .filter((todo) => todo.archived)
      .sort((a, b) => (b.completedAt || b.updatedAt || 0) - (a.completedAt || a.updatedAt || 0))
      .slice(0, 20);
    if (!completed.length) {
      elements.todoArchiveList.append(createElement("p", "empty", t("noCompletedTodos")));
      return;
    }
    completed.forEach((todo) => {
      const item = createElement("div", "todo-archive-item");
      const copy = createElement("span", "", todo.title);
      copy.append(createElement("small", "", formatTodoCompletedAt(todo)));
      const actions = createElement("div", "todo-archive-actions");
      const restore = createElement("button", "", t("restore"));
      restore.type = "button";
      restore.addEventListener("click", () => restoreTodo(todo.id));
      const remove = createElement("button", "", t("delete"));
      remove.type = "button";
      remove.addEventListener("click", () => deleteTodo(todo.id));
      actions.append(restore, remove);
      item.append(copy, actions);
      elements.todoArchiveList.append(item);
    });
  }

  async function addTodo(title) {
    const activeCount = state.todos.items.filter((todo) => !todo.done && !todo.archived).length;
    if (activeCount >= todoLimit) {
      showToast(t("tooManyTodos"));
      return false;
    }
    state.todos.items.unshift({
      id: crypto.randomUUID(),
      title,
      done: false,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    await saveTodos();
    renderTodos();
    return true;
  }

  async function toggleTodoDone(id) {
    const item = state.todos.items.find((todo) => todo.id === id);
    if (!item) {
      return;
    }
    item.done = !item.done;
    item.completedAt = item.done ? Date.now() : 0;
    item.updatedAt = Date.now();
    await saveTodos();
    renderTodos();
  }

  async function archiveTodo(id) {
    const item = state.todos.items.find((todo) => todo.id === id);
    if (!item) {
      return;
    }
    item.done = true;
    item.archived = true;
    item.completedAt = item.completedAt || Date.now();
    item.archivedAt = Date.now();
    item.updatedAt = Date.now();
    await saveTodos();
    renderTodos();
    if (elements.todoArchiveDialog.open) {
      renderTodoArchive();
    }
  }

  async function archiveTodoWithFlight(id, trigger) {
    if (trigger?.disabled) {
      return;
    }
    trigger.disabled = true;
    trigger.classList.add("is-launching");
    await flyTodoToArchive(trigger);
    await archiveTodo(id);
  }

  async function flyTodoToArchive(trigger) {
    const target = elements.todoArchiveButton;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!trigger || !target || reducedMotion || typeof trigger.getBoundingClientRect !== "function" || typeof Element.prototype.animate !== "function") {
      return;
    }

    const from = trigger.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!from.width || !to.width) {
      return;
    }

    const plane = createElement("span", "todo-flying-plane");
    plane.append(createIconSvg("paperPlane"));
    plane.style.left = `${from.left + from.width / 2}px`;
    plane.style.top = `${from.top + from.height / 2}px`;
    document.body.append(plane);

    const deltaX = to.left + to.width / 2 - (from.left + from.width / 2);
    const deltaY = to.top + to.height / 2 - (from.top + from.height / 2);
    const lift = Math.min(-28, deltaY * 0.35 - 18);
    const animation = plane.animate(
      [
        { opacity: 0, transform: "translate(-50%, -50%) scale(0.7) rotate(-18deg)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1) rotate(-12deg)", offset: 0.14 },
        { opacity: 1, transform: `translate(calc(-50% + ${deltaX * 0.45}px), calc(-50% + ${lift}px)) scale(1.04) rotate(12deg)`, offset: 0.58 },
        { opacity: 0, transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px)) scale(0.46) rotate(28deg)` }
      ],
      {
        duration: 560,
        easing: "cubic-bezier(0.22, 0.8, 0.24, 1)",
        fill: "forwards"
      }
    );

    try {
      await animation.finished;
    } catch {
      // Animation cancellation should not block archiving.
    } finally {
      plane.remove();
    }
  }

  async function restoreTodo(id) {
    const activeCount = state.todos.items.filter((todo) => !todo.done && !todo.archived).length;
    if (activeCount >= todoLimit) {
      showToast(t("tooManyTodos"));
      return;
    }
    const item = state.todos.items.find((todo) => todo.id === id);
    if (!item) {
      return;
    }
    item.done = false;
    item.archived = false;
    item.completedAt = 0;
    item.archivedAt = 0;
    item.updatedAt = Date.now();
    await saveTodos();
    renderTodos();
    renderTodoArchive();
  }

  async function deleteTodo(id) {
    state.todos.items = state.todos.items.filter((todo) => todo.id !== id);
    await saveTodos();
    renderTodos();
    if (elements.todoArchiveDialog.open) {
      renderTodoArchive();
    }
  }

  function formatTodoCompletedAt(todo) {
    const time = todo.completedAt || todo.updatedAt || todo.createdAt;
    if (!time) {
      return t("completed");
    }
    return new Intl.DateTimeFormat(getLocaleCode(), {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(time));
  }

  function renderNotes() {
    elements.notesLayer.querySelectorAll(".sticky-note-editor").forEach((editorElement) => {
      window.OhMyTabNoteEditor?.destroyNoteEditor?.(editorElement);
    });
    elements.notesLayer.replaceChildren();
    state.notes.items.forEach((note) => {
      const card = createElement("article", "sticky-note");
      card.classList.add(note.color || "note-lemon");
      card.dataset.id = note.id;
      card.style.left = `${note.x}px`;
      card.style.top = `${note.y}px`;
      card.style.width = `${note.width}px`;
      card.style.height = `${note.height}px`;
      card.style.zIndex = String(note.z || 20);

      const head = createElement("div", "sticky-note-head");
      const title = createElement("span", "sticky-note-title", getNoteTitle(note.content));
      const close = createElement("button", "sticky-note-close", "×");
      close.type = "button";
      close.setAttribute("aria-label", "关闭便签");
      close.addEventListener("click", () => closeNote(note.id));
      head.append(title, close);

      const body = createElement("div", "sticky-note-body");
      const editorMount = createElement("div");
      body.append(editorMount);
      card.append(head, body);
      elements.notesLayer.append(card);

      bindNoteDrag(card, head, note.id);
      bindNoteResize(card, note.id);
      card.addEventListener("pointerdown", () => bringNoteFront(note.id));
      createTiptapEditor(editorMount, note.id, note.content);
    });
  }

  function createTiptapEditor(editorMount, noteId, content) {
    if (!window.OhMyTabNoteEditor?.createNoteEditor) {
      editorMount.className = "sticky-note-editor";
      editorMount.contentEditable = "true";
      editorMount.innerHTML = content || "<p></p>";
      editorMount.addEventListener("input", () => updateNoteContent(noteId, editorMount.innerHTML));
      return;
    }
    window.OhMyTabNoteEditor.createNoteEditor({
      element: editorMount,
      content,
      onUpdate: (html) => updateNoteContent(noteId, html)
    });
  }

  function getNoteTitle(content) {
    const div = document.createElement("div");
    div.innerHTML = content || "";
    return div.textContent.trim().slice(0, 24) || "便签";
  }

  async function createNote() {
    const index = state.notes.items.length;
    const note = {
      id: crypto.randomUUID(),
      content: "<p></p>",
      color: noteColorClasses[index % noteColorClasses.length],
      x: Math.min(window.innerWidth - 260, 340 + index * 22),
      y: Math.min(window.innerHeight - 220, 160 + index * 18),
      width: 320,
      height: 260,
      z: getNextNoteZ(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    note.x = Math.max(16, note.x);
    note.y = Math.max(16, note.y);
    state.notes.items.push(note);
    await saveNotes();
    renderNotes();
  }

  async function closeNote(id) {
    const noteElement = elements.notesLayer.querySelector(`[data-id="${CSS.escape(id)}"] .sticky-note-editor`);
    if (noteElement) {
      window.OhMyTabNoteEditor?.destroyNoteEditor?.(noteElement);
    }
    state.notes.items = state.notes.items.filter((note) => note.id !== id);
    await saveNotes();
    renderNotes();
  }

  function updateNoteContent(id, content) {
    const note = state.notes.items.find((item) => item.id === id);
    if (!note) {
      return;
    }
    note.content = content;
    note.updatedAt = Date.now();
    const card = elements.notesLayer.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const title = card?.querySelector(".sticky-note-title");
    if (title) {
      title.textContent = getNoteTitle(content);
    }
    scheduleSaveNotes();
  }

  function bringNoteFront(id) {
    const note = state.notes.items.find((item) => item.id === id);
    if (!note) {
      return;
    }
    note.z = getNextNoteZ();
    const card = elements.notesLayer.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (card) {
      card.style.zIndex = String(note.z);
    }
    scheduleSaveNotes();
  }

  function getNextNoteZ() {
    return Math.max(20, ...state.notes.items.map((note) => note.z || 20)) + 1;
  }

  function scheduleSaveNotes() {
    window.clearTimeout(scheduleSaveNotes.timer);
    scheduleSaveNotes.timer = window.setTimeout(saveNotes, 220);
  }

  function bindNoteDrag(card, handle, id) {
    handle.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      event.preventDefault();
      bringNoteFront(id);
      card.classList.add("is-dragging");
      handle.setPointerCapture(event.pointerId);
      const note = state.notes.items.find((item) => item.id === id);
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = note.x;
      const originY = note.y;

      const move = (moveEvent) => {
        const nextX = Math.min(window.innerWidth - 60, Math.max(0, originX + moveEvent.clientX - startX));
        const nextY = Math.min(window.innerHeight - 44, Math.max(0, originY + moveEvent.clientY - startY));
        note.x = nextX;
        note.y = nextY;
        card.style.left = `${nextX}px`;
        card.style.top = `${nextY}px`;
      };
      const up = () => {
        card.classList.remove("is-dragging");
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
        saveNotes();
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    });
  }

  function bindNoteResize(card, id) {
    const observer = new ResizeObserver(() => {
      const note = state.notes.items.find((item) => item.id === id);
      if (!note) {
        observer.disconnect();
        return;
      }
      note.width = Math.round(card.offsetWidth);
      note.height = Math.round(card.offsetHeight);
      note.updatedAt = Date.now();
      scheduleSaveNotes();
    });
    observer.observe(card);
  }

  function renderCustomLinks() {
    if (!elements.customGroups) {
      return;
    }
    elements.customGroups.replaceChildren();
    const links = getAllLinks().filter(matchesQuery);

    if (!links.length && state.query) {
      elements.customGroups.append(createElement("p", "empty", state.query ? t("noCustomMatch") : t("noCustomLinks")));
      return;
    }

    state.firstResultUrl = links[0]?.url || state.firstResultUrl;

    const grid = createElement("div", "link-grid");
    if (!state.query) {
      grid.append(createAddCard());
    }
    links.forEach((link) => {
      const card = createElement("a", "link-card");
      card.href = link.url;
      card.title = link.title;
      card.draggable = !state.query && link.source === "custom";
      card.dataset.id = link.id;

      const copy = createElement("span");
      copy.append(createFavicon(link));
      copy.append(createElement("span", "link-title", link.title));

      const edit = createElement("button", "edit-link", "⋯");
      edit.type = "button";
      edit.setAttribute("aria-label", t("editNamed", { title: link.title }));
      edit.hidden = link.source !== "custom";
      edit.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDialog(link);
      });

      card.append(copy, edit);
      bindLinkDrag(card);
      grid.append(card);
    });

    elements.customGroups.append(grid);
  }

  function createAddCard() {
    const card = createElement("button", "link-card add-card");
    card.type = "button";
    card.setAttribute("aria-label", t("addLink"));
    const icon = createElement("span", "favicon-fallback", "✎");
    const title = createElement("span", "link-title", t("addLink"));
    card.append(icon, title);
    card.addEventListener("click", () => openDialog());
    return card;
  }

  function renderBookmarks() {
    elements.bookmarkList.replaceChildren();
    const bookmarks = state.bookmarks.filter((item) => itemMatchesQuery(item, state.bookmarkQuery));
    const visibleBookmarks = bookmarks.slice(0, 80);
    elements.bookmarkSummary.textContent = t("bookmarkCount", { count: visibleBookmarks.length });
    if (!bookmarks.length) {
      elements.bookmarkList.append(createElement("p", "empty", hasChromeApi("bookmarks") ? t("noBookmarkMatch") : t("noBookmarkAccess")));
      return;
    }

    visibleBookmarks.forEach((bookmark) => {
      const item = createElement("a", "bookmark-item");
      item.href = bookmark.url;
      item.title = bookmark.title;
      const copy = createElement("span", "bookmark-copy");
      copy.append(createElement("span", "bookmark-title", bookmark.title || getHost(bookmark.url)));
      copy.append(createElement("span", "bookmark-folder", bookmark.group || t("browserFolder")));
      item.append(createFavicon(bookmark), copy);
      elements.bookmarkList.append(item);
    });
  }

  function createFavicon(link) {
    if (link.icon) {
      const image = createElement("img", "favicon");
      image.src = link.icon;
      image.alt = "";
      return image;
    }
    const cached = state.faviconCache[getFaviconCacheKey(link.url)];
    if (cached) {
      const image = createElement("img", "favicon");
      image.src = cached;
      image.alt = "";
      return image;
    }
    const brandAsset = getBrandIconAsset(link.url);
    if (brandAsset) {
      const image = createElement("img", "favicon");
      image.src = brandAsset;
      image.alt = "";
      return image;
    }
    return createRemoteFavicon(link);
  }

  function createRemoteFavicon(link) {
    const faviconUrl = getRemoteFaviconUrl(link.url);
    const fallback = () => createElement("span", "favicon-fallback", getInitial(link.title, link.url));
    if (!faviconUrl) {
      return fallback();
    }
    const image = createElement("img", "favicon");
    image.src = faviconUrl;
    image.alt = "";
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => image.replaceWith(fallback()), { once: true });
    return image;
  }

  function createIconSvg(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const paths = {
      plus: ["M12 5v14", "M5 12h14"],
      focus: ["M12 8v4l2.5 2.5", "M9 3h6", "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14"],
      todo: ["M8 12l2.5 2.5L16 9", "M5 5h14v14H5z"],
      music: ["M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"],
      settings: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8", "M12 2v3", "M12 19v3", "M2 12h3", "M19 12h3"],
      search: ["M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15", "M16 16l5 5"],
      theme: ["M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9"],
      weather: ["M17.5 18H8a5 5 0 1 1 1.2-9.85A6 6 0 0 1 20 12.5 3.5 3.5 0 0 1 17.5 18z", "M7 20h10"],
      link: ["M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1", "M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"],
      copy: ["M8 8h11v11H8z", "M5 15H4a1 1 0 0 1-1-1V5a2 2 0 0 1 2-2h9a1 1 0 0 1 1 1v1"],
      check: ["M5 12l4 4L19 6"],
      edit: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
      paperPlane: ["M19 5l-5 14-3.2-6.1L5 12l14-7z", "M10.8 12.9L19 5"],
      archive: ["M4 7h16", "M6 7v12h12V7", "M8 4h8l2 3H6l2-3z", "M10 12h4"]
      ,
      tabs: ["M3 8.25V18a2.25 2.25 0 0 0 2.25 2.25h13.5A2.25 2.25 0 0 0 21 18V8.25", "M3 8.25V6a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 6v2.25H3z"],
      close: ["M6 18 18 6", "M6 6l12 12"],
      bookmark: ["M6 4h12v17l-6-3.4L6 21V4z"],
      shuffle: ["M16 3h5v5", "M4 20 21 3", "M21 16v5h-5", "M15 15l6 6", "M4 4l5 5"],
      arrowLeft: ["M19 12H5", "M12 19l-7-7 7-7"]
    };
    (paths[name] || paths.search).forEach((value) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", value);
      svg.append(path);
    });
    return svg;
  }

  function getBrandIconAsset(url) {
    const host = getHost(url);
    const match = brandIconRules.find((rule) => rule.hosts.some((candidate) => host === candidate || host.endsWith(`.${candidate}`)));
    return match?.asset || "";
  }

  function getFaviconCacheKey(url) {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  }

  function getRemoteFaviconUrl(url) {
    try {
      const normalizedUrl = normalizeUrl(url);
      return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(normalizedUrl)}`;
    } catch {
      return "";
    }
  }

  function renderHistory() {
    if (!elements.historyGroups) {
      return;
    }
    elements.historyGroups.replaceChildren();
    const cutoff = Date.now() - 72 * 60 * 60 * 1000;
    const historyItems = state.history
      .filter((item) => (item.lastVisitTime || 0) >= cutoff)
      .filter((item) => itemMatchesQuery(item, state.recentQuery));

    if (state.query && !state.firstResultUrl && historyItems[0]) {
      state.firstResultUrl = historyItems[0].url;
    }

    if (!historyItems.length) {
      elements.historyGroups.append(createElement("p", "empty", t("noRecentHistory")));
      return;
    }

    for (const [groupName, groupItems] of groupBy(historyItems, categorize)) {
      const group = createElement("section", "history-group");
      const title = createGroupTitle(groupName, groupItems.length);
      const list = createElement("div", "history-list");

      groupItems.slice(0, state.settings.recentLimit).forEach((item) => {
        const card = createElement("div", "history-item");
        const link = createElement("a", "history-link");
        link.href = item.url;
        link.title = `${item.title || getHost(item.url)} - ${item.url}`;

        const copy = createElement("span");
        copy.append(createElement("span", "history-title", getHistoryTitle(item)));
        copy.append(createElement("span", "trace-domain", getHistorySubtitle(item)));
        const meta = createElement("span", "trace-meta", formatHistoryMeta(item));
        const copyButton = createElement("button", "history-copy-button");
        copyButton.type = "button";
        copyButton.title = t("copyTitleUrl");
        copyButton.setAttribute("aria-label", t("copyNamedTitleUrl", { title: getHistoryTitle(item) }));
        copyButton.append(createIconSvg("copy"));
        copyButton.addEventListener("click", () => copyHistoryLink(item, copyButton));

        const content = createElement("span", "history-link-content");
        content.append(copy, meta);
        link.append(createFavicon(item), content);
        card.append(link, copyButton);
        list.append(card);
      });

      group.append(title, list);
      elements.historyGroups.append(group);
    }
  }

  function renderSearchPanel() {
    const query = state.query;
    const hasFocus = document.activeElement === elements.searchInput;
    const results = state.siteSearch ? getSiteScopedItems(query) : getSearchItems(query);
    state.tabCandidate = getSiteSearchCandidate(query);
    elements.searchResults.replaceChildren();
    elements.searchTabHint.hidden = !state.tabCandidate;

    if (state.tabCandidate) {
      elements.searchTabHint.replaceChildren(
        createElement("span", "", t("inSiteSearch", { host: state.tabCandidate.host })),
        createElement("kbd", "", "Tab")
      );
    }

    if (results.length) {
      results.forEach((result, index) => {
        const item = createElement("button", `search-result${index === state.searchIndex ? " is-active" : ""}`);
        item.type = "button";
        item.setAttribute("role", "option");
        item.append(createFavicon(result));
        const copy = createElement("span", "search-result-copy");
        copy.append(createElement("span", "search-result-title", result.title || getHistoryTitle(result)));
        copy.append(createElement("span", "search-result-meta", getHistorySubtitle(result)));
        item.append(copy, createElement("span", "search-result-kind", result.kind));
        item.addEventListener("mouseenter", () => {
          state.searchIndex = index;
          renderSearchPanel();
        });
        item.addEventListener("click", () => {
          window.location.href = result.url;
        });
        elements.searchResults.append(item);
      });
    } else {
      const empty = createElement("div", "search-empty");
      if (state.siteSearch) {
        empty.append(
          createElement("strong", "", query ? t("noSiteMatches") : t("searchHost", { host: state.siteSearch.host })),
          createElement("span", "", query ? t("noLocalSiteMatches") : t("siteSearchHint"))
        );
      } else {
        empty.append(
          createElement("strong", "", query ? t("noMatches") : t("startSearch")),
          createElement("span", "", query ? t("addTodoHint") : t("searchHint"))
        );
      }
      elements.searchResults.append(empty);
    }

    const shouldShow = hasFocus && (Boolean(query) || Boolean(state.siteSearch));
    elements.searchPanel.hidden = !shouldShow;
  }

  function renderSiteSearchPill() {
    elements.searchForm.classList.toggle("has-site-search", Boolean(state.siteSearch));
    elements.siteSearchPill.hidden = !state.siteSearch;
    if (state.siteSearch) {
      elements.siteSearchLabel.textContent = state.siteSearch.host;
    }
  }

  function renderSearchProviderControl() {
    const providerId = searchProviders[state.settings.searchEngine] ? state.settings.searchEngine : "";
    const provider = providerId ? searchProviders[providerId] : localSearchProvider;
    const providerLabel = provider.labelKey ? t(provider.labelKey) : provider.label;
    populateSearchProviderControl(elements.searchProviderButton, elements.searchProviderMenu, providerId, provider, providerLabel);
    populateSearchProviderControl(elements.commandSearchProviderButton, elements.commandSearchProviderMenu, providerId, provider, providerLabel);
    if (!state.siteSearch) {
      elements.searchInput.placeholder = provider.action === "todo" ? t("todoPlaceholder") : t("searchPlaceholder");
    }
    elements.commandInput.placeholder = provider.action === "todo" ? t("todoPlaceholder") : t("commandPlaceholder");
  }

  function populateSearchProviderControl(buttonElement, menuElement, providerId, provider, providerLabel) {
    if (!buttonElement || !menuElement) {
      return;
    }
    buttonElement.replaceChildren(createSearchProviderIcon(provider));
    buttonElement.title = providerLabel;
    menuElement.replaceChildren();
    const localButton = createElement("button", `search-provider-option${providerId ? "" : " is-active"}`);
    localButton.type = "button";
    localButton.dataset.searchProvider = "";
    localButton.append(createSearchProviderIcon(localSearchProvider), createElement("span", "", t("localSearch")));
    menuElement.append(localButton);
    searchProviderOrder.forEach((id) => {
      const option = searchProviders[id];
      const button = createElement("button", `search-provider-option${id === providerId ? " is-active" : ""}`);
      button.type = "button";
      button.dataset.searchProvider = id;
      button.append(createSearchProviderIcon(option), createElement("span", "", option.label));
      menuElement.append(button);
    });
  }

  function createSearchProviderIcon(provider) {
    if (provider.iconName) {
      return createIconSvg(provider.iconName);
    }
    if (provider.icon) {
      const image = createElement("img");
      image.src = provider.icon;
      image.alt = "";
      return image;
    }
    const label = provider.labelKey ? t(provider.labelKey) : provider.label;
    return createElement("span", "search-provider-fallback", provider.fallback || label.slice(0, 1));
  }

  function createGroupTitle(name, count) {
    const title = createElement("h3", "group-title");
    title.append(document.createTextNode(name));
    title.append(createElement("span", "count-pill", String(count)));
    return title;
  }

  function formatHistoryMeta(item) {
    const visitCount = item.visitCount ? t("visitCount", { count: item.visitCount }) : t("visitFallback");
    if (!item.lastVisitTime) {
      return visitCount;
    }
    const minutes = Math.max(1, Math.round((Date.now() - item.lastVisitTime) / 60000));
    if (minutes < 60) {
      return `${t("minutesAgo", { count: minutes })} · ${visitCount}`;
    }
    const hours = Math.round(minutes / 60);
    return `${t("hoursAgo", { count: hours })} · ${visitCount}`;
  }

  async function copyHistoryLink(item, button) {
    const title = getHistoryTitle(item);
    const text = `${title}\n${item.url}`;
    const copied = await copyText(text);
    button.classList.toggle("is-copied", copied);
    button.title = copied ? t("copied") : t("copyFailed");
    button.setAttribute("aria-label", copied ? t("copiedNamed", { title }) : t("copyNamedFailed", { title }));
    button.replaceChildren(createIconSvg(copied ? "check" : "copy"));
    window.setTimeout(() => {
      button.classList.remove("is-copied");
      button.title = t("copyTitleUrl");
      button.setAttribute("aria-label", t("copyNamedTitleUrl", { title }));
      button.replaceChildren(createIconSvg("copy"));
    }, 1200);
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return copyTextFallback(text);
      }
    }
    return copyTextFallback(text);
  }

  function copyTextFallback(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  }

  function getHistoryTitle(item) {
    if (item.enhancedTitle) {
      return item.enhancedTitle;
    }
    if (isWeChatArticle(item.url) && isGenericWeChatTitle(item.title)) {
      return t("wechatArticle");
    }
    return item.title || getHost(item.url);
  }

  function getHistorySubtitle(item) {
    if (item.enhancedSource) {
      return item.enhancedSource;
    }
    return getHost(item.url);
  }

  async function enrichWeChatHistoryTitles() {
    const targets = state.history
      .filter((item) => isWeChatArticle(item.url) && (!item.enhancedSource || isGenericWeChatTitle(item.title)))
      .slice(0, 8);

    if (!targets.length || typeof fetch === "undefined") {
      return;
    }

    let changed = false;
    for (const item of targets) {
      const cacheKey = getHistoryCacheKey(item.url);
      if (state.historyTitleCache[cacheKey]) {
        continue;
      }

      const metadata = await fetchWeChatMetadata(item.url);
      if (metadata) {
        state.historyTitleCache[cacheKey] = metadata;
        item.enhancedTitle = metadata.title;
        item.enhancedSource = metadata.source;
        changed = true;
      }
    }

    if (changed) {
      await storageSet({ [historyTitleCacheKey]: state.historyTitleCache });
      render();
    }
  }

  async function fetchWeChatMetadata(url) {
    try {
      const response = await fetch(url, { credentials: "omit" });
      if (!response.ok) {
        return null;
      }
      const html = await response.text();
      const title = cleanText(
        matchFirst(html, [
          /var\s+msg_title\s*=\s*['"]([^'"]+)['"]/,
          /property=["']og:title["']\s+content=["']([^"']+)["']/i,
          /<title[^>]*>([^<]+)<\/title>/i
        ])
      );
      const source = cleanText(
        matchFirst(html, [
          /var\s+nickname\s*=\s*['"]([^'"]+)['"]/,
          /id=["']js_name["'][^>]*>([^<]+)</i,
          /name=["']author["']\s+content=["']([^"']+)["']/i
        ])
      );

      if (!title && !source) {
        return null;
      }
      return {
        title: title || "微信文章",
        source: source || "mp.weixin.qq.com"
      };
    } catch {
      return null;
    }
  }

  function matchFirst(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return match[1];
      }
    }
    return "";
  }

  function cleanText(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value || "";
    return textarea.value.replace(/\\x26/g, "&").replace(/\s+/g, " ").trim();
  }

  function render() {
    state.firstResultUrl = "";
    applySettings();
    renderMainTabs();
    updateFirstResult();
    renderQuote();
    renderSiteSearchPill();
    renderSearchProviderControl();
    renderSearchPanel();
    renderQuickSites();
    renderMusicWidget();
    renderTodos();
    renderTodoArchive();
    renderBookmarks();
    renderHistory();
    renderPomodoro();
    renderNotes();
    renderWeather();
    renderAnniversaryReminderView();
    renderWereadSettings();
    renderDrawerTabs();
    renderCommandResults();
  }

  function renderModuleToggles() {
    elements.todoModuleToggle.replaceChildren(createIconSvg("todo"));
    elements.musicModuleToggle.replaceChildren(createIconSvg("music"));
    elements.todoModuleToggle.classList.toggle("is-active", Boolean(state.settings.showTodos));
    elements.musicModuleToggle.classList.toggle("is-active", Boolean(state.settings.showMusicWidget));
    elements.todoModuleToggle.classList.toggle("is-disabled", !state.settings.showTodos);
    elements.musicModuleToggle.classList.toggle("is-disabled", !state.settings.showMusicWidget);
  }

  function renderWeather() {
    if (!elements.weatherCards) {
      return;
    }
    const cities = state.weather.cities;
    elements.weatherSummary.textContent = cities.length ? t("weatherRegionCount", { count: cities.length }) : t("addTrackedRegion");
    renderWeatherCityResults();
    elements.weatherCards.replaceChildren();

    if (state.weather.loading && !Object.keys(state.weather.reports).length) {
      elements.weatherCards.append(createElement("p", "weather-empty", t("weatherUpdating")));
      return;
    }
    if (!cities.length) {
      elements.weatherCards.append(createElement("p", "weather-empty", t("weatherAddPrompt")));
      return;
    }

    cities.forEach((city) => {
      elements.weatherCards.append(createWeatherCard(city, state.weather.reports[city.adcode]));
    });
  }

  function renderWeatherCityResults() {
    elements.weatherCityResults.replaceChildren();
    const query = state.weather.query.trim().toLowerCase();
    if (!query) {
      return;
    }
    if (!state.weather.cityList.length) {
      elements.weatherCityResults.append(createElement("p", "weather-empty", state.weather.error || t("cityListLoading")));
      return;
    }
    const existing = new Set(state.weather.cities.map((city) => city.adcode));
    const matches = state.weather.cityList
      .filter((city) => city.keywords.toLowerCase().includes(query) || city.label.toLowerCase().includes(query))
      .slice(0, 12);
    if (!matches.length) {
      elements.weatherCityResults.append(createElement("p", "weather-empty", t("noRegionFound")));
      return;
    }
    matches.forEach((city) => {
      const button = createElement("button", "weather-city-option");
      button.type = "button";
      button.disabled = existing.has(city.adcode);
      button.dataset.adcode = city.adcode;
      const copy = createElement("span");
      copy.append(createElement("strong", "", city.name), createElement("span", "", city.label));
      button.append(copy, createElement("small", "", existing.has(city.adcode) ? t("added") : city.adcode));
      button.addEventListener("click", () => addWeatherCity(city));
      elements.weatherCityResults.append(button);
    });
  }

  function createWeatherCard(city, report) {
    const live = report?.live;
    const forecast = report?.forecast;
    const casts = Array.isArray(forecast?.casts) ? forecast.casts.slice(0, 3) : [];
    const status = report?.error || state.weather.error;
    const condition = live?.weather || casts[0]?.dayweather || "";
    const card = createElement("article", `weather-card weather-card-${getWeatherTone(condition)}`);
    const remove = createElement("button", "weather-remove", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", t("removeCity", { city: city.name }));
    remove.addEventListener("click", () => removeWeatherCity(city.adcode));

    const header = createElement("header", "weather-header");
    const headerCopy = createElement("div");
    headerCopy.append(
      createElement("p", "weather-eyebrow", t("realTimeWeather")),
      createElement("h3", "", city.name),
      createElement("p", "weather-location", `${city.label || city.adcode} · ${formatWeatherDate(casts[0]?.date)}`)
    );
    const statusPill = createElement("span", "weather-status-pill");
    statusPill.append(createElement("span", "weather-status-dot"), document.createTextNode(condition || status || t("pendingUpdate")));
    const headerActions = createElement("div", "weather-header-actions");
    headerActions.append(statusPill, remove);
    header.append(headerCopy, headerActions);

    const hero = createElement("div", "weather-hero");
    const heroIcon = createElement("span", "weather-hero-icon");
    heroIcon.append(createWeatherIcon(condition));
    const tempBlock = createElement("div", "weather-temp-block");
    const temp = live?.temperature ? `${live.temperature}°` : "--°";
    tempBlock.append(
      createElement("div", "weather-temp", temp),
      createElement("p", "", getWeatherSummary(condition, live))
    );
    hero.append(heroIcon, tempBlock);

    card.append(header, hero);

    const firstCast = casts[0];
    if (firstCast) {
      const comfort = createElement("section", "weather-comfort-card");
      const comfortHead = createElement("div");
      comfortHead.append(
        createElement("span", "weather-comfort-label", t("todayTemp")),
        createElement("strong", "", `${firstCast.daytemp || "--"}° / ${firstCast.nighttemp || "--"}°`)
      );
      const line = createElement("div", "weather-comfort-line");
      const range = createElement("span");
      setTemperatureRange(range, firstCast.nighttemp, firstCast.daytemp);
      line.append(range);
      comfort.append(comfortHead, line, createElement("p", "", getWeatherAdvice(firstCast, condition)));
      card.append(comfort);
    }

    const stats = createElement("div", "weather-stats");
    [
      [t("humidity"), live?.humidity ? `${live.humidity}%` : t("unavailable"), getHumidityDesc(live?.humidity)],
      [t("windDirection"), live?.winddirection || casts[0]?.daywind || t("unavailable"), t("gentleBreeze")],
      [t("windPower"), live?.windpower ? `${live.windpower} 级` : casts[0]?.daypower ? `${casts[0].daypower} 级` : t("unavailable"), getWindDesc(live?.windpower || casts[0]?.daypower)],
      [t("pressure"), live?.pressure ? `${live.pressure} hPa` : t("unavailable"), live?.pressure ? t("pressureStable") : t("waitingUpdate")]
    ].forEach(([label, value, desc]) => {
      const item = createElement("span", "weather-stat");
      item.append(createElement("small", "", label), createElement("strong", "", value), createElement("em", "", desc));
      stats.append(item);
    });
    card.append(stats);

    if (casts.length) {
      const forecastSection = createElement("section", "weather-forecast-section");
      const sectionTitle = createElement("div", "weather-section-title");
      sectionTitle.append(createElement("h4", "", t("nextThreeDays")), createElement("span", "", t("tempTrend")));
      const forecastRow = createElement("div", "weather-forecast");
      casts.forEach((cast, index) => {
        const item = createElement("span", `weather-forecast-day weather-card-${getWeatherTone(cast.dayweather || cast.nightweather || "")}${index === 0 ? " is-active" : ""}`);
        const top = createElement("span", "weather-forecast-top");
        const dateCopy = createElement("span");
        const formattedDate = formatWeatherDate(cast.date);
        dateCopy.append(createElement("strong", "", formattedDate.replace(/周.*/, "")), createElement("small", "", formattedDate.match(/周./)?.[0] || t("forecast")));
        const smallIcon = createElement("span", "weather-forecast-icon");
        smallIcon.append(createWeatherIcon(cast.dayweather || cast.nightweather || "", true));
        top.append(dateCopy, smallIcon);
        const range = createElement("span", "weather-forecast-range");
        const fill = createElement("i");
        setTemperatureRange(fill, cast.nighttemp, cast.daytemp);
        range.append(fill);
        item.append(
          top,
          createElement("span", "weather-forecast-temp", `${cast.daytemp || "--"}° / ${cast.nighttemp || "--"}°`),
          range,
          createElement("em", "", cast.dayweather || cast.nightweather || "")
        );
        forecastRow.append(item);
      });
      forecastSection.append(sectionTitle, forecastRow);
      card.append(forecastSection);
    }

    const footer = createElement("footer", "weather-card-foot");
    footer.append(createElement("span", "", live?.reporttime || forecast?.reporttime || t("notUpdated")));
    const refresh = createElement("button", "", t("refresh"));
    refresh.type = "button";
    refresh.addEventListener("click", () => refreshWeatherCity(city));
    footer.append(refresh);
    card.append(footer);
    return card;
  }

  function createWeatherIcon(weather, small = false) {
    const type = getWeatherTone(weather);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `weather-icon${small ? " is-small" : ""}`);
    svg.setAttribute("viewBox", "0 0 72 72");
    svg.setAttribute("aria-hidden", "true");
    if (type === "sun") {
      appendSvgCircle(svg, "sun-core", 36, 36, 13);
      [["36", "8", "36", "18"], ["36", "54", "36", "64"], ["8", "36", "18", "36"], ["54", "36", "64", "36"], ["17", "17", "24", "24"], ["48", "48", "55", "55"], ["55", "17", "48", "24"], ["24", "48", "17", "55"]].forEach((line) => appendSvgLine(svg, "sun-ray", ...line));
      return svg;
    }
    appendSvgCircle(svg, "cloud-back-sun", 49, 24, 11);
    appendSvgPath(svg, "cloud-main", "M23.2 51C14.8 51 9 45.7 9 38.5C9 32.3 13.9 27.2 20.4 26.8C22.9 19.2 29.4 14.6 37 14.6C45.8 14.6 53 21 54.4 29.6C60 30.5 64 35 64 40.3C64 46.3 58.9 51 51.6 51H23.2Z");
    appendSvgPath(svg, "cloud-highlight", "M22 31.8C25.2 23.7 32.8 20.2 40.2 22");
    if (type === "rain" || type === "storm") {
      appendSvgLine(svg, "weather-drop", 25, 56, 21, 64);
      appendSvgLine(svg, "weather-drop", 39, 56, 35, 64);
      appendSvgLine(svg, "weather-drop", 53, 56, 49, 64);
    }
    if (type === "snow") {
      appendSvgLine(svg, "weather-drop", 25, 57, 25, 65);
      appendSvgLine(svg, "weather-drop", 21, 61, 29, 61);
      appendSvgLine(svg, "weather-drop", 48, 57, 48, 65);
      appendSvgLine(svg, "weather-drop", 44, 61, 52, 61);
    }
    if (type === "storm") {
      appendSvgPath(svg, "weather-bolt", "M42 54l-8 12h8l-4 10 12-16h-8z");
    }
    return svg;
  }

  function appendSvgPath(svg, className, d) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", className);
    path.setAttribute("d", d);
    svg.append(path);
  }

  function appendSvgCircle(svg, className, cx, cy, r) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", className);
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", r);
    svg.append(circle);
  }

  function appendSvgLine(svg, className, x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("class", className);
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    svg.append(line);
  }

  function getWeatherTone(weather) {
    if (/雪|冰雹|冻/.test(weather)) return "snow";
    if (/雷/.test(weather)) return "storm";
    if (/雨|阵雨|暴雨/.test(weather)) return "rain";
    if (/雾|霾|沙|尘/.test(weather)) return "mist";
    if (/阴|云/.test(weather)) return "cloud";
    return "sun";
  }

  function setTemperatureRange(element, low, high) {
    const min = 12;
    const max = 35;
    const lowNumber = Number(low);
    const highNumber = Number(high);
    const start = Number.isFinite(lowNumber) ? ((lowNumber - min) / (max - min)) * 100 : 28;
    const end = Number.isFinite(highNumber) ? ((highNumber - min) / (max - min)) * 100 : 74;
    element.style.setProperty("--start", `${Math.max(0, Math.min(100, start))}%`);
    element.style.setProperty("--end", `${Math.max(0, Math.min(100, end))}%`);
  }

  function getWeatherSummary(condition, live) {
    const humidity = Number(live?.humidity);
    const humidityText = Number.isFinite(humidity) && humidity >= 80 ? t("highHumidity") : t("comfortable");
    if (/雨|阵雨|暴雨/.test(condition)) return `${condition} · ${t("bringUmbrella")} · ${humidityText}`;
    if (/雪|冰雹|冻/.test(condition)) return `${condition} · ${t("stayWarm")} · ${t("mindRoad")}`;
    if (/雾|霾|沙|尘/.test(condition)) return `${condition} · ${t("lowVisibility")} · ${t("reduceExposure")}`;
    if (/阴|云/.test(condition)) return `${condition} · ${humidityText} · ${t("feelsCool")}`;
    return `${condition || t("sunnyDefault")} · ${t("sunshine")} · ${t("goodToGoOut")}`;
  }

  function getWeatherAdvice(cast, condition) {
    const high = cast?.daytemp || "--";
    const low = cast?.nighttemp || "--";
    const weather = cast?.dayweather || condition;
    if (/雨|阵雨|暴雨/.test(weather)) return t("rainAdvice", { high, low });
    if (/阴|云/.test(weather)) return t("cloudyAdvice", { weather, high, low });
    if (/雪|冰雹|冻/.test(weather)) return t("snowAdvice", { high, low });
    return t("sunnyAdvice", { high, low });
  }

  function getHumidityDesc(value) {
    const humidity = Number(value);
    if (!Number.isFinite(humidity)) return t("waitingUpdate");
    if (humidity >= 80) return t("humid");
    if (humidity <= 35) return t("dry");
    return t("comfortable");
  }

  function getWindDesc(value) {
    const number = Number(String(value || "").match(/\d+/)?.[0]);
    if (!Number.isFinite(number)) return t("mildWind");
    if (number <= 3) return t("comfy");
    if (number <= 5) return t("windy");
    return t("strongWind");
  }

  function formatWeatherDate(value) {
    if (!value) {
      return t("forecast");
    }
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(getLocaleCode(), { weekday: "short", month: "numeric", day: "numeric" }).format(date);
  }

  async function addWeatherCity(city) {
    if (state.weather.cities.some((item) => item.adcode === city.adcode)) {
      return;
    }
    state.weather.cities.unshift({
      name: city.name,
      adcode: city.adcode,
      label: city.label,
      level: city.level
    });
    state.weather.query = "";
    elements.weatherCitySearch.value = "";
    await saveWeather();
    renderWeather();
    refreshWeatherCity(state.weather.cities[0]);
  }

  async function removeWeatherCity(adcode) {
    state.weather.cities = state.weather.cities.filter((city) => city.adcode !== adcode);
    delete state.weather.reports[adcode];
    await saveWeather();
    renderWeather();
  }

  async function refreshWeatherIfNeeded(force = false) {
    const maxAge = 20 * 60 * 1000;
    if (!force && state.weather.updatedAt && Date.now() - state.weather.updatedAt < maxAge) {
      renderWeather();
      return;
    }
    await refreshWeather();
  }

  async function refreshWeather() {
    if (!state.weather.cities.length || state.weather.loading) {
      return;
    }
    state.weather.loading = true;
    state.weather.error = "";
    renderWeather();
    await Promise.all(state.weather.cities.map((city) => refreshWeatherCity(city, false)));
    state.weather.loading = false;
    await saveWeather();
    renderWeather();
  }

  async function refreshWeatherCity(city, persist = true) {
    try {
      const report = await fetchWeather(city);
      state.weather.reports[city.adcode] = report;
      state.weather.error = "";
    } catch (error) {
      state.weather.reports[city.adcode] = { ...(state.weather.reports[city.adcode] || {}), error: t("weatherUnavailable") };
      state.weather.error = t("weatherUnavailable");
    }
    if (persist) {
      await saveWeather();
    }
    renderWeather();
  }

  async function fetchWeather(city) {
    const baseUrl = `https://restapi.amap.com/v3/weather/weatherInfo?key=${amapWeatherKey}&city=${encodeURIComponent(city.adcode)}&extensions=base`;
    const allUrl = `https://restapi.amap.com/v3/weather/weatherInfo?key=${amapWeatherKey}&city=${encodeURIComponent(city.adcode)}&extensions=all`;
    const [liveResult, forecastResult] = await Promise.all([fetchWeatherJson(baseUrl), fetchWeatherJson(allUrl)]);
    return {
      city,
      live: liveResult.lives?.[0] || null,
      forecast: forecastResult.forecasts?.[0] || null,
      fetchedAt: Date.now()
    };
  }

  async function fetchWeatherJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`weather ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== "1") {
      throw new Error(data.info || "weather request failed");
    }
    return data;
  }

  function renderQuote() {
    if (state.focusMode) {
      elements.momentLine.textContent = getFocusLine();
      return;
    }
    if (state.settings.showQuote && state.quote?.text) {
      const author = state.quote.author ? `  ${state.quote.author}` : "";
      elements.momentLine.textContent = `${state.quote.text}${author}`;
      return;
    }
    elements.momentLine.textContent = getMomentLine(new Date());
  }

  async function refreshQuoteIfNeeded(force = false) {
    if (!state.settings.showQuote) {
      state.quote = null;
      renderQuote();
      return;
    }
    const maxAge = 6 * 60 * 60 * 1000;
    if (!force && state.quote?.text && Date.now() - (state.quote.updatedAt || 0) < maxAge) {
      renderQuote();
      return;
    }
    const quote = await fetchHitokotoQuote();
    if (quote) {
      state.quote = { ...quote, updatedAt: Date.now() };
      await saveQuote();
    }
    renderQuote();
  }

  async function fetchHitokotoQuote() {
    try {
      const response = await fetch(`https://v1.hitokoto.cn/?encode=json&max_length=42&_=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) {
        return null;
      }
      const quote = await response.json();
      if (!quote?.hitokoto) {
        return null;
      }
      const source = quote.from_who || quote.from || "一言";
      return {
        provider: "hitokoto",
        providerName: "一言",
        text: quote.hitokoto,
        author: source ? `— ${source}` : ""
      };
    } catch {
      return null;
    }
  }

  function applySettings() {
    applyLanguage();
    document.documentElement.dataset.mainView = state.mainView || "work";
    document.documentElement.dataset.theme = state.settings.theme || "light";
    document.documentElement.dataset.wallpaper = state.settings.wallpaper || "none";
    elements.todoHome.classList.toggle("is-hidden", !state.settings.showTodos);
    elements.musicWidget.hidden = !state.settings.showMusicWidget;
    renderModuleToggles();
    elements.quickSites.classList.toggle("is-hidden", !state.settings.showCustomLinks);
    document.querySelectorAll("[data-setting='language'] button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.value === state.settings.language);
    });
    document.querySelectorAll("[data-setting='searchEngine'] button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.value === state.settings.searchEngine);
    });
    document.querySelectorAll("[data-setting='theme'] button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.value === state.settings.theme);
    });
    document.querySelectorAll("[data-setting='wallpaper'] button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.value === state.settings.wallpaper);
    });
    document.querySelectorAll("[data-setting='showQuote'] button").forEach((button) => {
      button.classList.toggle("is-active", (button.dataset.value === "true") === Boolean(state.settings.showQuote));
    });
    document.querySelectorAll("[data-toggle]").forEach((button) => {
      button.classList.toggle("is-active", Boolean(state.settings[button.dataset.toggle]));
    });
  }

  function updateFirstResult() {
    if (!state.query) {
      return;
    }
    const links = getAllLinks().filter((item) => itemMatchesQuery(item, state.query));
    const history = state.history.filter((item) => itemMatchesQuery(item, state.query));
    state.firstResultUrl = links[0]?.url || history[0]?.url || "";
  }

  function openDialog(link) {
    const isEditing = Boolean(link);
    elements.dialogTitle.textContent = isEditing ? t("editLink") : t("addLink");
    elements.linkDialogTabs.hidden = isEditing;
    elements.deleteLinkButton.hidden = !isEditing;
    elements.linkId.value = link?.id || "";
    elements.linkTitle.value = link?.title || "";
    elements.linkUrl.value = link?.url || "";
    elements.linkGroup.value = link?.group || "工作";
    setLinkDialogTab("manual");
    renderPopularSites();
    elements.linkDialog.showModal();
    elements.linkTitle.focus();
  }

  function closeDialog() {
    elements.linkDialog.close();
    elements.linkForm.reset();
    setLinkDialogTab("manual");
  }

  function openTodoArchive() {
    renderTodoArchive();
    elements.todoArchiveDialog.showModal();
  }

  function closeTodoArchive() {
    elements.todoArchiveDialog.close();
  }

  function setLinkDialogTab(tabName) {
    state.linkDialogTab = tabName;
    elements.linkDialogTabButtons.forEach((button) => {
      const isActive = button.dataset.linkDialogTab === tabName;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    elements.linkDialogPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.linkDialogPanel === tabName);
    });
    if (tabName === "manual" && elements.linkDialog.open) {
      elements.linkTitle.focus();
    }
  }

  function renderPopularSites() {
    elements.popularSiteList.replaceChildren();
    const existingUrls = new Set(state.links.map((link) => normalizeComparableUrl(link.url)));
    popularSites.forEach((site) => {
      const button = createElement("button", "popular-site-item");
      const exists = existingUrls.has(normalizeComparableUrl(site.url));
      button.type = "button";
      button.disabled = exists;
      button.title = exists ? t("added") : site.url;
      button.append(createFavicon(site));
      const copy = createElement("span", "popular-site-copy");
      copy.append(createElement("strong", "", site.title), createElement("span", "", getHost(site.url)));
      button.append(copy, createElement("small", "", exists ? "已添加" : site.group));
      button.addEventListener("click", () => addPopularSite(site));
      elements.popularSiteList.append(button);
    });
  }

  async function addPopularSite(site) {
    const normalizedUrl = normalizeComparableUrl(site.url);
    if (state.links.some((link) => normalizeComparableUrl(link.url) === normalizedUrl)) {
      renderPopularSites();
      return;
    }
    state.links.unshift({
      id: crypto.randomUUID(),
      title: site.title,
      url: site.url,
      group: site.group
    });
    await saveLinks();
    closeDialog();
    render();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const id = elements.linkId.value || crypto.randomUUID();
    const link = {
      id,
      title: elements.linkTitle.value.trim(),
      url: normalizeUrl(elements.linkUrl.value),
      group: elements.linkGroup.value.trim() || "未分组"
    };

    const index = state.links.findIndex((item) => item.id === id);
    const existing = state.links[index];
    if (index >= 0) {
      state.links.splice(index, 1, link);
    } else {
      state.links.unshift(link);
    }

    await saveLinks();
    closeDialog();
    render();
  }

  async function handleDelete() {
    const id = elements.linkId.value;
    state.links = state.links.filter((link) => link.id !== id);
    await saveLinks();
    closeDialog();
    render();
  }

  function bindEvents() {
    elements.mainTabButtons.forEach((button) => {
      button.addEventListener("click", () => setMainView(button.dataset.mainTab));
    });
    document.addEventListener("click", handleTabManagerAction);
    if (elements.archiveToggle) {
      elements.archiveToggle.addEventListener("click", () => {
        elements.archiveBody.hidden = !elements.archiveBody.hidden;
        elements.archiveToggle.classList.toggle("open", !elements.archiveBody.hidden);
      });
    }
    if (elements.archiveSearch) {
      elements.archiveSearch.addEventListener("input", filterArchiveItems);
    }
    elements.readingRandomButton.addEventListener("click", showRandomReadingReview);
    elements.readingPreviousButton.addEventListener("click", showPreviousReadingReview);
    elements.readingWereadSettingsButton.addEventListener("click", openWereadSyncSettings);
    elements.readingWereadSettingsCloseButton.addEventListener("click", closeWereadSyncSettings);
    elements.readingWereadSyncDrawerBackdrop.addEventListener("click", (event) => {
      if (event.target === elements.readingWereadSyncDrawerBackdrop) {
        closeWereadSyncSettings();
      }
    });
    elements.readingCopyButton.addEventListener("click", copyActiveReadingReview);
    elements.readingExportButton.addEventListener("click", exportActiveReadingShareImage);
    elements.readingShareDownloadButton.addEventListener("click", downloadReadingSharePreview);
    elements.readingShareCloseButton.addEventListener("click", closeReadingSharePreview);
    elements.readingShareCancelButton.addEventListener("click", closeReadingSharePreview);
    elements.wereadOpenKeyPageButton.addEventListener("click", handleWereadOpenKeyPage);
    elements.wereadSaveSyncButton.addEventListener("click", handleWereadSaveAndSync);
    elements.wereadSyncNowButton.addEventListener("click", handleWereadSyncNow);
    elements.wereadClearKeyButton.addEventListener("click", handleWereadClearKey);
    elements.wereadClearNotesButton.addEventListener("click", handleWereadClearNotes);
    elements.readingShareDialog.addEventListener("click", (event) => {
      if (event.target === elements.readingShareDialog) {
        closeReadingSharePreview();
      }
    });
    elements.readingShareDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeReadingSharePreview();
    });
    elements.anniversaryAllButton.addEventListener("click", openAnniversaryDrawer);
    elements.anniversaryAddButton.addEventListener("click", () => openAnniversaryDialog());
    elements.anniversaryDrawerAddButton.addEventListener("click", () => openAnniversaryDialog());
    elements.anniversaryDrawerCloseButton.addEventListener("click", closeAnniversaryDrawer);
    elements.anniversaryDrawerBackdrop.addEventListener("click", (event) => {
      if (event.target === elements.anniversaryDrawerBackdrop) {
        closeAnniversaryDrawer();
      }
    });
    elements.anniversarySearchInput.addEventListener("input", (event) => {
      state.anniversaryQuery = event.target.value.trim();
      renderAnniversaryDrawer();
    });
    elements.anniversaryCalendarButtons.forEach((button) => {
      button.addEventListener("click", () => setAnniversaryCalendar(button.dataset.anniversaryCalendar));
    });
    elements.anniversaryForm.addEventListener("submit", handleAnniversarySubmit);
    elements.anniversaryDialogCloseButton.addEventListener("click", closeAnniversaryDialog);
    elements.anniversaryCancelButton.addEventListener("click", closeAnniversaryDialog);
    elements.anniversaryDeleteButton.addEventListener("click", deleteActiveAnniversary);
    elements.anniversaryDialog.addEventListener("click", (event) => {
      if (event.target === elements.anniversaryDialog) {
        closeAnniversaryDialog();
      }
    });
    elements.anniversaryDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeAnniversaryDialog();
    });
    elements.closeDialogButton.addEventListener("click", closeDialog);
    elements.cancelDialogButton.addEventListener("click", closeDialog);
    elements.deleteLinkButton.addEventListener("click", handleDelete);
    elements.linkDialogTabButtons.forEach((button) => {
      button.addEventListener("click", () => setLinkDialogTab(button.dataset.linkDialogTab));
    });
    elements.linkForm.addEventListener("submit", handleSubmit);
    elements.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.query.startsWith("+")) {
        const value = state.query.slice(1).trim();
        openDialog();
        if (value) {
          elements.linkUrl.value = normalizeUrl(value);
        }
        return;
      }
      if (state.siteSearch && state.query) {
        const results = getSiteScopedItems(state.query);
        if (results[state.searchIndex]) {
          window.location.href = results[state.searchIndex].url;
        }
        return;
      }
      if (state.siteSearch && !state.query) {
        window.location.href = normalizeUrl(state.siteSearch.host);
        return;
      }
      if (state.query && hasSelectedSearchProvider() && submitToSearchProvider()) {
        return;
      }
      if (state.query && state.firstResultUrl) {
        window.location.href = state.firstResultUrl;
        return;
      }
      if (state.query) {
        submitQueryToSearchProvider("google", state.query);
      }
    });
    elements.searchInput.addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      state.searchIndex = 0;
      updateFirstResult();
      renderSearchPanel();
    });
    elements.searchInput.addEventListener("keydown", (event) => {
      const results = state.siteSearch ? getSiteScopedItems(state.query) : getSearchItems(state.query);
      if (event.shiftKey && event.key === "Enter") {
        const title = elements.searchInput.value.trim();
        if (title) {
          event.preventDefault();
          addSearchQueryAsTodo();
        }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        const query = elements.searchInput.value.trim();
        if (query) {
          event.preventDefault();
          submitQueryToSearchProvider("chatgpt", query);
        }
        return;
      }
      if (event.key === "Tab" && state.tabCandidate) {
        event.preventDefault();
        activateSiteSearch(state.tabCandidate);
        return;
      }
      if (event.key === "ArrowDown" && results.length) {
        event.preventDefault();
        state.searchIndex = Math.min(results.length - 1, state.searchIndex + 1);
        renderSearchPanel();
        return;
      }
      if (event.key === "ArrowUp" && results.length) {
        event.preventDefault();
        state.searchIndex = Math.max(0, state.searchIndex - 1);
        renderSearchPanel();
        return;
      }
      if (event.key === "Enter" && results[state.searchIndex]) {
        state.firstResultUrl = results[state.searchIndex].url;
      }
      if (event.key === "Escape") {
        if (state.siteSearch) {
          clearSiteSearch();
          return;
        }
        elements.searchInput.value = "";
        state.query = "";
        renderSearchPanel();
      }
    });
    elements.searchInput.addEventListener("focus", renderSearchPanel);
    elements.searchInput.addEventListener("blur", () => {
      window.setTimeout(renderSearchPanel, 120);
    });
    elements.searchProviderButton.addEventListener("click", (event) => {
      event.preventDefault();
      toggleSearchProviderMenu(elements.searchProviderMenu, elements.searchProviderButton);
    });
    elements.searchProviderMenu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-search-provider]");
      if (button) {
        setSearchProvider(button.dataset.searchProvider);
      }
    });
    elements.clearSiteSearch.addEventListener("click", clearSiteSearch);
    elements.noteCreateButton.addEventListener("click", createNote);
    elements.todoModuleToggle.addEventListener("click", () => setSetting("showTodos", !state.settings.showTodos));
    elements.musicModuleToggle.addEventListener("click", () => setSetting("showMusicWidget", !state.settings.showMusicWidget));
    elements.quickSites.addEventListener("contextmenu", (event) => {
      if (!event.target.closest(".quick-site-card")) {
        return;
      }
      event.preventDefault();
      enterQuickSitesEditMode();
    });
    elements.quickSiteRail.addEventListener("scroll", () => {
      window.clearTimeout(elements.quickSiteRail._scrollTimer);
      elements.quickSiteRail._scrollTimer = window.setTimeout(updateQuickSitePage, 80);
    });
    if ("onscrollend" in window) {
      elements.quickSiteRail.addEventListener("scrollend", updateQuickSitePage);
    }
    elements.focusToggle.addEventListener("click", toggleFocusMode);
    elements.todoArchiveButton.addEventListener("click", openTodoArchive);
    elements.closeTodoArchiveButton.addEventListener("click", closeTodoArchive);
    elements.todoArchiveDialog.addEventListener("click", (event) => {
      if (event.target === elements.todoArchiveDialog) {
        closeTodoArchive();
      }
    });
    elements.todoForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const title = elements.todoInput.value.trim();
      if (!title) {
        return;
      }
      addTodo(title).then((added) => {
        if (added) {
          elements.todoInput.value = "";
        }
      });
    });
    elements.drawerTabs.forEach((button) => {
      button.addEventListener("click", () => setDrawerTab(button.dataset.drawerTab));
    });
    if (elements.recentSearch) {
      elements.recentSearch.addEventListener("input", (event) => {
        state.recentQuery = event.target.value.trim().toLowerCase();
        renderHistory();
        renderDrawerTabs();
      });
    }
    elements.bookmarkSearch.addEventListener("input", (event) => {
      state.bookmarkQuery = event.target.value.trim().toLowerCase();
      renderBookmarks();
      renderDrawerTabs();
    });
    elements.homePomodoroStart.addEventListener("click", startPomodoro);
    elements.homePomodoroReset.addEventListener("click", resetPomodoro);
    elements.pomodoroModeButtons.forEach((button) => {
      button.addEventListener("click", () => setPomodoroMode(button.dataset.pomodoroMode));
    });
    elements.commandInput.addEventListener("input", (event) => {
      state.commandQuery = event.target.value.trim();
      state.commandIndex = 0;
      renderCommandResults();
    });
    elements.commandInput.addEventListener("keydown", handleCommandKeydown);
    elements.commandSearchProviderButton.addEventListener("click", (event) => {
      event.preventDefault();
      toggleSearchProviderMenu(elements.commandSearchProviderMenu, elements.commandSearchProviderButton);
    });
    elements.commandSearchProviderMenu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-search-provider]");
      if (button) {
        setSearchProvider(button.dataset.searchProvider);
      }
    });
    elements.commandPalette.addEventListener("click", (event) => {
      if (event.target.classList.contains("command-backdrop")) {
        closeCommandPalette();
      }
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".search-provider")) {
        closeSearchProviderMenu();
      }
      if (state.quickSitesEditing && !event.target.closest(".quick-sites")) {
        exitQuickSitesEditMode();
      }
    });
    document.addEventListener("keydown", handleGlobalKeydown);
    elements.settingsPanel.addEventListener("click", handleSettingsClick);
    elements.musicWidget.addEventListener("click", handleMusicClick);
    elements.musicWidget.addEventListener("input", handleMusicSeek);
    elements.musicAudio.addEventListener("play", () => {
      state.music.isPlaying = true;
      updateMusicProgress();
    });
    elements.musicAudio.addEventListener("pause", () => {
      state.music.isPlaying = false;
      updateMusicProgress();
    });
    elements.musicAudio.addEventListener("timeupdate", updateMusicProgress);
    elements.musicAudio.addEventListener("loadedmetadata", updateMusicProgress);
    elements.musicAudio.addEventListener("ended", () => playMusicTrack(state.music.activeIndex + 1));
    elements.drawerEdge.addEventListener("click", openRecentDrawer);
    elements.weatherEdge.addEventListener("click", openWeatherDrawer);
    elements.closeWeatherButton.addEventListener("click", closeWeatherDrawer);
    elements.weatherSearchForm.addEventListener("submit", (event) => event.preventDefault());
    elements.weatherCitySearch.addEventListener("input", (event) => {
      state.weather.query = event.target.value.trim();
      renderWeatherCityResults();
    });
    elements.closeRecentButton.addEventListener("click", closeRecentDrawer);
    elements.drawerScrim.addEventListener("click", closeDrawers);
  }

  function handleGlobalKeydown(event) {
    if (handleQuickSubmitShortcut(event)) {
      return;
    }
    if (event.key === "Escape" && state.quickSitesEditing) {
      event.preventDefault();
      exitQuickSitesEditMode();
      return;
    }
    if (
      event.key === "Escape" &&
      (!elements.anniversaryDrawerBackdrop.hidden || elements.anniversaryDialog.open || !elements.readingWereadSyncDrawerBackdrop.hidden)
    ) {
      event.preventDefault();
      closeWereadSyncSettings();
      closeAnniversarySurfaces();
      return;
    }
    const isCommandKey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
    if (isCommandKey) {
      event.preventDefault();
      state.commandOpen ? closeCommandPalette() : openCommandPalette();
      return;
    }
    if (!state.commandOpen) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeCommandPalette();
    }
  }

  function handleQuickSubmitShortcut(event) {
    if (!event.altKey || !(event.metaKey || event.ctrlKey)) {
      return false;
    }
    const key = event.code?.replace("Key", "").toLowerCase();
    if (!["g", "k", "t"].includes(key)) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    if (key === "g") {
      submitActiveQueryToProvider("google");
      return true;
    }
    if (key === "k") {
      submitActiveQueryToProvider("chatgpt");
      return true;
    }
    addActiveQueryAsTodo();
    return true;
  }

  function handleCommandKeydown(event) {
    const actions = getFilteredCommandActions();
    if (event.shiftKey && event.key === "Enter") {
      const title = elements.commandInput.value.trim();
      if (title) {
        event.preventDefault();
        addCommandQueryAsTodo();
      }
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      const query = elements.commandInput.value.trim();
      if (query) {
        event.preventDefault();
        submitQueryToSearchProvider("chatgpt", query);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.commandIndex = Math.min(actions.length - 1, state.commandIndex + 1);
      renderCommandResults();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.commandIndex = Math.max(0, state.commandIndex - 1);
      renderCommandResults();
    }
    if (event.key === "Enter" && actions[state.commandIndex]) {
      event.preventDefault();
      runCommand(actions[state.commandIndex]);
      return;
    }
    if (event.key === "Enter" && state.commandQuery) {
      event.preventDefault();
      submitCommandQuery();
    }
  }

  async function init() {
    updateClock();
    setInterval(updateClock, 1000 * 20);
    bindEvents();
    await loadMainView();
    await loadSettings();
    await loadTodos();
    await loadNotes();
    await loadAnniversaries();
    await loadWeather();
    await loadPomodoro();
    await loadQuote();
    await loadLinks();
    await loadBookmarks();
    await loadFaviconCache();
    await loadHistoryTitleCache();
    await loadWereadSyncState();
    applySettings();
    loadMusicTracks();
    loadHistory();
    if (state.mainView === "tabs") {
      renderTabManager();
    }
    if (state.mainView === "reading") {
      loadWereadReviewData().then(renderReadingReview);
    }
    if (state.mainView === "anniversary") {
      renderAnniversaryReminderView();
    }
  }

  function updateClock() {
    const now = new Date();
    if (!state.focusMode) {
      renderClockTime(now);
    }
    elements.dayLine.textContent = new Intl.DateTimeFormat(getLocaleCode(), {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(now);
    elements.momentLine.textContent = state.focusMode ? getFocusLine() : getMomentLine(now);
    renderQuote();
  }

  function toggleFocusMode() {
    state.focusMode = !state.focusMode;
    elements.clockFace.hidden = state.focusMode;
    elements.focusFace.hidden = !state.focusMode;
    elements.focusToggle.classList.toggle("is-active", state.focusMode);
    elements.focusToggle.setAttribute("aria-pressed", String(state.focusMode));
    if (!state.focusMode) {
      renderClockTime(new Date());
    }
    renderQuote();
    renderPomodoro();
  }

  function getFocusLine() {
    return state.pomodoro.mode === "focus" ? t("focusLine") : t("breakLine");
  }

  function formatCurrentTime(now) {
    return new Intl.DateTimeFormat(getLocaleCode(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(now);
  }

  function renderClockTime(date) {
    const formatter = new Intl.DateTimeFormat(getLocaleCode(), {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const fragment = document.createDocumentFragment();
    formatter.formatToParts(date).forEach((part) => {
      const span = document.createElement("span");
      span.textContent = part.value;
      if (part.type === "literal" && part.value.includes(":")) {
        span.className = "time-separator";
      }
      fragment.append(span);
    });
    elements.timeLine.replaceChildren(fragment);
  }

  function getMomentLine(now) {
    const hour = now.getHours();
    if (hour < 6) return t("momentNight");
    if (hour < 11) return t("momentMorning");
    if (hour < 14) return t("momentNoon");
    if (hour < 18) return t("momentAfternoon");
    return t("momentEvening");
  }

  function getSearchUrl(query, provider = getCurrentSearchProvider()) {
    return `${provider.prefix}${encodeURIComponent(query)}`;
  }

  function getCurrentSearchProvider() {
    return searchProviders[state.settings.searchEngine] || localSearchProvider;
  }

  function hasSelectedSearchProvider() {
    return Boolean(searchProviders[state.settings.searchEngine]);
  }

  function submitToSearchProvider() {
    const provider = getCurrentSearchProvider();
    if (provider.action === "local") {
      return false;
    }
    if (provider.action === "todo") {
      addSearchQueryAsTodo();
      return true;
    }
    submitQueryToSearchProvider(state.settings.searchEngine, state.query);
    return true;
  }

  function submitCommandQuery() {
    if (hasSelectedSearchProvider() && state.settings.searchEngine !== "todo") {
      submitQueryToSearchProvider(state.settings.searchEngine, state.commandQuery);
      return;
    }
    if (state.settings.searchEngine === "todo") {
      addCommandQueryAsTodo();
      return;
    }
    submitQueryToSearchProvider("google", state.commandQuery);
  }

  function submitQueryToSearchProvider(providerId, query) {
    const provider = searchProviders[providerId];
    if (!provider || !query || provider.action) {
      return false;
    }
    window.location.href = getSearchUrl(query, provider);
    return true;
  }

  function getActiveQueryText() {
    if (state.commandOpen) {
      return elements.commandInput.value.trim();
    }
    return elements.searchInput.value.trim();
  }

  function submitActiveQueryToProvider(providerId) {
    const query = getActiveQueryText();
    if (!query) {
      return false;
    }
    closeSearchProviderMenu();
    return submitQueryToSearchProvider(providerId, query);
  }

  function addActiveQueryAsTodo() {
    const title = getActiveQueryText();
    if (!title) {
      if (state.commandOpen) {
        closeCommandPalette();
      }
      focusTodoInput();
      return;
    }
    if (state.commandOpen) {
      addCommandQueryAsTodo();
      return;
    }
    addSearchQueryAsTodo();
  }

  function addSearchQueryAsTodo() {
    const title = elements.searchInput.value.trim();
    if (!title) {
      return;
    }
    elements.searchInput.value = "";
    state.query = "";
    addTodo(title.slice(0, 120)).then((added) => {
      if (!added) {
        elements.searchInput.value = title;
        state.query = title;
      }
      renderSearchPanel();
    });
  }

  function addCommandQueryAsTodo() {
    const title = elements.commandInput.value.trim();
    if (!title) {
      return;
    }
    elements.commandInput.value = "";
    state.commandQuery = "";
    addTodo(title.slice(0, 120)).then((added) => {
      if (!added) {
        elements.commandInput.value = title;
        state.commandQuery = title;
      }
      renderCommandResults();
    });
  }

  function renderDrawerTabs() {
    elements.drawerTabs.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.drawerTab === state.drawerTab);
    });
    elements.drawerPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === state.drawerTab);
    });
  }

  function setDrawerTab(tabName) {
    state.drawerTab = tabName;
    renderDrawerTabs();
  }

  function renderPomodoro() {
    const remaining = Math.max(0, state.pomodoro.remaining);
    const minutes = Math.floor(remaining / 60).toString().padStart(2, "0");
    const seconds = Math.floor(remaining % 60).toString().padStart(2, "0");
    const label = `${minutes}:${seconds}`;
    elements.homePomodoroTime.textContent = label;
    setPomodoroActionIcon(elements.homePomodoroStart);
    elements.pomodoroModeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.pomodoroMode === state.pomodoro.mode);
    });
    renderQuote();
  }

  function getCommandActions() {
    const baseActions = [
      {
        id: "todo.add",
        group: t("operations"),
        name: t("addTodoCommand"),
        meta: t("addTodoMeta"),
        icon: "todo",
        shortcut: "T",
        keywords: "todo task 待办 任务",
        perform: () => focusTodoInput()
      },
      {
        id: "focus.toggle",
        group: t("operations"),
        name: state.focusMode ? t("closePomodoro") : t("openPomodoro"),
        meta: t("focusMeta"),
        icon: "focus",
        shortcut: "F",
        keywords: "focus pomodoro 番茄钟 专注",
        perform: () => {
          toggleFocusMode();
        }
      },
      {
        id: "link.add",
        group: t("operations"),
        name: t("addWebsite"),
        meta: t("addWebsiteMeta"),
        icon: "link",
        shortcut: "A",
        keywords: "add link website 添加 网址 收藏",
        perform: () => openDialog()
      },
      {
        id: "settings.open",
        group: t("settings"),
        name: t("openSettings"),
        meta: t("settingsMeta"),
        icon: "settings",
        shortcut: "S",
        keywords: "setting preference 设置",
        perform: () => openDrawerTab("settings")
      },
      {
        id: "weather.open",
        group: t("info"),
        name: t("openWeatherCommand"),
        meta: t("weatherMeta"),
        icon: "weather",
        shortcut: "W",
        keywords: "weather amap gaode 天气 高德 城市",
        perform: () => openWeatherDrawer()
      },
      ...["light", "dark"].map((theme) => ({
        id: `theme.${theme}`,
        group: t("appearance"),
        name: t("switchTheme", { theme: theme === "light" ? t("themeLight") : t("themeDark") }),
        meta: t("themeMeta"),
        icon: "theme",
        keywords: `theme color ${theme} 配色 外观`,
        perform: () => setSetting("theme", theme)
      }))
    ];

    const customLinks = state.links.map((link) => ({
      id: `custom.${link.id}`,
      group: t("customSitesGroup"),
      name: link.title,
      meta: getHost(link.url),
      icon: "link",
      keywords: `${link.title} ${link.url} ${link.group || ""}`,
      perform: () => {
        window.location.href = link.url;
      }
    }));
    const bookmarks = state.bookmarks.slice(0, 80).map((bookmark) => ({
      id: bookmark.id,
      group: t("bookmarks"),
      name: bookmark.title,
      meta: bookmark.group || getHost(bookmark.url),
      icon: "search",
      keywords: `${bookmark.title} ${bookmark.url} ${bookmark.group || ""}`,
      perform: () => {
        window.location.href = bookmark.url;
      }
    }));
    const history = state.history.slice(0, 80).map((item) => ({
      id: `history.${item.id || item.url}`,
      group: t("recent"),
      name: getHistoryTitle(item),
      meta: getHistorySubtitle(item),
      icon: "search",
      keywords: `${getHistoryTitle(item)} ${getHistorySubtitle(item)} ${item.url}`,
      perform: () => {
        window.location.href = item.url;
      }
    }));
    return [...baseActions, ...customLinks, ...bookmarks, ...history];
  }

  function renderCommandResults() {
    elements.commandResults.replaceChildren();
    const actions = getFilteredCommandActions();
    if (state.commandIndex >= actions.length) {
      state.commandIndex = Math.max(0, actions.length - 1);
    }
    if (!actions.length) {
      elements.commandResults.append(createElement("p", "empty", t("noCommandMatches")));
      return;
    }
    let previousGroup = "";
    actions.slice(0, 36).forEach((action, index) => {
      if (action.group !== previousGroup) {
        elements.commandResults.append(createElement("div", "command-group", action.group));
        previousGroup = action.group;
      }
      const item = createElement("button", `command-item${index === state.commandIndex ? " is-active" : ""}`);
      item.type = "button";
      item.setAttribute("role", "option");
      item.append(createCommandIcon(action.icon));
      const copy = createElement("span");
      copy.append(createElement("span", "command-name", action.name));
      copy.append(createElement("span", "command-meta", action.meta || ""));
      item.append(copy, createElement("span", "command-shortcut", action.shortcut || ""));
      item.addEventListener("mouseenter", () => {
        state.commandIndex = index;
        renderCommandResults();
      });
      item.addEventListener("click", () => runCommand(action));
      elements.commandResults.append(item);
    });
  }

  function createCommandIcon(name) {
    const icon = createElement("span", "command-icon");
    icon.append(createIconSvg(name));
    return icon;
  }

  function getFilteredCommandActions() {
    const query = state.commandQuery.toLowerCase();
    return getCommandActions().filter((action) => itemMatchesCommand(action, query));
  }

  function itemMatchesCommand(action, query) {
    if (!query) return true;
    return `${action.name} ${action.meta || ""} ${action.keywords || ""}`.toLowerCase().includes(query);
  }

  function openCommandPalette() {
    state.commandOpen = true;
    state.commandQuery = "";
    state.commandIndex = 0;
    elements.commandPalette.hidden = false;
    elements.commandInput.value = "";
    renderCommandResults();
    window.requestAnimationFrame(() => elements.commandInput.focus());
  }

  function closeCommandPalette(restoreFocus = true) {
    state.commandOpen = false;
    elements.commandPalette.hidden = true;
    if (restoreFocus && state.mainView === "work") {
      elements.searchInput.focus();
    }
  }

  function runCommand(action) {
    closeCommandPalette();
    action.perform();
  }

  function openDrawerTab(tabName) {
    setDrawerTab(tabName);
    openRecentDrawer();
  }

  async function setSetting(key, value) {
    state.settings[key] = value;
    await saveSettings();
    render();
    if (key === "language") {
      updateClock();
    }
    if (key === "showQuote") {
      refreshQuoteIfNeeded(true);
    }
    if (key === "showMusicWidget" && value) {
      loadMusicTracks();
    }
  }

  function toggleSearchProviderMenu(menuElement = elements.searchProviderMenu, buttonElement = elements.searchProviderButton) {
    const nextHidden = !menuElement.hidden;
    closeSearchProviderMenu();
    menuElement.hidden = nextHidden;
    buttonElement.setAttribute("aria-expanded", String(!nextHidden));
  }

  function closeSearchProviderMenu() {
    elements.searchProviderMenu.hidden = true;
    elements.searchProviderButton.setAttribute("aria-expanded", "false");
    if (elements.commandSearchProviderMenu && elements.commandSearchProviderButton) {
      elements.commandSearchProviderMenu.hidden = true;
      elements.commandSearchProviderButton.setAttribute("aria-expanded", "false");
    }
  }

  function setSearchProvider(providerId) {
    if (providerId && !searchProviders[providerId]) {
      return;
    }
    state.settings.searchEngine = providerId;
    closeSearchProviderMenu();
    saveSettings();
    render();
    (state.commandOpen ? elements.commandInput : elements.searchInput).focus();
  }

  function focusTodoInput() {
    elements.todoInput.focus();
  }

  function setPomodoroActionIcon(button) {
    button.innerHTML = state.pomodoro.running
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14"></path><path d="M16 5v14"></path></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg>';
  }

  function startPomodoro() {
    if (state.pomodoro.running) {
      pausePomodoro();
      return;
    }
    state.pomodoro.running = true;
    state.pomodoro.timerId = window.setInterval(tickPomodoro, 1000);
    renderPomodoro();
  }

  async function pausePomodoro() {
    window.clearInterval(state.pomodoro.timerId);
    state.pomodoro.timerId = 0;
    state.pomodoro.running = false;
    await savePomodoro();
    renderPomodoro();
  }

  async function tickPomodoro() {
    state.pomodoro.remaining -= 1;
    if (state.pomodoro.remaining <= 0) {
      const nextMode = state.pomodoro.mode === "focus" ? "break" : "focus";
      await setPomodoroMode(nextMode);
      if (!state.pomodoro.running) {
        startPomodoro();
      }
      return;
    }
    renderPomodoro();
  }

  async function setPomodoroMode(mode) {
    window.clearInterval(state.pomodoro.timerId);
    state.pomodoro.mode = mode;
    state.pomodoro.remaining = state.pomodoro.durations[mode];
    state.pomodoro.running = false;
    state.pomodoro.timerId = 0;
    await savePomodoro();
    renderPomodoro();
  }

  function resetPomodoro() {
    setPomodoroMode(state.pomodoro.mode);
  }

  function handleSettingsClick(event) {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }
    if (button.closest(".weread-sync-card")) {
      return;
    }
    event.preventDefault();
    const setting = button.closest("[data-setting]")?.dataset.setting;
    if (setting) {
      if (setting === "recentLimit") {
        state.settings[setting] = Number(button.dataset.value);
      } else if (setting === "showQuote") {
        state.settings[setting] = button.dataset.value === "true";
      } else {
        state.settings[setting] = button.dataset.value;
      }
    }
    if (button.dataset.toggle) {
      state.settings[button.dataset.toggle] = !state.settings[button.dataset.toggle];
    }
    saveSettings().then(() => {
      if (setting === "language") {
        updateClock();
      }
      if (setting === "showQuote" || button.dataset.toggle === "showQuote") {
        refreshQuoteIfNeeded(true);
      }
      if (button.dataset.toggle === "showMusicWidget" && state.settings.showMusicWidget) {
        loadMusicTracks();
      }
    });
    render();
  }

  function openRecentDrawer() {
    closeWeatherDrawer(false);
    elements.recentDrawer.classList.add("is-open");
    elements.recentDrawer.setAttribute("aria-hidden", "false");
    elements.drawerScrim.hidden = false;
  }

  function closeRecentDrawer(hideScrim = true) {
    elements.recentDrawer.classList.remove("is-open");
    elements.recentDrawer.setAttribute("aria-hidden", "true");
    if (hideScrim) {
      elements.drawerScrim.hidden = true;
    }
  }

  function openWeatherDrawer() {
    closeRecentDrawer(false);
    elements.weatherDrawer.classList.add("is-open");
    document.documentElement.classList.add("is-weather-drawer-open");
    elements.weatherDrawer.setAttribute("aria-hidden", "false");
    elements.drawerScrim.hidden = false;
    refreshWeatherIfNeeded();
    window.requestAnimationFrame(() => elements.weatherCitySearch.focus());
  }

  function closeWeatherDrawer(hideScrim = true) {
    elements.weatherDrawer.classList.remove("is-open");
    document.documentElement.classList.remove("is-weather-drawer-open");
    elements.weatherDrawer.setAttribute("aria-hidden", "true");
    if (hideScrim) {
      elements.drawerScrim.hidden = true;
    }
  }

  function closeDrawers() {
    closeRecentDrawer(false);
    closeWeatherDrawer(false);
    closeAnniversarySurfaces();
    elements.drawerScrim.hidden = true;
  }

  function bindLinkDrag(card) {
    card.addEventListener("dragstart", (event) => {
      if (state.query) {
        event.preventDefault();
        return;
      }
      state.dragLinkId = card.dataset.id;
      card.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", state.dragLinkId);
    });
    card.addEventListener("dragend", () => {
      state.dragLinkId = "";
      card.classList.remove("is-dragging");
      document.querySelectorAll(".is-drop-target").forEach((item) => item.classList.remove("is-drop-target"));
    });
    card.addEventListener("dragover", (event) => {
      if (!state.dragLinkId || state.dragLinkId === card.dataset.id) {
        return;
      }
      event.preventDefault();
      card.classList.add("is-drop-target");
    });
    card.addEventListener("dragleave", () => {
      card.classList.remove("is-drop-target");
    });
    card.addEventListener("drop", async (event) => {
      event.preventDefault();
      card.classList.remove("is-drop-target");
      const fromId = event.dataTransfer.getData("text/plain") || state.dragLinkId;
      const toId = card.dataset.id;
      if (!fromId || !toId || fromId === toId || toId.startsWith("bookmark:")) {
        return;
      }
      reorderLinks(fromId, toId);
      await saveLinks();
      renderCustomLinks();
    });
  }

  function reorderLinks(fromId, toId) {
    const fromIndex = state.links.findIndex((link) => link.id === fromId);
    const toIndex = state.links.findIndex((link) => link.id === toId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    const [moved] = state.links.splice(fromIndex, 1);
    state.links.splice(toIndex, 0, moved);
  }

  init();
})();
