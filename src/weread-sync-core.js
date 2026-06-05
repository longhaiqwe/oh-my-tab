(function (root) {
  "use strict";

  const skillVersion = "1.0.3";
  const gatewayUrl = "https://i.weread.qq.com/api/agent/gateway";
  const databaseName = "ohmytab-weread";
  const storeName = "payloads";
  const payloadKey = "current";
  const genericWereadBookNames = new Set(["", "未命名书籍", "公众号", "微信读书", "微信公众平台", "wechat", "该账号已注销"]);

  function validateApiKey(value) {
    return /^wrk-[A-Za-z0-9_-]+$/.test(String(value || "").trim());
  }

  function maskApiKey(value) {
    const key = String(value || "").trim();
    if (!key) return "";
    if (key.length <= 8) return `${key.slice(0, 4)}...`;
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function firstText(...values) {
    return values.map((value) => cleanText(value)).find(Boolean) || "";
  }

  function isMpBookId(bookId) {
    return String(bookId || "").startsWith("MP_");
  }

  function isGenericWereadBookName(title) {
    return genericWereadBookNames.has(cleanText(title).toLowerCase());
  }

  function firstSpecificTitle(...values) {
    const titles = values.map((value) => cleanText(value));
    return titles.find((title) => title && !isGenericWereadBookName(title)) || titles.find(Boolean) || "";
  }

  function getWereadArticleTitle(...records) {
    const candidates = records.flatMap((record) => {
      if (!record) return [];
      if (typeof record === "string") return [record];
      return [
        record.articleTitle,
        record.mpArticleTitle,
        record.refMpInfo && record.refMpInfo.title,
        record.mpInfo && record.mpInfo.title,
        record.book && record.book.articleTitle,
        record.book && record.book.chapterTitle,
        record.chapterTitle,
        record.chapterName,
        record.title,
        record.book && record.book.title
      ];
    });
    return candidates
      .map((value) => cleanText(value))
      .find((title) => title && !isGenericWereadBookName(title)) || "";
  }

  function getWereadBookAuthor({ bookId, book, fallbackAuthor = "" }) {
    return firstText(book && book.author, fallbackAuthor, isMpBookId(bookId) ? "公众号" : "");
  }

  function getWereadBookName({ bookId, book, fallbackTitle = "", articleTitle = "" }) {
    const bookTitle = isMpBookId(bookId)
      ? firstSpecificTitle(book && book.title, fallbackTitle)
      : firstText(book && book.title, fallbackTitle);
    if (isMpBookId(bookId)) {
      return articleTitle || (isGenericWereadBookName(bookTitle) ? "公众号文章" : bookTitle);
    }
    return bookTitle || "未命名书籍";
  }

  function getWereadSourceName({ bookId, book, fallbackTitle = "", bookName = "" }) {
    const sourceTitle = firstSpecificTitle(book && book.title, fallbackTitle);
    if (isMpBookId(bookId) && sourceTitle && sourceTitle !== bookName && !isGenericWereadBookName(sourceTitle)) {
      return sourceTitle;
    }
    return getWereadBookAuthor({ bookId, book });
  }

  function chapterTitleMap(chapters = []) {
    return chapters.reduce((map, chapter) => {
      map[String(chapter.chapterUid)] = chapter.title || "";
      return map;
    }, {});
  }

  function buildDeepLink(item) {
    if (!item || !item.bookId) return "";
    const [rangeStart, rangeEnd] = String(item.range || "").split("-");
    if (item.chapterUid && rangeStart && rangeEnd) {
      return `weread://bestbookmark?bookId=${encodeURIComponent(item.bookId)}&chapterUid=${encodeURIComponent(item.chapterUid)}&rangeStart=${encodeURIComponent(rangeStart)}&rangeEnd=${encodeURIComponent(rangeEnd)}`;
    }
    return `weread://reading?bId=${encodeURIComponent(item.bookId)}`;
  }

  async function callWereadGateway(apiKey, apiName, params = {}, fetchImpl = root.fetch) {
    if (!validateApiKey(apiKey)) {
      throw new Error("微信读书 API Key 格式无效。");
    }
    if (typeof fetchImpl !== "function") {
      throw new Error("当前环境不支持网络请求。");
    }

    const response = await fetchImpl(gatewayUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_name: apiName,
        skill_version: skillVersion,
        ...params
      })
    });

    if (!response || !response.ok) {
      throw new Error(`${apiName} 请求失败：HTTP ${response ? response.status : "unknown"}`);
    }

    const data = await response.json();
    if (data && data.upgrade_info) {
      throw new Error(data.upgrade_info.message || "微信读书 Skill 需要升级。");
    }
    if (data && data.errcode && data.errcode !== 0) {
      throw new Error(data.errmsg || data.msg || `${apiName} 返回错误 ${data.errcode}`);
    }
    return data || {};
  }

  async function fetchNotebooks(apiKey, fetchImpl = root.fetch, options = {}) {
    const books = [];
    const maxBooks = Number(options.maxBooks || 0);
    let lastSort;

    do {
      const page = await callWereadGateway(apiKey, "/user/notebooks", {
        count: 100,
        ...(lastSort === undefined ? {} : { lastSort })
      }, fetchImpl);
      const pageBooks = Array.isArray(page.books) ? page.books : [];
      books.push(...pageBooks);
      lastSort = pageBooks.at(-1) && pageBooks.at(-1).sort;
      if (!page.hasMore || !lastSort) break;
    } while (!maxBooks || books.length < maxBooks);

    return (maxBooks ? books.slice(0, maxBooks) : books).filter((entry) => {
      return Number(entry.noteCount || 0) + Number(entry.reviewCount || 0) > 0;
    });
  }

  function normalizeBookmark(bookEntry, payload) {
    const book = payload.book || bookEntry.book || {};
    const chapters = chapterTitleMap(payload.chapters || []);
    return (payload.updated || []).map((bookmark, index) => {
      const bookId = bookmark.bookId || bookEntry.bookId;
      const chapterName = chapters[String(bookmark.chapterUid)] || "";
      const articleTitle = isMpBookId(bookId) ? getWereadArticleTitle({ chapterTitle: chapterName }, bookmark) : "";
      const bookName = getWereadBookName({
        bookId,
        book,
        fallbackTitle: bookEntry.book && bookEntry.book.title,
        articleTitle
      });
      const item = {
        id: bookmark.bookmarkId || `${bookEntry.bookId}-mark-${index}`,
        type: "bookmark",
        bookId,
        bookName,
        bookAuthor: getWereadBookAuthor({ bookId, book, fallbackAuthor: bookEntry.book && bookEntry.book.author }),
        sourceName: getWereadSourceName({ bookId, book, fallbackTitle: bookEntry.book && bookEntry.book.title, bookName }),
        articleTitle,
        chapterUid: bookmark.chapterUid || "",
        chapterName: articleTitle && chapterName === articleTitle ? "" : chapterName,
        markText: cleanText(bookmark.markText || ""),
        noteContent: "",
        noteTime: Number(bookmark.createTime || 0),
        range: bookmark.range || ""
      };
      item.deepLink = buildDeepLink(item);
      return item;
    });
  }

  function unwrapReview(entry) {
    return (entry && entry.review) || entry || {};
  }

  async function fetchReviews(apiKey, bookEntry, fetchImpl = root.fetch) {
    const reviews = [];
    let synckey = 0;

    do {
      const page = await callWereadGateway(apiKey, "/review/list/mine", {
        bookid: String(bookEntry.bookId),
        count: 100,
        synckey
      }, fetchImpl);
      reviews.push(...(Array.isArray(page.reviews) ? page.reviews : []));
      synckey = page.synckey || 0;
      if (!page.hasMore || !synckey) break;
    } while (true);

    return reviews.map((entry, index) => {
      const review = unwrapReview(entry);
      const book = bookEntry.book || {};
      const bookId = review.bookId || bookEntry.bookId;
      const articleTitle = isMpBookId(bookId) ? getWereadArticleTitle(review, entry) : "";
      const bookName = getWereadBookName({ bookId, book, articleTitle });
      const item = {
        id: review.reviewId || `${bookEntry.bookId}-review-${index}`,
        type: "review",
        bookId,
        bookName,
        bookAuthor: getWereadBookAuthor({ bookId, book }),
        sourceName: getWereadSourceName({ bookId, book, bookName }),
        articleTitle,
        chapterUid: review.chapterUid || "",
        chapterName: articleTitle && review.chapterName === articleTitle ? "" : review.chapterName || "",
        markText: cleanText(review.abstract || ""),
        noteContent: cleanText(review.content || ""),
        noteTime: Number(review.createTime || 0),
        range: review.range || ""
      };
      item.deepLink = buildDeepLink(item);
      return item;
    });
  }

  async function fetchBookNotes(apiKey, bookEntry, fetchImpl = root.fetch) {
    const items = [];
    if (Number(bookEntry.noteCount || 0) > 0) {
      const bookmarks = await callWereadGateway(apiKey, "/book/bookmarklist", { bookId: String(bookEntry.bookId) }, fetchImpl);
      items.push(...normalizeBookmark(bookEntry, bookmarks));
    }
    if (Number(bookEntry.reviewCount || 0) > 0) {
      items.push(...(await fetchReviews(apiKey, bookEntry, fetchImpl)));
    }
    return items.filter((item) => item.bookName && (item.markText || item.noteContent));
  }

  function normalizeItems(items = []) {
    return (Array.isArray(items) ? items : [])
      .map((item, index) => {
        const bookName = firstText(item.bookName, item.title, item.book && item.book.title, "未命名书籍");
        const normalized = {
          id: item.id || item.bookmarkId || item.reviewId || `${item.bookId || "book"}-${index}`,
          type: item.type || (item.noteContent || item.content ? "review" : "bookmark"),
          bookId: item.bookId || "",
          bookName,
          bookAuthor: firstText(item.bookAuthor, item.author, item.book && item.book.author),
          sourceName: firstText(item.sourceName, item.mpName),
          articleTitle: firstText(item.articleTitle),
          chapterUid: item.chapterUid || "",
          chapterName: firstText(item.chapterName, item.chapterTitle),
          markText: cleanText(item.markText || item.abstract || ""),
          noteContent: cleanText(item.noteContent || item.content || item.reviewContent || ""),
          noteTime: Number(item.noteTime || item.createTime || 0),
          range: item.range || "",
          deepLink: item.deepLink || ""
        };
        normalized.deepLink = normalized.deepLink || buildDeepLink(normalized);
        return normalized;
      })
      .filter((item) => item.bookName && (item.markText || item.noteContent));
  }

  async function syncWereadNotes(apiKey, options = {}) {
    const fetchImpl = options.fetchImpl || root.fetch;
    const notebooks = await fetchNotebooks(apiKey, fetchImpl, options);
    const allItems = [];
    const skippedBooks = [];

    for (const bookEntry of notebooks) {
      try {
        allItems.push(...(await fetchBookNotes(apiKey, bookEntry, fetchImpl)));
      } catch (error) {
        skippedBooks.push({
          bookId: bookEntry.bookId || "",
          title: (bookEntry.book && bookEntry.book.title) || String(bookEntry.bookId || ""),
          error: error && error.message ? error.message : "同步失败"
        });
      }
    }

    const items = normalizeItems(allItems).sort((a, b) => Number(b.noteTime || 0) - Number(a.noteTime || 0));
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: "weread-skills-local",
      totalBooks: notebooks.length,
      totalItems: items.length,
      lastSyncStatus: skippedBooks.length ? "partial" : "success",
      skippedBooks,
      items
    };
  }

  function getIndexedDB() {
    return root.indexedDB || null;
  }

  function openDatabase() {
    const indexedDB = getIndexedDB();
    if (!indexedDB) {
      return Promise.reject(new Error("当前环境不支持 IndexedDB。"));
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(databaseName, 1);
      request.onerror = () => reject(request.error || new Error("打开 IndexedDB 失败。"));
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  function withStore(mode, callback) {
    return openDatabase().then((database) => {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        let settled = false;
        transaction.oncomplete = () => {
          database.close();
          if (!settled) resolve(undefined);
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error || new Error("IndexedDB 事务失败。"));
        };
        transaction.onabort = () => {
          database.close();
          reject(transaction.error || new Error("IndexedDB 事务中止。"));
        };
        callback(store, (value) => {
          settled = true;
          resolve(value);
        }, reject);
      });
    });
  }

  async function readLocalPayload() {
    if (!getIndexedDB()) return null;
    return withStore("readonly", (store, resolve, reject) => {
      const request = store.get(payloadKey);
      request.onerror = () => reject(request.error || new Error("读取微信读书本地数据失败。"));
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async function writeLocalPayload(payload) {
    if (!getIndexedDB()) {
      throw new Error("当前环境不支持 IndexedDB。");
    }
    return withStore("readwrite", (store, resolve, reject) => {
      const request = store.put(payload, payloadKey);
      request.onerror = () => reject(request.error || new Error("写入微信读书本地数据失败。"));
      request.onsuccess = () => resolve(payload);
    });
  }

  async function clearLocalPayload() {
    if (!getIndexedDB()) {
      throw new Error("当前环境不支持 IndexedDB。");
    }
    return withStore("readwrite", (store, resolve, reject) => {
      const request = store.delete(payloadKey);
      request.onerror = () => reject(request.error || new Error("清除微信读书本地数据失败。"));
      request.onsuccess = () => resolve(true);
    });
  }

  root.OhMyTabWereadSyncCore = {
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
})(typeof globalThis !== "undefined" ? globalThis : window);
