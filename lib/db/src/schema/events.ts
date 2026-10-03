import { date, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("campus_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  eventDate: date("event_date", { mode: "string" }),
  startTime: text("start_time"),
  endTime: text("end_time"),
  location: text("location"),
  hostOrganization: text("host_organization"),
  category: text("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  source: text("source").notNull(),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type CampusEvent = typeof eventsTable.$inferSelect;