import { Router, type IRouter } from "express";
import { and, asc, eq, gte, ilike, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db, eventsTable, eventReportsTable } from "@workspace/db";
import {
  CreateEventBody, CreateEventResponse, GetEventsQueryParams, GetEventsResponse,
  GetEventOverviewResponse, ParseAnnouncementBody, ParseAnnouncementResponse,
  ReportEventBody, ReportEventParams, ReportEventResponse,
} from "@workspace/api-zod";
import { extractEvents, isCalendarDate, missingEventFields } from "../lib/event-extraction";

const router: IRouter = Router();
const parseUsage = new Map<string, { count: number; resetAt: number }>();
const today = () => new Date().toISOString().slice(0, 10);
const weekEnd = () => new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10);

router.get("/events", async (req, res): Promise<void> => {
  const parsed = GetEventsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid event filters." });
    return;
  }
  const { search, category, timeframe } = parsed.data;
  const filters: SQL[] = [];
  if (search?.trim()) {
    const searchFilter = or(
      ilike(eventsTable.title, `%${search.trim()}%`),
      ilike(eventsTable.summary, `%${search.trim()}%`),
      ilike(eventsTable.hostOrganization, `%${search.trim()}%`),
    );
    if (searchFilter) filters.push(searchFilter);
  }
  if (category) filters.push(eq(eventsTable.category, category));
  if (timeframe === "today") filters.push(eq(eventsTable.eventDate, today()));
  if (timeframe === "week") filters.push(and(gte(eventsTable.eventDate, today()), lte(eventsTable.eventDate, weekEnd()))!);
  const events = await db.select().from(eventsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(eventsTable.eventDate), asc(eventsTable.startTime), asc(eventsTable.id));
  res.json(GetEventsResponse.parse(events.map((event) => ({ ...event, missingFields: missingEventFields(event) }))));
});

router.get("/events/overview", async (_req, res): Promise<void> => {
  const events = await db.select({ eventDate: eventsTable.eventDate }).from(eventsTable);
  res.json(GetEventOverviewResponse.parse({
    totalUpcoming: events.filter((event) => event.eventDate && event.eventDate >= today()).length,
    happeningToday: events.filter((event) => event.eventDate === today()).length,
    happeningThisWeek: events.filter((event) => event.eventDate && event.eventDate >= today() && event.eventDate <= weekEnd()).length,
  }));
});

router.post("/events/parse", async (req, res): Promise<void> => {
  const parsed = ParseAnnouncementBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Paste an announcement between 12 and 12,000 characters and select its source." });
    return;
  }
  const key = req.ip ?? "unknown";
  const now = Date.now();
  const usage = parseUsage.get(key);
  if (usage && usage.resetAt > now && usage.count >= 15) {
    res.status(429).json({ error: "Too many extraction requests. Please try again in a few minutes." });
    return;
  }
  if (!usage || usage.resetAt <= now) parseUsage.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 });
  else usage.count += 1;
  if (parseUsage.size > 1000) {
    for (const [ip, entry] of parseUsage) if (entry.resetAt <= now) parseUsage.delete(ip);
  }
  try {
    const result = await extractEvents(parsed.data.announcement, parsed.data.source);
    res.json(ParseAnnouncementResponse.parse(result));
  } catch (error) {
    req.log.error({ err: error }, "Event extraction failed");
    res.status(503).json({ error: "The AI parser could not process this announcement. Please try again shortly; nothing has been published." });
  }
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please review the event fields before publishing." });
    return;
  }
  const blankToNull = (value: string | null) => value?.trim() || null;
  const event = {
    ...parsed.data,
    title: parsed.data.title.trim(),
    summary: parsed.data.summary.trim(),
    location: blankToNull(parsed.data.location),
    hostOrganization: blankToNull(parsed.data.hostOrganization),
    startTime: blankToNull(parsed.data.startTime),
    endTime: blankToNull(parsed.data.endTime),
    sourceUrl: parsed.data.sourceUrl?.trim() || null,
    tags: parsed.data.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
  };
  if (!event.title || event.title.length > 200 || event.summary.length > 2000 ||
      (event.eventDate !== null && !isCalendarDate(event.eventDate)) ||
      [event.startTime, event.endTime].some((time) => time !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
    res.status(400).json({ error: "Use a valid event date, a title under 200 characters, and times in HH:mm format." });
    return;
  }
  if (event.eventDate) {
    const [duplicate] = await db.select({ id: eventsTable.id }).from(eventsTable).where(and(
      sql`lower(trim(${eventsTable.title})) = lower(${event.title})`,
      eq(eventsTable.eventDate, event.eventDate),
      event.startTime ? eq(eventsTable.startTime, event.startTime) : isNull(eventsTable.startTime),
    )).limit(1);
    if (duplicate) {
      res.status(409).json({ error: "An event with this title, date, and start time is already in the feed." });
      return;
    }
  }
  const [created] = await db.insert(eventsTable).values(event).returning();
  if (!created) throw new Error("Event insert returned no row.");
  res.status(201).json(CreateEventResponse.parse({ ...created, missingFields: missingEventFields(created) }));
});

router.post("/events/:eventId/reports", async (req, res): Promise<void> => {
  const params = ReportEventParams.safeParse(req.params);
  const body = ReportEventBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Choose a report reason." });
    return;
  }
  const [event] = await db.select({ id: eventsTable.id }).from(eventsTable).where(eq(eventsTable.id, params.data.eventId)).limit(1);
  if (!event) {
    res.status(404).json({ error: "This event was not found." });
    return;
  }
  const [report] = await db.insert(eventReportsTable).values({
    eventId: event.id,
    reason: body.data.reason,
    details: body.data.details?.trim().slice(0, 2000) || null,
  }).returning();
  res.status(201).json(ReportEventResponse.parse(report));
});

export default router;