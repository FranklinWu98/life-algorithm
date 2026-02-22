import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  TaskNote,
  InsertableTaskNote,
  UpdatableTaskNote,
} from '@docmost/db/types/entity.types';

@Injectable()
export class TaskNoteRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  async findByTaskId(taskId: string): Promise<TaskNote | undefined> {
    return this.db
      .selectFrom('taskNotes')
      .selectAll()
      .where('taskId', '=', taskId)
      .executeTakeFirst();
  }

  async upsertNote(
    insertableNote: InsertableTaskNote,
    trx?: KyselyTransaction,
  ): Promise<TaskNote> {
    const db = dbOrTx(this.db, trx);
    return db
      .insertInto('taskNotes')
      .values(insertableNote)
      .onConflict((oc) =>
        oc.column('taskId').doUpdateSet({
          content: insertableNote.content,
          ydoc: insertableNote.ydoc,
          textContent: insertableNote.textContent,
          tsv: insertableNote.tsv,
          version: insertableNote.version,
          updatedAt: new Date(),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateNote(
    updatableNote: UpdatableTaskNote,
    taskId: string,
    trx?: KyselyTransaction,
  ): Promise<void> {
    const db = dbOrTx(this.db, trx);
    await db
      .updateTable('taskNotes')
      .set({ ...updatableNote, updatedAt: new Date() })
      .where('taskId', '=', taskId)
      .execute();
  }

  async deleteNote(taskId: string, trx?: KyselyTransaction): Promise<void> {
    const db = dbOrTx(this.db, trx);
    await db.deleteFrom('taskNotes').where('taskId', '=', taskId).execute();
  }
}
