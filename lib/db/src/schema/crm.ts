import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

export const leadsTable = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  source: text("source").notNull(),
  campaign: text("campaign"),
  stage: text("stage").notNull().default("Novo Lead"),
  temperature: text("temperature").notNull().default("Morno"),
  interest: text("interest").notNull(),
  budget: doublePrecision("budget").notNull().default(0),
  city: text("city").notNull().default("Aracaju"),
  neighborhoods: text("neighborhoods").array().notNull().default([]),
  assignedTo: text("assigned_to").notNull().default("Victor Lima"),
  lastContact: date("last_contact", { mode: "string" }).notNull(),
  nextContact: date("next_contact", { mode: "string" }),
  status: text("status").notNull().default("Ativo"),
  notes: text("notes"),
  ...timestamps,
});

export const propertiesTable = pgTable("crm_properties", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  purpose: text("purpose").notNull(),
  status: text("status").notNull().default("Disponível"),
  price: doublePrecision("price").notNull(),
  condo: doublePrecision("condo"),
  iptu: doublePrecision("iptu"),
  city: text("city").notNull(),
  neighborhood: text("neighborhood").notNull(),
  address: text("address").notNull().default(""),
  bedrooms: integer("bedrooms").notNull().default(0),
  suites: integer("suites").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  parking: integer("parking").notNull().default(0),
  area: doublePrecision("area").notNull().default(0),
  image: text("image").notNull().default(""),
  ownerName: text("owner_name").notNull().default(""),
  commission: doublePrecision("commission").notNull().default(5),
  exclusive: boolean("exclusive").notNull().default(false),
  description: text("description").notNull().default(""),
  features: text("features").array().notNull().default([]),
  ...timestamps,
});

export const tasksTable = pgTable("crm_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  time: text("time"),
  priority: text("priority").notNull().default("Média"),
  status: text("status").notNull().default("Pendente"),
  clientName: text("client_name"),
  propertyTitle: text("property_title"),
  ownerName: text("owner_name").notNull().default("Victor Lima"),
  ...timestamps,
});

export const visitsTable = pgTable("crm_visits", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  propertyTitle: text("property_title").notNull(),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("Agendada"),
  location: text("location").notNull(),
  feedback: text("feedback"),
  ...timestamps,
});

export const proposalsTable = pgTable("crm_proposals", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  propertyTitle: text("property_title").notNull(),
  advertisedValue: doublePrecision("advertised_value").notNull(),
  proposedValue: doublePrecision("proposed_value").notNull(),
  entry: doublePrecision("entry").notNull().default(0),
  status: text("status").notNull().default("Enviada"),
  validUntil: date("valid_until", { mode: "string" }).notNull(),
  ...timestamps,
});

export const capturesTable = pgTable("crm_captures", {
  id: serial("id").primaryKey(),
  ownerName: text("owner_name").notNull(),
  propertyTitle: text("property_title").notNull(),
  stage: text("stage").notNull().default("Proprietário identificado"),
  askingValue: doublePrecision("asking_value").notNull(),
  suggestedValue: doublePrecision("suggested_value"),
  nextFollowUp: date("next_follow_up", { mode: "string" }).notNull(),
  exclusive: boolean("exclusive").notNull().default(false),
  ...timestamps,
});

export const commissionsTable = pgTable("crm_commissions", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  propertyTitle: text("property_title").notNull(),
  soldValue: doublePrecision("sold_value").notNull(),
  percentage: doublePrecision("percentage").notNull(),
  gross: doublePrecision("gross").notNull(),
  net: doublePrecision("net").notNull(),
  expectedDate: date("expected_date", { mode: "string" }),
  receivedDate: date("received_date", { mode: "string" }),
  status: text("status").notNull().default("Prevista"),
  ...timestamps,
});

export const activitiesTable = pgTable("crm_activities", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  entityId: integer("entity_id"),
  ...timestamps,
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVisitSchema = createInsertSchema(visitsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type Lead = typeof leadsTable.$inferSelect;
export type Property = typeof propertiesTable.$inferSelect;
export type Task = typeof tasksTable.$inferSelect;
export type Visit = typeof visitsTable.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertVisit = z.infer<typeof insertVisitSchema>;