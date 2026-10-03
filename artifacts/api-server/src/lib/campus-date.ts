const campusDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Indiana/Indianapolis",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function campusToday(now = new Date()) {
  return campusDateFormatter.format(now);
}

export function campusWeekEnd(now = new Date()) {
  const date = new Date(`${campusToday(now)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 6);
  return date.toISOString().slice(0, 10);
}