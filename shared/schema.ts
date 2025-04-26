import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Rules for moderation
export const rules = pgTable("rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  keywords: text("keywords").notNull(),
  action: text("action").notNull(),
  enabled: boolean("enabled").notNull().default(true),
});

export const insertRuleSchema = createInsertSchema(rules).pick({
  name: true,
  keywords: true,
  action: true,
  enabled: true,
});

// Logs for moderation actions
export const moderationLogs = pgTable("moderation_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  action: text("action").notNull(),
  reason: text("reason").notNull(),
  messageContent: text("message_content"),
});

export const insertModerationLogSchema = createInsertSchema(moderationLogs).pick({
  userId: true,
  username: true,
  action: true,
  reason: true,
  messageContent: true,
});

// Statistics
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  messagesMonitored: integer("messages_monitored").notNull().default(0),
  messagesDeleted: integer("messages_deleted").notNull().default(0),
  warningsIssued: integer("warnings_issued").notNull().default(0),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// Bot settings
export const botSettings = pgTable("bot_settings", {
  id: serial("id").primaryKey(),
  token: text("token").notNull(),
  prefix: text("prefix").notNull().default("!"),
  status: text("status").notNull().default("online"),
});

export const insertBotSettingsSchema = createInsertSchema(botSettings).pick({
  token: true,
  prefix: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRule = z.infer<typeof insertRuleSchema>;
export type Rule = typeof rules.$inferSelect;

export type InsertModerationLog = z.infer<typeof insertModerationLogSchema>;
export type ModerationLog = typeof moderationLogs.$inferSelect;

export type InsertBotSettings = z.infer<typeof insertBotSettingsSchema>;
export type BotSettings = typeof botSettings.$inferSelect;

export type Stats = typeof stats.$inferSelect;
