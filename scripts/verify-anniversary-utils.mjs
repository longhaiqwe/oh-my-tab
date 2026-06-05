import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const utils = require("../src/anniversary-utils.js");

const referenceDate = new Date("2026-06-04T00:00:00");

const lunarBirthday = {
  id: "mom",
  title: "妈妈生日",
  calendar: "lunar",
  lunarMonth: 4,
  lunarDay: 28,
  advanceDays: 14,
  repeat: "yearly"
};

const solarAnniversary = {
  id: "parents",
  title: "父母结婚纪念日",
  calendar: "solar",
  solarMonth: 7,
  solarDay: 5,
  advanceDays: 14,
  repeat: "yearly"
};

const lunarOccurrence = utils.getNextAnniversaryOccurrence(lunarBirthday, referenceDate);
assert.equal(lunarOccurrence.dateIso, "2026-06-13", "农历四月廿八在 2026 年应换算为公历 6 月 13 日。");
assert.equal(lunarOccurrence.daysUntil, 9, "从 2026-06-04 到 2026-06-13 应剩余 9 天。");
assert.equal(lunarOccurrence.originalDateLabel, "农历四月廿八");
assert.equal(lunarOccurrence.currentDateLabel, "6 月 13 日 周六");
assert.equal(lunarOccurrence.inReminderWindow, true, "提前 14 天提醒时，9 天后应进入提醒窗口。");

const solarOccurrence = utils.getNextAnniversaryOccurrence(solarAnniversary, referenceDate);
assert.equal(solarOccurrence.dateIso, "2026-07-05", "公历 7 月 5 日的下一次发生日应在 2026 年。");
assert.equal(solarOccurrence.daysUntil, 31);
assert.equal(solarOccurrence.originalDateLabel, "公历 7 月 5 日");

const mothersDay = {
  id: "builtin-mothers-day",
  title: "母亲节",
  calendar: "nthWeekday",
  solarMonth: 5,
  nth: 2,
  weekday: 0,
  advanceDays: 14,
  repeat: "yearly"
};

const mothersDayOccurrence = utils.getNextAnniversaryOccurrence(mothersDay, new Date("2026-01-01T00:00:00"));
assert.equal(mothersDayOccurrence.dateIso, "2026-05-10", "母亲节应按 5 月第 2 个周日计算。");
assert.equal(mothersDayOccurrence.originalDateLabel, "5 月第 2 个周日");
assert.equal(mothersDayOccurrence.currentDateLabel, "5 月 10 日 周日");

const upcoming = utils.getUpcomingAnniversaryOccurrences(
  [
    solarAnniversary,
    { ...lunarBirthday },
    { id: "sister", title: "妹妹生日", calendar: "lunar", lunarMonth: 6, lunarDay: 2, advanceDays: 14, repeat: "yearly" },
    { id: "move", title: "搬家纪念日", calendar: "solar", solarMonth: 11, solarDay: 18, advanceDays: 14, repeat: "yearly" }
  ],
  referenceDate,
  3
);

assert.deepEqual(
  upcoming.map((item) => item.title),
  ["妈妈生日", "父母结婚纪念日", "妹妹生日"],
  "首页只应显示最近 3 个纪念日，并按剩余天数排序。"
);
