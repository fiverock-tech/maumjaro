const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localStamp(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function utcStamp(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/**
 * 매주 체크인 요일 저녁 8시 반복 일정(.ics).
 * 웹 푸시 대신 캘린더 알림으로 주간 체크인을 챙기게 합니다.
 */
export function weeklyCheckinIcs(checkinDay: number, appUrl: string, now = new Date()): string {
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
  const add = (checkinDay - first.getDay() + 7) % 7;
  first.setDate(first.getDate() + add);
  if (first.getTime() < now.getTime()) first.setDate(first.getDate() + 7);
  const end = new Date(first.getTime() + 15 * 60 * 1000);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//maumjaro//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:maumjaro-weekly-${checkinDay}@maumjaro`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${localStamp(first)}`,
    `DTEND:${localStamp(end)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[checkinDay]}`,
    "SUMMARY:마음자로 · 마음 주사의 날",
    `DESCRIPTION:체중과 이번 주 실천을 기록해요. ${appUrl}`,
    `URL:${appUrl}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:마음 주사의 날이에요",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
