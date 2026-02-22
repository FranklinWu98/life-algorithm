import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  Domain,
  InsertableDomain,
  UpdatableDomain,
} from '@docmost/db/types/entity.types';

@Injectable()
export class DomainRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  async findById(
    domainId: string,
    workspaceId: string,
  ): Promise<Domain | undefined> {
    return this.db
      .selectFrom('domains')
      .selectAll()
      .where('id', '=', domainId)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async findByWorkspace(workspaceId: string): Promise<Domain[]> {
    return this.db
      .selectFrom('domains')
      .selectAll()
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .orderBy('sortOrder', 'asc')
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async insertDomain(
    insertableDomain: InsertableDomain,
    trx?: KyselyTransaction,
  ): Promise<Domain> {
    const db = dbOrTx(this.db, trx);
    return db
      .insertInto('domains')
      .values(insertableDomain)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateDomain(
    updatableDomain: UpdatableDomain,
    domainId: string,
    trx?: KyselyTransaction,
  ): Promise<void> {
    const db = dbOrTx(this.db, trx);
    await db
      .updateTable('domains')
      .set({ ...updatableDomain, updatedAt: new Date() })
      .where('id', '=', domainId)
      .execute();
  }

  async softDelete(domainId: string): Promise<void> {
    await this.db
      .updateTable('domains')
      .set({ deletedAt: new Date() })
      .where('id', '=', domainId)
      .execute();
  }
}
