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
  startYear: 1998,
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
assert.equal(solarOccurrence.anniversaryYears, 28, "1998 年开始的纪念日到 2026 年应是第 28 年。");
assert.equal(solarOccurrence.anniversaryYearLabel, "28 年", "纪念日应展示已持续的年数。");

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

// 查重测试
assert.equal(
  utils.isDuplicateAnniversary(
    { title: "妈妈生日", calendar: "lunar", lunarMonth: 4, lunarDay: 28 },
    { title: " 妈妈生日 ", calendar: "lunar", lunarMonth: 4, lunarDay: 28 }
  ),
  true,
  "相同农历日期与标题（含首尾空格）应判定为重复。"
);

assert.equal(
  utils.isDuplicateAnniversary(
    { title: "父母结婚纪念日", calendar: "solar", solarMonth: 7, solarDay: 5, startYear: 1998, advanceDays: 7 },
    { title: "父母结婚纪念日", calendar: "solar", solarMonth: 7, solarDay: 5, startYear: 1998, advanceDays: 14 }
  ),
  true,
  "关键字段完全一致（仅 advanceDays 不同）应判定为重复。"
);

assert.equal(
  utils.isDuplicateAnniversary(
    { title: "测试纪念日", calendar: "solar", solarMonth: 5, solarDay: 20 },
    { title: "测试纪念日", calendar: "lunar", lunarMonth: 5, lunarDay: 20 }
  ),
  false,
  "日历类型不同（公历 vs 农历）不应判定为重复。"
);

assert.equal(
  utils.isDuplicateAnniversary(
    { title: "测试纪念日", calendar: "solar", solarMonth: 5, solarDay: 20 },
    { title: "测试纪念日", calendar: "solar", solarMonth: 5, solarDay: 21 }
  ),
  false,
  "日期不同不应判定为重复。"
);

assert.equal(
  utils.isDuplicateAnniversary(
    { title: "测试纪念日", calendar: "solar", solarMonth: 5, solarDay: 20, startYear: 2020 },
    { title: "测试纪念日", calendar: "solar", solarMonth: 5, solarDay: 20, startYear: 2021 }
  ),
  false,
  "起始年份不同不应判定为关键字段完全一致。"
);

const existingList = [
  lunarBirthday,
  solarAnniversary,
  mothersDay
];

assert.ok(
  utils.findDuplicateAnniversary(
    { id: "new-mom", title: "妈妈生日", calendar: "lunar", lunarMonth: 4, lunarDay: 28 },
    existingList
  ),
  "新增与已有列表完全相同的纪念日应检索出重复项。"
);

assert.equal(
  utils.findDuplicateAnniversary(
    { id: "mom", title: "妈妈生日", calendar: "lunar", lunarMonth: 4, lunarDay: 28, advanceDays: 30 },
    existingList
  ),
  null,
  "编辑自身时不应判定为与自身重复。"
);

assert.equal(
  utils.findDuplicateAnniversary(
    { id: "new-event", title: "新纪念日", calendar: "solar", solarMonth: 10, solarDay: 1 },
    existingList
  ),
  null,
  "全新纪念日不应判定为重复。"
);

// 年份输入结束判断测试
assert.equal(utils.isYearInputComplete("1990"), true, "4 位数字年份应判定为输入完成。");
assert.equal(utils.isYearInputComplete("2026"), true);
assert.equal(utils.isYearInputComplete("199"), false, "少于 4 位数字应判定为未完成。");
assert.equal(utils.isYearInputComplete("19901"), false, "超过 4 位数字应判定为非标准 4 位年份。");
assert.equal(utils.isYearInputComplete(""), false);

// 月份输入结束判断测试
assert.equal(utils.isMonthInputComplete("2"), true, "单数字 2~9 应直接判定为月份输入完成。");
assert.equal(utils.isMonthInputComplete("4"), true);
assert.equal(utils.isMonthInputComplete("9"), true);
assert.equal(utils.isMonthInputComplete("1"), false, "单数字 1 可能后续输入 10/11/12，不应立即判定完成。");
assert.equal(utils.isMonthInputComplete("0"), false, "单数字 0 可能后续输入 01~09，不应立即判定完成。");
assert.equal(utils.isMonthInputComplete("10"), true, "2 位数字 10 应判定为月份输入完成。");
assert.equal(utils.isMonthInputComplete("12"), true, "2 位数字 12 应判定为月份输入完成。");
assert.equal(utils.isMonthInputComplete("05"), true, "2 位数字 05 应判定为月份输入完成。");
assert.equal(utils.isMonthInputComplete("13"), false, "超出 12 的月份不应判定为输入完成。");
assert.equal(utils.isMonthInputComplete("abc"), false);

