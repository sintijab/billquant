import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, json, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  projectType: varchar("project_type", { enum: ["site_visit", "upload_boq"] }).notNull(),
  clientFirstName: text("client_first_name").notNull(),
  clientSurname: text("client_surname").notNull(),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email").notNull(),
  siteAddress: text("site_address").notNull(),
  digitalSignature: text("digital_signature"),
  generalNotes: text("general_notes"),
  status: varchar("status", { enum: ["setup", "site_visit", "activities", "pricing", "documents", "completed"] }).default("setup"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const siteVisit = pgTable("site_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  totalArea: decimal("total_area", { precision: 10, scale: 2 }),
  status: text("status"),
  priority: varchar("priority", { enum: ["low", "medium", "high"] }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteSubareas = pgTable("site_subareas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  areaId: varchar("area_id").notNull().references(() => siteVisit.id),
  name: text("name").notNull(),
  dimensions: text("dimensions"),
  area: decimal("area", { precision: 10, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  volume: decimal("volume", { precision: 10, scale: 3 }),
  currentStatus: text("current_status"),
  workRequired: text("work_required"),
  photos: json("photos").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityCategories = pgTable("activity_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  icon: text("icon"),
  totalArea: decimal("total_area", { precision: 10, scale: 2 }),
  totalQuantity: decimal("total_quantity", { precision: 10, scale: 2 }),
  unit: text("unit"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => activityCategories.id),
  description: text("description").notNull(),
  location: text("location"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const boqItems = pgTable("boq_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  code: text("code").notNull(),
  description: text("description").notNull(),
  length: decimal("length", { precision: 10, scale: 2 }),
  width: decimal("width", { precision: 10, scale: 2 }),
  factor: decimal("factor", { precision: 10, scale: 3 }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  priceSource: text("price_source"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertsiteVisitchema = createInsertSchema(siteVisit).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSubareaSchema = createInsertSchema(siteSubareas).omit({
  id: true,
  createdAt: true,
});

export const insertActivityCategorySchema = createInsertSchema(activityCategories).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertBoqItemSchema = createInsertSchema(boqItems).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type SiteArea = typeof siteVisit.$inferSelect;
export type InsertSiteArea = z.infer<typeof insertsiteVisitchema>;
export type SiteSubarea = typeof siteSubareas.$inferSelect;
export type InsertSiteSubarea = z.infer<typeof insertSiteSubareaSchema>;
export type ActivityCategory = typeof activityCategories.$inferSelect;
export type InsertActivityCategory = z.infer<typeof insertActivityCategorySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type BoqItem = typeof boqItems.$inferSelect;
export type InsertBoqItem = z.infer<typeof insertBoqItemSchema>;
