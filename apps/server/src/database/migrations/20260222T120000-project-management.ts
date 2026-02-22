import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Domains table - top-level grouping (e.g. "Work", "Health", "Learning")
  await db.schema
    .createTable('domains')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col)
    .addColumn('color', 'varchar', (col) => col)
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('creator_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz', (col) => col)
    .execute();

  await db.schema
    .createIndex('idx_domains_workspace_id')
    .on('domains')
    .column('workspace_id')
    .execute();

  // Missions table - projects/goals within a domain
  await db.schema
    .createTable('missions')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col)
    .addColumn('status', 'varchar', (col) =>
      col.notNull().defaultTo('active'),
    )
    .addColumn('start_date', 'timestamptz', (col) => col)
    .addColumn('end_date', 'timestamptz', (col) => col)
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('domain_id', 'uuid', (col) =>
      col.references('domains.id').onDelete('cascade').notNull(),
    )
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('creator_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz', (col) => col)
    .execute();

  await db.schema
    .createIndex('idx_missions_domain_id')
    .on('missions')
    .column('domain_id')
    .execute();

  await db.schema
    .createIndex('idx_missions_workspace_id')
    .on('missions')
    .column('workspace_id')
    .execute();

  await db.schema
    .createIndex('idx_missions_status')
    .on('missions')
    .column('status')
    .execute();

  // Tasks table - individual actionable items within a mission
  await db.schema
    .createTable('tasks')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('status', 'varchar', (col) =>
      col.notNull().defaultTo('not_started'),
    )
    // 0=none, 1=low, 2=medium, 3=high, 4=urgent
    .addColumn('important_level', 'integer', (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn('time_to_do_start', 'timestamptz', (col) => col)
    .addColumn('time_to_do_end', 'timestamptz', (col) => col)
    .addColumn('finish_time', 'timestamptz', (col) => col)
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('mission_id', 'uuid', (col) =>
      col.references('missions.id').onDelete('cascade').notNull(),
    )
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('creator_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null'),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz', (col) => col)
    .execute();

  await db.schema
    .createIndex('idx_tasks_mission_id')
    .on('tasks')
    .column('mission_id')
    .execute();

  await db.schema
    .createIndex('idx_tasks_workspace_id')
    .on('tasks')
    .column('workspace_id')
    .execute();

  await db.schema
    .createIndex('idx_tasks_status')
    .on('tasks')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_tasks_time_to_do_start')
    .on('tasks')
    .column('time_to_do_start')
    .execute();

  // Task notes - rich text note attached to a task (uses same format as pages)
  await db.schema
    .createTable('task_notes')
    .addColumn('task_id', 'uuid', (col) =>
      col.primaryKey().references('tasks.id').onDelete('cascade'),
    )
    .addColumn('content', 'jsonb', (col) => col)
    .addColumn('ydoc', 'bytea', (col) => col)
    .addColumn('text_content', 'text', (col) => col)
    .addColumn('tsv', sql`tsvector`, (col) => col)
    .addColumn('version', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_task_notes_tsv')
    .on('task_notes')
    .using('GIN')
    .column('tsv')
    .execute();

  // Add task_id FK to existing attachments table so files can be attached to tasks
  await db.schema
    .alterTable('attachments')
    .addColumn('task_id', 'uuid', (col) =>
      col.references('tasks.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .createIndex('idx_attachments_task_id')
    .on('attachments')
    .column('task_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('attachments')
    .dropColumn('task_id')
    .execute();

  await db.schema.dropTable('task_notes').execute();
  await db.schema.dropTable('tasks').execute();
  await db.schema.dropTable('missions').execute();
  await db.schema.dropTable('domains').execute();
}
