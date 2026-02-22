import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  Task,
  InsertableTask,
  UpdatableTask,
} from '@docmost/db/types/entity.types';
import { ExpressionBuilder } from 'kysely';
import { DB } from '@docmost/db/types/db';
import { jsonObjectFrom } from 'kysely/helpers/postgres';

@Injectable()
export class TaskRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  async findById(
    taskId: string,
    workspaceId: string,
    opts?: { includeNote?: boolean; includeCreator?: boolean },
  ): Promise<Task | undefined> {
    let query = this.db
      .selectFrom('tasks')
      .selectAll('tasks')
      .where('tasks.id', '=', taskId)
      .where('tasks.workspaceId', '=', workspaceId)
      .where('tasks.deletedAt', 'is', null);

    if (opts?.includeNote) {
      query = query.select((eb) => this.withNote(eb)) as typeof query;
    }

    if (opts?.includeCreator) {
      query = query.select((eb) => this.withCreator(eb)) as typeof query;
    }

    return query.executeTakeFirst();
  }

  async findByMission(
    missionId: string,
    workspaceId: string,
    opts?: { status?: string; includeNote?: boolean },
  ): Promise<Task[]> {
    let query = this.db
      .selectFrom('tasks')
      .selectAll('tasks')
      .where('missionId', '=', missionId)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null);

    if (opts?.status) {
      query = query.where('status', '=', opts.status);
    }

    if (opts?.includeNote) {
      query = query.select((eb) => this.withNote(eb)) as typeof query;
    }

    return query.orderBy('sortOrder', 'asc').orderBy('createdAt', 'asc').execute();
  }

  async findByWorkspace(
    workspaceId: string,
    filters?: {
      status?: string;
      missionId?: string;
      importantLevel?: number;
      timeToDoStart?: Date;
      timeToDoEnd?: Date;
    },
  ): Promise<Task[]> {
    let query = this.db
      .selectFrom('tasks')
      .selectAll()
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null);

    if (filters?.status) {
      query = query.where('status', '=', filters.status);
    }
    if (filters?.missionId) {
      query = query.where('missionId', '=', filters.missionId);
    }
    if (filters?.importantLevel !== undefined) {
      query = query.where('importantLevel', '=', filters.importantLevel);
    }
    if (filters?.timeToDoStart) {
      query = query.where('timeToDoStart', '>=', filters.timeToDoStart);
    }
    if (filters?.timeToDoEnd) {
      query = query.where('timeToDoEnd', '<=', filters.timeToDoEnd);
    }

    return query
      .orderBy('importantLevel', 'desc')
      .orderBy('sortOrder', 'asc')
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async insertTask(
    insertableTask: InsertableTask,
    trx?: KyselyTransaction,
  ): Promise<Task> {
    const db = dbOrTx(this.db, trx);
    return db
      .insertInto('tasks')
      .values(insertableTask)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateTask(
    updatableTask: UpdatableTask,
    taskId: string,
    trx?: KyselyTransaction,
  ): Promise<void> {
    const db = dbOrTx(this.db, trx);
    await db
      .updateTable('tasks')
      .set({ ...updatableTask, updatedAt: new Date() })
      .where('id', '=', taskId)
      .execute();
  }

  async softDelete(taskId: string): Promise<void> {
    await this.db
      .updateTable('tasks')
      .set({ deletedAt: new Date() })
      .where('id', '=', taskId)
      .execute();
  }

  withNote(eb: ExpressionBuilder<DB, 'tasks'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('taskNotes')
        .select(['taskNotes.content', 'taskNotes.textContent', 'taskNotes.version', 'taskNotes.updatedAt'])
        .whereRef('taskNotes.taskId', '=', 'tasks.id'),
    ).as('note');
  }

  withCreator(eb: ExpressionBuilder<DB, 'tasks'>) {
    return jsonObjectFrom(
      eb
        .selectFrom('users')
        .select(['users.id', 'users.name', 'users.avatarUrl'])
        .whereRef('users.id', '=', 'tasks.creatorId'),
    ).as('creator');
  }
}
