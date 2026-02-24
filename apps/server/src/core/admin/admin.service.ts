import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';

const SENSITIVE_PATTERNS = ['SECRET', 'PASSWORD', 'TOKEN', 'KEY', 'URL', 'DSN', 'PWD'];
const SAFE_URL_KEYS = ['APP_URL', 'DRAWIO_URL', 'COLLAB_URL', 'OLLAMA_API_URL'];

function maskEnvValue(key: string, value: string): string {
  if (!value) return '';
  if (SAFE_URL_KEYS.includes(key)) return value;
  const upper = key.toUpperCase();
  if (SENSITIVE_PATTERNS.some((p) => upper.includes(p))) {
    return value.slice(0, 4) + '***';
  }
  return value;
}

@Injectable()
export class AdminService {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  async getStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [users, workspaces, spaces, pages, missions, domains, activeUsers, storageRow, taskStatusRows] =
      await Promise.all([
        this.db
          .selectFrom('users')
          .where('deletedAt', 'is', null)
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
        this.db
          .selectFrom('workspaces')
          .where('deletedAt', 'is', null)
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
        this.db
          .selectFrom('spaces')
          .where('deletedAt', 'is', null)
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
        this.db
          .selectFrom('pages')
          .where('deletedAt', 'is', null)
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
        this.db
          .selectFrom('missions')
          .where('deletedAt', 'is', null)
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
        this.db
          .selectFrom('domains')
          .where('deletedAt', 'is', null)
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
        this.db
          .selectFrom('users')
          .where('deletedAt', 'is', null)
          .where('lastLoginAt', '>=', thirtyDaysAgo)
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .executeTakeFirst(),
        this.db
          .selectFrom('attachments')
          .select((eb) => eb.fn.sum('fileSize').as('total'))
          .executeTakeFirst(),
        this.db
          .selectFrom('pages')
          .where('deletedAt', 'is', null)
          .where('missionId', 'is not', null)
          .select(['taskStatus'])
          .select((eb) => eb.fn.countAll<number>().as('count'))
          .groupBy('taskStatus')
          .execute(),
      ]);

    const taskStatus: Record<string, number> = {};
    for (const row of taskStatusRows) {
      taskStatus[row.taskStatus ?? 'unknown'] = Number(row.count);
    }

    return {
      users: Number(users?.count ?? 0),
      workspaces: Number(workspaces?.count ?? 0),
      spaces: Number(spaces?.count ?? 0),
      pages: Number(pages?.count ?? 0),
      missions: Number(missions?.count ?? 0),
      domains: Number(domains?.count ?? 0),
      activeUsers: Number(activeUsers?.count ?? 0),
      storageBytes: Number(storageRow?.total ?? 0),
      taskStatus,
    };
  }

  async getRecentActivity(limit = 20) {
    return this.db
      .selectFrom('pages')
      .leftJoin('users', 'users.id', 'pages.lastUpdatedById')
      .where('pages.deletedAt', 'is', null)
      .select([
        'pages.id',
        'pages.title',
        'pages.updatedAt',
        'pages.spaceId',
        'users.name as updaterName',
        'users.email as updaterEmail',
        'users.avatarUrl as updaterAvatar',
      ])
      .orderBy('pages.updatedAt', 'desc')
      .limit(limit)
      .execute();
  }

  async getHealth() {
    let dbOk = false;
    try {
      await this.db.selectFrom('users').select('id').limit(1).executeTakeFirst();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const mem = process.memoryUsage();
    return {
      uptime: Math.floor(process.uptime()),
      db: dbOk ? 'ok' : 'error',
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
      },
      nodeVersion: process.version,
    };
  }

  async getUsers(page: number = 1, limit: number = 50) {
    const offset = (page - 1) * limit;

    const [rows, totalRow] = await Promise.all([
      this.db
        .selectFrom('users')
        .leftJoin('workspaces', 'workspaces.id', 'users.workspaceId')
        .where('users.deletedAt', 'is', null)
        .select([
          'users.id',
          'users.name',
          'users.email',
          'users.role',
          'users.avatarUrl',
          'users.createdAt',
          'users.lastLoginAt',
          'users.deactivatedAt',
          'workspaces.name as workspaceName',
          'workspaces.id as workspaceId',
        ])
        .orderBy('users.createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute(),
      this.db
        .selectFrom('users')
        .where('deletedAt', 'is', null)
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .executeTakeFirst(),
    ]);

    return {
      data: rows,
      total: Number(totalRow?.count ?? 0),
      page,
      limit,
    };
  }

  async getUserById(userId: string) {
    return this.db
      .selectFrom('users')
      .leftJoin('workspaces', 'workspaces.id', 'users.workspaceId')
      .where('users.id', '=', userId)
      .where('users.deletedAt', 'is', null)
      .select([
        'users.id',
        'users.name',
        'users.email',
        'users.role',
        'users.avatarUrl',
        'users.createdAt',
        'users.lastLoginAt',
        'users.deactivatedAt',
        'users.workspaceId',
        'workspaces.name as workspaceName',
      ])
      .executeTakeFirst();
  }

  async updateUser(userId: string, data: { name?: string; email?: string; role?: string }) {
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.email !== undefined) updates.email = data.email;
    if (data.role !== undefined) updates.role = data.role;

    if (Object.keys(updates).length === 0) return { success: true };

    await this.db
      .updateTable('users')
      .set(updates)
      .where('id', '=', userId)
      .execute();
    return { success: true };
  }

  async setUserDeactivated(userId: string, deactivate: boolean) {
    await this.db
      .updateTable('users')
      .set({
        deactivatedAt: deactivate ? new Date() : null,
      })
      .where('id', '=', userId)
      .execute();
    return { success: true };
  }

  getSystemEnv(): Record<string, string> {
    const KNOWN_KEYS = [
      'NODE_ENV', 'PORT', 'APP_URL',
      'STORAGE_DRIVER', 'FILE_UPLOAD_SIZE_LIMIT', 'FILE_IMPORT_SIZE_LIMIT',
      'MAIL_DRIVER', 'MAIL_FROM_ADDRESS', 'MAIL_FROM_NAME',
      'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_IGNORETLS',
      'REDIS_URL', 'DATABASE_URL',
      'JWT_TOKEN_EXPIRES_IN', 'APP_SECRET',
      'CLOUD', 'DISABLE_TELEMETRY',
      'SEARCH_DRIVER', 'TYPESENSE_URL',
      'AI_DRIVER', 'AI_COMPLETION_MODEL',
      'COLLAB_URL', 'COLLAB_DISABLE_REDIS',
      'DRAWIO_URL', 'OLLAMA_API_URL',
      'ADMIN_EMAILS',
    ];
    const result: Record<string, string> = {};
    for (const key of KNOWN_KEYS) {
      const val = process.env[key];
      if (val !== undefined) {
        result[key] = maskEnvValue(key, val);
      }
    }
    return result;
  }

  async getRecentLogins(limit = 30) {
    return this.db
      .selectFrom('users')
      .where('deletedAt', 'is', null)
      .where('lastLoginAt', 'is not', null)
      .select(['id', 'name', 'email', 'avatarUrl', 'lastLoginAt'])
      .orderBy('lastLoginAt', 'desc')
      .limit(limit)
      .execute();
  }
}
