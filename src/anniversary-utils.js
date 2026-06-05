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

  function getUpcomingAnniversaryOccurrences(events = [], referenceDate = new Date(), limit = 3) {
    return events
      .map((event) => getNextAnniversaryOccurrence(event, referenceDate))
      .filter(Boolean)
      .sort((a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title, "zh-CN"))
      .slice(0, limit);
  }

  return {
    getNextAnniversaryOccurrence,
    getUpcomingAnniversaryOccurrences,
    formatOriginalDateLabel,
    formatSolarLabel,
    toIsoDate
  };
});
