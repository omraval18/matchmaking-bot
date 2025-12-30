import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: t.integer().primaryKey().notNull().generatedAlwaysAsIdentity(),
  isAdmin: t.boolean().notNull().default(false),
  phone: t.varchar().notNull().unique(),
});

export const bios = pgTable("bios", {
  id: t.integer().primaryKey().notNull().generatedAlwaysAsIdentity(),
  userId: t
    .integer()
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  firstName: t.varchar().notNull(),
  lastName: t.varchar().notNull(),
  gender: t.varchar().notNull(),
  age: t.integer().notNull(),
  dateOfBirth: t.date().notNull(),
  city: t.varchar().notNull(),
  caste: t.varchar().notNull(),
  currentCity: t.varchar(),
  citizenship: t.varchar().notNull(),
  education: t.varchar().notNull(),
  educationLevel: t.integer().notNull(),
  occupation: t.varchar().notNull(),
  company: t.varchar(),
  height: t.varchar().notNull(),
  heightCm: t.integer().notNull(),
  diet: t.varchar(),
  extra: t.jsonb("extra").$type<Record<string, any>>().default({}),
  url: t.varchar().notNull(),
});

export const conversationStates = pgTable("conversation_states", {
  id: t.integer().primaryKey().notNull().generatedAlwaysAsIdentity(),
  phone: t.varchar().notNull().unique(),
  flow: t.varchar().notNull(),
  step: t.varchar().notNull(),
  data: t.jsonb("data").$type<Record<string, any>>().default({}),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
});

export const preferences = pgTable("preferences", {
  id: t.integer().primaryKey().notNull().generatedAlwaysAsIdentity(),
  userId: t
    .integer()
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  ageMin: t.integer(),
  ageMax: t.integer(),
  heightMinCm: t.integer(),
  heightMaxCm: t.integer(),
  educationLevel: t.integer(),
  occupation: t.varchar(),
  city: t.varchar(),
  citizenship: t.varchar(),
  caste: t.varchar(),
  diet: t.varchar(),
  otherPreferences: t
    .jsonb("other_preferences")
    .$type<Record<string, any>>()
    .default({}),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t.timestamp().notNull().defaultNow(),
});