// 公历当月最大天数测试
assert.equal(utils.getSolarMonthMaxDays(1), 31);
assert.equal(utils.getSolarMonthMaxDays(4), 30);
assert.equal(utils.getSolarMonthMaxDays(2, 2024), 29, "2024 闰年 2 月最大 29 天。");
assert.equal(utils.getSolarMonthMaxDays(2, 2025), 28, "2025 平年 2 月最大 28 天。");
assert.equal(utils.getSolarMonthMaxDays(2), 29, "未提供年份时 2 月最大 29 天。");
assert.equal(utils.getSolarMonthMaxDays(13), 0, "非法月份返回 0 天。");

// 合法性校验测试
assert.equal(
  utils.isValidAnniversary({ title: "非法纪念日", calendar: "solar", startYear: 2005, solarMonth: 13, solarDay: 88 }),
  false,
  "13 月 88 日应判定为非法纪念日。"
);

assert.equal(
  utils.validateAnniversaryInput({ title: "非法纪念日", calendar: "solar", startYear: 2005, solarMonth: 13, solarDay: 88 }),
  "公历月份必须在 1 到 12 之间",
  "月份为 13 时应提示公历月份必须在 1 到 12 之间。"
);

assert.equal(
  utils.validateAnniversaryInput({ title: "非法纪念日", calendar: "solar", startYear: 2005, solarMonth: 7, solarDay: 88 }),
  "7 月日期必须在 1 到 31 之间",
  "日期为 88 时应提示正确的日期范围。"
);

assert.equal(
  utils.validateAnniversaryInput({ title: "非法纪念日", calendar: "solar", startYear: 2025, solarMonth: 2, solarDay: 29 }),
  "2 月日期必须在 1 到 28 之间",
  "平年 2 月 29 日应判定为非法并给出天数提示。"
);

assert.equal(
  utils.isValidAnniversary({ title: "合法农历", calendar: "lunar", lunarMonth: 12, lunarDay: 30 }),
  true,
  "农历 12 月 30 日应判定为合法。"
);

assert.equal(
  utils.isValidAnniversary({ title: "非法农历", calendar: "lunar", lunarMonth: 12, lunarDay: 31 }),
  false,
  "农历 31 日应判定为非法。"
);

assert.equal(
  utils.isValidAnniversary({ title: "非法年份", calendar: "solar", startYear: -10, solarMonth: 5, solarDay: 20 }),
  false,
  "负数年份应判定为非法。"
);

// 提醒期筛选与内置节日测试
assert.ok(Array.isArray(utils.builtinAnniversaries), "builtinAnniversaries 必须为数组。");
assert.ok(utils.builtinAnniversaries.length > 0, "builtinAnniversaries 必须包含默认节日。");
assert.equal(utils.defaultAnniversaryAdvanceDays, 7, "默认提醒天数必须为 7 天。");

const testEvents = [
  { id: "1", title: "今天到达", calendar: "solar", solarMonth: 6, solarDay: 4, advanceDays: 7 }, // 0 天
  { id: "2", title: "提前提醒中", calendar: "solar", solarMonth: 6, solarDay: 10, advanceDays: 7 }, // 6 天
  { id: "3", title: "未进入提醒", calendar: "solar", solarMonth: 6, solarDay: 20, advanceDays: 7 } // 16 天
];
const activeReminders = utils.getActiveReminderOccurrences(testEvents, referenceDate);
assert.equal(activeReminders.length, 2, "只有今天到达和处于提前提醒期内的事件应被筛选出来。");
assert.equal(activeReminders[0].title, "今天到达");
assert.equal(activeReminders[1].title, "提前提醒中");




