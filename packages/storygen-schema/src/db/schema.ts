import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { Project } from '../entities';

/**
 * D1-first Drizzle schema. The first slice persists the canonical Project as a
 * JSON document (local-first pattern) with indexed top-level columns; the API's
 * in-memory adapter is the real path for the first proof. Portable to Postgres
 * later. Generate migrations with `pnpm --filter @ch5me/storygen-schema db:generate`.
 */

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  data: text('data', { mode: 'json' }).notNull().$type<Project>(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const generationJobs = sqliteTable('generation_jobs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  status: text('status').notNull(),
  kind: text('kind').notNull(),
  data: text('data', { mode: 'json' }).notNull(),
  createdAt: integer('created_at').notNull(),
});

export const exportsTable = sqliteTable('exports', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull(),
  format: text('format').notNull(),
  createdAt: integer('created_at').notNull(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type GenerationJobRow = typeof generationJobs.$inferSelect;
export type ExportRow = typeof exportsTable.$inferSelect;
