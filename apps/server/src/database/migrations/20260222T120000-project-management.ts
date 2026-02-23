import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Domains table - top-level grouping, scoped to a space
  await db.schema
    .createTable('domains')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col)
    .addColumn('color', 'varchar', (col) => col)
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('space_id', 'uuid', (col) =>
      col.references('spaces.id').onDelete('cascade').notNull(),
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
    .createIndex('idx_domains_space_id')
    .on('domains')
    .column('space_id')
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

  // Add optional task-property columns to pages
  // Pages become tasks when mission_id is set
  await db.schema
    .alterTable('pages')
    .addColumn('mission_id', 'uuid', (col) =>
      col.references('missions.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .alterTable('pages')
    .addColumn('task_status', 'varchar', (col) => col)
    .execute();

  await db.schema
    .alterTable('pages')
    .addColumn('important_level', 'integer', (col) => col)
    .execute();

  await db.schema
    .alterTable('pages')
    .addColumn('time_to_do_start', 'timestamptz', (col) => col)
    .execute();

  await db.schema
    .alterTable('pages')
    .addColumn('time_to_do_end', 'timestamptz', (col) => col)
    .execute();

  await db.schema
    .alterTable('pages')
    .addColumn('finish_time', 'timestamptz', (col) => col)
    .execute();

  await db.schema
    .createIndex('idx_pages_mission_id')
    .on('pages')
    .column('mission_id')
    .execute();

  await db.schema
    .createIndex('idx_pages_task_status')
    .on('pages')
    .column('task_status')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_pages_task_status').execute();
  await db.schema.dropIndex('idx_pages_mission_id').execute();

  await db.schema
    .alterTable('pages')
    .dropColumn('finish_time')
    .execute();

  await db.schema
    .alterTable('pages')
    .dropColumn('time_to_do_end')
    .execute();

  await db.schema
    .alterTable('pages')
    .dropColumn('time_to_do_start')
    .execute();

  await db.schema
    .alterTable('pages')
    .dropColumn('important_level')
    .execute();

  await db.schema
    .alterTable('pages')
    .dropColumn('task_status')
    .execute();

  await db.schema
    .alterTable('pages')
    .dropColumn('mission_id')
    .execute();

  await db.schema.dropTable('missions').execute();
  await db.schema.dropTable('domains').execute();
}
