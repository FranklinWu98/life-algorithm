import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  Mission,
  InsertableMission,
  UpdatableMission,
} from '@docmost/db/types/entity.types';

@Injectable()
export class MissionRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  async findById(
    missionId: string,
    workspaceId: string,
  ): Promise<Mission | undefined> {
    return this.db
      .selectFrom('missions')
      .selectAll()
      .where('id', '=', missionId)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async findByDomain(
    domainId: string,
    workspaceId: string,
  ): Promise<Mission[]> {
    return this.db
      .selectFrom('missions')
      .selectAll()
      .where('domainId', '=', domainId)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .orderBy('sortOrder', 'asc')
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async findByWorkspace(
    workspaceId: string,
    status?: string,
  ): Promise<Mission[]> {
    let query = this.db
      .selectFrom('missions')
      .selectAll()
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null);

    if (status) {
      query = query.where('status', '=', status);
    }

    return query.orderBy('sortOrder', 'asc').orderBy('createdAt', 'asc').execute();
  }

  async insertMission(
    insertableMission: InsertableMission,
    trx?: KyselyTransaction,
  ): Promise<Mission> {
    const db = dbOrTx(this.db, trx);
    return db
      .insertInto('missions')
      .values(insertableMission)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateMission(
    updatableMission: UpdatableMission,
    missionId: string,
    trx?: KyselyTransaction,
  ): Promise<void> {
    const db = dbOrTx(this.db, trx);
    await db
      .updateTable('missions')
      .set({ ...updatableMission, updatedAt: new Date() })
      .where('id', '=', missionId)
      .execute();
  }

  async softDelete(missionId: string): Promise<void> {
    await this.db
      .updateTable('missions')
      .set({ deletedAt: new Date() })
      .where('id', '=', missionId)
      .execute();
  }
}
