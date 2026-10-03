import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { eventsTable } from "./events";

export const eventReportsTable = pgTable("event_reports", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  details: text("details"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventReportSchema = createInsertSchema(eventReportsTable).omit({ id: true, submittedAt: true });
export type InsertEventReport = z.infer<typeof insertEventReportSchema>;
export type EventReport = typeof eventReportsTable.$inferSelect;