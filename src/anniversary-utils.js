(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.OhMyTabAnniversaryUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const dayMs = 24 * 60 * 60 * 1000;
  const lunarFormatter = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  const lunarMonthLabels = ["", "正月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "冬月", "腊月"];
  const lunarDayLabels = [
    "",
    "初一",
    "初二",
    "初三",
    "初四",
    "初五",
    "初六",
    "初七",
    "初八",
    "初九",
    "初十",
    "十一",
    "十二",
    "十三",
    "十四",
    "十五",
    "十六",
    "十七",
    "十八",
    "十九",
    "二十",
    "廿一",
    "廿二",
    "廿三",
    "廿四",
    "廿五",
    "廿六",
    "廿七",
    "廿八",
    "廿九",
    "三十"
  ];
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  function startOfDay(value) {
    const date = value instanceof Date ? value : new Date(value);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, days) {
    const next = startOfDay(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function daysBetween(start, end) {
    return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / dayMs);
  }

  function toIsoDate(date) {
    const local = startOfDay(date);
    const year = local.getFullYear();
    const month = String(local.getMonth() + 1).padStart(2, "0");
    const day = String(local.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getLunarParts(date) {
    const parts = Object.fromEntries(lunarFormatter.formatToParts(startOfDay(date)).map((part) => [part.type, part.value]));
    const rawMonth = parts.month || "";
    return {
      monthLabel: rawMonth.replace(/^闰/, ""),
      isLeapMonth: rawMonth.startsWith("闰"),
      day: Number(parts.day),
      relatedYear: Number(parts.relatedYear)
    };
  }

  function findNextLunarDate(event, referenceDate) {
    const monthLabel = lunarMonthLabels[Number(event.lunarMonth)];
    const day = Number(event.lunarDay);
    const requiresLeapMonth = Boolean(event.isLeapMonth);
    if (!monthLabel || !Number.isInteger(day) || day < 1 || day > 30) {
      return null;
    }
    const start = startOfDay(referenceDate);
    for (let offset = 0; offset <= 430; offset += 1) {
      const candidate = addDays(start, offset);
      const parts = getLunarParts(candidate);
      if (
        parts.monthLabel === monthLabel &&
        parts.day === day &&
        Boolean(parts.isLeapMonth) === requiresLeapMonth
      ) {
        return candidate;
      }
    }
    return null;
  }

  function findNextSolarDate(event, referenceDate) {
    const month = Number(event.solarMonth);
    const day = Number(event.solarDay);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) {
      return null;
    }
    const reference = startOfDay(referenceDate);
    let candidate = new Date(reference.getFullYear(), month - 1, day);
    if (candidate.getMonth() !== month - 1 || candidate.getDate() !== day) {
      return null;
    }
    if (candidate < reference) {
      candidate = new Date(reference.getFullYear() + 1, month - 1, day);
    }
    return candidate;
  }

  function findNextNthWeekdayDate(event, referenceDate) {
    const month = Number(event.solarMonth);
    const nth = Number(event.nth);
    const weekday = Number(event.weekday);
    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(nth) ||
      nth < 1 ||
      nth > 5 ||
      !Number.isInteger(weekday) ||
      weekday < 0 ||
      weekday > 6
    ) {
      return null;
    }
    const reference = startOfDay(referenceDate);
    let candidate = getNthWeekdayDate(reference.getFullYear(), month, nth, weekday);
    if (candidate && candidate < reference) {
      candidate = getNthWeekdayDate(reference.getFullYear() + 1, month, nth, weekday);
    }
    return candidate;
  }

  function getNthWeekdayDate(year, month, nth, weekday) {
    const firstDay = new Date(year, month - 1, 1);
    const offset = (weekday - firstDay.getDay() + 7) % 7;
    const day = 1 + offset + (nth - 1) * 7;
    const candidate = new Date(year, month - 1, day);
    return candidate.getMonth() === month - 1 ? candidate : null;
  }

  function formatSolarLabel(date) {
    const local = startOfDay(date);
    return `${local.getMonth() + 1} 月 ${local.getDate()} 日 ${weekdays[local.getDay()]}`;
  }

  function formatOriginalDateLabel(event) {
    if (event.calendar === "lunar") {
      const month = lunarMonthLabels[Number(event.lunarMonth)] || "";
      const day = lunarDayLabels[Number(event.lunarDay)] || "";
      return `农历${event.isLeapMonth ? "闰" : ""}${month}${day}`;
    }
    if (event.calendar === "nthWeekday") {
      return `${Number(event.solarMonth)} 月第 ${Number(event.nth)} 个${weekdays[Number(event.weekday)] || ""}`;
    }
    return `公历 ${Number(event.solarMonth)} 月 ${Number(event.solarDay)} 日`;
  }

  function getAnniversaryYears(event, nextDate) {
    const startYear = Number(event.startYear);
    if (!Number.isInteger(startYear) || startYear < 1) {
      return null;
    }
    const years = startOfDay(nextDate).getFullYear() - startYear;
    return years >= 0 ? years : null;
  }

  function getNextAnniversaryOccurrence(event, referenceDate = new Date()) {
    if (!event || event.archived) {
      return null;
    }
    const nextDate =
      event.calendar === "lunar"
        ? findNextLunarDate(event, referenceDate)
        : event.calendar === "nthWeekday"
          ? findNextNthWeekdayDate(event, referenceDate)
          : findNextSolarDate(event, referenceDate);
    if (!nextDate) {
      return null;
    }
    const daysUntil = daysBetween(referenceDate, nextDate);
    const anniversaryYears = getAnniversaryYears(event, nextDate);
    return {
      ...event,
      date: nextDate,
      dateIso: toIsoDate(nextDate),
      daysUntil,
      originalDateLabel: formatOriginalDateLabel(event),
      currentDateLabel: formatSolarLabel(nextDate),
      anniversaryYears,
      anniversaryYearLabel: anniversaryYears === null ? "" : `${anniversaryYears} 年`,
      inReminderWindow: daysUntil <= Number(event.advanceDays || 0)
    };
  }

  const defaultAnniversaryAdvanceDays = 7;
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

  function getUpcomingAnniversaryOccurrences(events = [], referenceDate = new Date(), limit = 3) {
    return events
      .map((event) => getNextAnniversaryOccurrence(event, referenceDate))
      .filter(Boolean)
      .sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title, "zh-CN"))
      .slice(0, limit);
  }

  function getActiveReminderOccurrences(events = [], referenceDate = new Date()) {
    return events
      .map((event) => getNextAnniversaryOccurrence(event, referenceDate))
      .filter((occurrence) => Boolean(occurrence && occurrence.inReminderWindow))
      .sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title, "zh-CN"));
  }

  function normalizeTitle(title) {
    return String(title || "").trim().toLowerCase();
  }

  function normalizeStartYear(startYear) {
    const year = Number(startYear);
    return Number.isInteger(year) && year > 0 ? year : null;
  }

  function isSameAnniversaryDate(a, b) {
    if (!a || !b || a.calendar !== b.calendar) {
      return false;
    }
    if (a.calendar === "lunar") {
      return (
        Number(a.lunarMonth) === Number(b.lunarMonth) &&
        Number(a.lunarDay) === Number(b.lunarDay) &&
        Boolean(a.isLeapMonth) === Boolean(b.isLeapMonth)
      );
    }
    if (a.calendar === "solar") {
      return (
        Number(a.solarMonth) === Number(b.solarMonth) &&
        Number(a.solarDay) === Number(b.solarDay)
      );
    }
    if (a.calendar === "nthWeekday") {
      return (
        Number(a.solarMonth) === Number(b.solarMonth) &&
        Number(a.nth) === Number(b.nth) &&
        Number(a.weekday) === Number(b.weekday)
      );
    }
    return false;
  }

  function isDuplicateAnniversary(a, b) {
    if (!a || !b) {
      return false;
    }
    if (normalizeTitle(a.title) !== normalizeTitle(b.title)) {
      return false;
    }
    if (!isSameAnniversaryDate(a, b)) {
      return false;
    }
    return normalizeStartYear(a.startYear) === normalizeStartYear(b.startYear);
  }

  function findDuplicateAnniversary(target, list = []) {
    if (!target || !Array.isArray(list)) {
      return null;
    }
    return list.find((item) => item && item.id !== target.id && isDuplicateAnniversary(item, target)) || null;
  }

  function isYearInputComplete(value) {
    const str = String(value ?? "").trim();
    return /^\d{4}$/.test(str);
  }

  function isMonthInputComplete(value) {
    const str = String(value ?? "").trim();
    if (!/^\d+$/.test(str)) {
      return false;
    }
    const num = Number(str);
    if (str.length === 1 && num >= 2 && num <= 9) {
      return true;
    }
    if (str.length === 2 && num >= 1 && num <= 12) {
      return true;
    }
    return false;
  }

  function getSolarMonthMaxDays(month, year = null) {
    const m = Number(month);
    if (!Number.isInteger(m) || m < 1 || m > 12) {
      return 0;
    }
    if (m === 2) {
      const y = Number(year);
      if (Number.isInteger(y) && y > 0) {
        const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
        return isLeap ? 29 : 28;
      }
      return 29;
    }
    if ([4, 6, 9, 11].includes(m)) {
      return 30;
    }
    return 31;
  }

  function validateAnniversaryInput(item) {
    if (!item || typeof item !== "object") {
      return "请补全纪念日信息";
    }
    const title = String(item.title || "").trim();
    if (!title) {
      return "请输入纪念日名称";
    }
    if (title.length > 48) {
      return "纪念日名称不能超过 48 个字";
    }

    if (item.startYear !== undefined && item.startYear !== null && item.startYear !== "") {
      const year = Number(item.startYear);
      if (!Number.isInteger(year) || year < 1 || year > 9999) {
        return "年份必须在 1 到 9999 之间";
      }
    }

    if (item.advanceDays !== undefined && item.advanceDays !== null && item.advanceDays !== "") {
      const days = Number(item.advanceDays);
      if (!Number.isInteger(days) || days < 0 || days > 365) {
        return "提前提醒天数必须在 0 到 365 之间";
      }
    }

    if (item.calendar === "lunar") {
      const month = Number(item.lunarMonth);
      const day = Number(item.lunarDay);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return "农历月份必须在 1 到 12 之间";
      }
      if (!Number.isInteger(day) || day < 1 || day > 30) {
        return "农历日期必须在 1 到 30 之间";
      }
      return null;
    }

    if (item.calendar === "solar") {
      const month = Number(item.solarMonth);
      const day = Number(item.solarDay);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return "公历月份必须在 1 到 12 之间";
      }
      const maxDays = getSolarMonthMaxDays(month, item.startYear);
      if (!Number.isInteger(day) || day < 1 || day > maxDays) {
        return `${month} 月日期必须在 1 到 ${maxDays} 之间`;
      }
      return null;
    }

    if (item.calendar === "nthWeekday") {
      const month = Number(item.solarMonth);
      const nth = Number(item.nth);
      const weekday = Number(item.weekday);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return "月份必须在 1 到 12 之间";
      }
      if (!Number.isInteger(nth) || nth < 1 || nth > 5) {
        return "周数必须在 1 到 5 之间";
      }
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
        return "星期必须在周日到周六之间";
      }
      return null;
    }

    return "请选择有效的日期类型";
  }

  function isValidAnniversary(item) {
    return validateAnniversaryInput(item) === null;
  }

  return {
    getNextAnniversaryOccurrence,
    getUpcomingAnniversaryOccurrences,
    formatOriginalDateLabel,
    formatSolarLabel,
    toIsoDate,
    isDuplicateAnniversary,
    findDuplicateAnniversary,
    isYearInputComplete,
    isMonthInputComplete,
    getSolarMonthMaxDays,
    validateAnniversaryInput,
    isValidAnniversary,
    defaultAnniversaryAdvanceDays,
    builtinAnniversaries,
    getActiveReminderOccurrences
  };
});
