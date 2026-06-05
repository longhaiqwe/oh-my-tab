import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("..", import.meta.url);
const source = readFileSync(new URL("src/weread-sync-core.js", root), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadCore() {
  const context = {
    console,
    URLSearchParams
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: "src/weread-sync-core.js" });
  assert(context.OhMyTabWereadSyncCore, "src/weread-sync-core.js must expose OhMyTabWereadSyncCore.");
  return context.OhMyTabWereadSyncCore;
}

function createJsonResponse(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => payload
  };
}

const core = loadCore();

assert(core.validateApiKey("wrk-demo_key_123"), "wrk- keys must be accepted.");
assert(!core.validateApiKey("wrk-maWh"), "short incomplete wrk keys must be rejected.");
assert(!core.validateApiKey("bad-key"), "non-wrk keys must be rejected.");
assert(core.maskApiKey("wrk-abcdef123456") === "wrk-...3456", "keys must be masked.");

const sentBodies = [];
const fetchMock = async (_url, init) => {
  const body = JSON.parse(init.body);
  sentBodies.push(body);

  if (body.api_name === "/user/notebooks") {
    if (body.lastSort === 900) {
      return createJsonResponse({
        hasMore: 0,
        books: [
          {
            bookId: "book-2",
            sort: 800,
            noteCount: 1,
            reviewCount: 0,
            book: { title: "Second Book", author: "Reader" }
          }
        ]
      });
    }
    return createJsonResponse({
      hasMore: 1,
      books: [
        {
          bookId: "book-1",
          sort: 900,
          noteCount: 1,
          reviewCount: 1,
          book: { title: "First Book", author: "Reader" }
        }
      ]
    });
  }

  if (body.api_name === "/review/list/mine") {
    if (body.synckey === 123) {
      return createJsonResponse({
        hasMore: 0,
        synckey: 0,
        reviews: [
          {
            review: {
              reviewId: "review-2",
              bookId: body.bookid,
              content: "Second thought",
              createTime: 180,
              chapterName: "Chapter 2"
            }
          }
        ]
      });
    }
    return createJsonResponse({
      hasMore: 1,
      synckey: 123,
      reviews: [
        {
          review: {
            reviewId: "review-1",
            bookId: body.bookid,
            content: "First thought",
            createTime: 120,
            chapterName: "Chapter 1"
          }
        }
      ]
    });
  }

  return createJsonResponse({});
};

await core.callWereadGateway("wrk-test-demo", "/user/notebooks", { count: 100, lastSort: 42 }, fetchMock);
const directBody = sentBodies.at(-1);
assert(directBody.api_name === "/user/notebooks", "api_name must be top-level.");
assert(directBody.skill_version === core.skillVersion, "skill_version must be top-level.");
assert(directBody.count === 100, "count must be top-level.");
assert(directBody.lastSort === 42, "lastSort must be top-level.");
assert(!Object.hasOwn(directBody, "params"), "request body must not wrap params.");

sentBodies.length = 0;
const notebooks = await core.fetchNotebooks("wrk-test-demo", fetchMock);
assert(notebooks.length === 2, "notebook pagination must collect all pages.");
assert(sentBodies.some((body) => body.lastSort === 900), "notebook pagination must use lastSort from the previous page.");

sentBodies.length = 0;
const reviews = await core.fetchReviews(
  "wrk-test-demo",
  { bookId: "book-1", book: { title: "Book", author: "Author" } },
  fetchMock
);
assert(reviews.length === 2, "review pagination must collect all pages.");
assert(sentBodies.some((body) => body.synckey === 123), "review pagination must use synckey from the previous page.");

await assertRejects(
  core.callWereadGateway("wrk-test-demo", "/user/notebooks", {}, async () => createJsonResponse({}, false, 401)),
  (error) => error.message.includes("API Key") && error.message.includes("重新"),
  "HTTP 401 must explain that the WeRead API Key is invalid or incomplete."
);

const normalized = core.normalizeItems([
  {
    id: "note-1",
    type: "bookmark",
    bookId: "book-1",
    bookName: "Book",
    markText: "A sentence",
    noteTime: 100,
    range: "1-5"
  }
]);

assert(normalized[0].bookName === "Book", "normalized items must preserve bookName.");
assert(normalized[0].markText === "A sentence", "normalized items must preserve reviewable text.");
assert(normalized[0].deepLink.includes("weread://"), "normalized items must include a deep link when bookId is present.");

async function assertRejects(promise, predicate, message) {
  try {
    await promise;
  } catch (error) {
    assert(predicate(error), message);
    return;
  }
  throw new Error(message);
}
