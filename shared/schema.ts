import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define tables with explicit types
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const folders = sqliteTable("folders", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#0A84FF"),
  parentId: integer("parent_id").references((): any => folders.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const files = sqliteTable("files", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  folderId: integer("folder_id").references(() => folders.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  isShared: integer("is_shared").default(0),
  sharedBy: text("shared_by"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  color: true,
  parentId: true,
  userId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  type: true,
  size: true,
  path: true,
  folderId: true,
  userId: true,
  isShared: true,
  sharedBy: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

// File metadata for frontend
export type FileWithMeta = File & {
  preview?: string;
  extension?: string;
  formattedSize?: string;
  formattedDate?: string;
};

// Storage stats
export type StorageStats = {
  usedSpace: number; // in bytes
  totalSpace: number; // in bytes
  percentUsed: number; // 0–100
};
