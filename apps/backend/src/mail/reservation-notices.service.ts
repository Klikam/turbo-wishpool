import { Inject, Injectable } from '@nestjs/common';
import { eq, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  giftReservationsTable,
  giftsTable,
  usersTable,
  wishlistsTable,
} from '../db/schema';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import {
  giftEditedMail,
  giftRemovedMail,
  type RemovedReservation,
} from './gift-removed.mail';
import { MailService } from './mail.service';

/**
 * Owners can't see reservations, so when they edit or delete a reserved gift
 * the reserver is emailed instead. Look the reservations up before changing
 * the gift, send once the change has succeeded.
 */
@Injectable()
export class ReservationNoticeService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
    private mail: MailService,
  ) {}

  /** Reservations on the gifts matching `condition`. */
  async findReservations(condition: SQL | undefined) {
    const owners = alias(usersTable, 'owners');

    return this.db
      .select({
        to: usersTable.email,
        giftName: giftsTable.name,
        wishlistTitle: wishlistsTable.title,
        ownerName: owners.name,
      })
      .from(giftsTable)
      .innerJoin(
        giftReservationsTable,
        eq(giftReservationsTable.giftId, giftsTable.id),
      )
      .innerJoin(usersTable, eq(usersTable.id, giftReservationsTable.userId))
      .innerJoin(wishlistsTable, eq(wishlistsTable.id, giftsTable.wishlistId))
      .innerJoin(owners, eq(owners.id, wishlistsTable.userId))
      .where(condition);
  }

  /** Tells the reservers of an edited gift what changed. */
  notifyEdited(
    reservations: RemovedReservation[],
    newName: string,
    changes: string[],
  ) {
    if (changes.length === 0) return;

    for (const reservation of reservations) {
      this.mail.sendInBackground(giftEditedMail(reservation, newName, changes));
    }
  }

  /** Tells the reservers of a deleted gift that it is gone. */
  notifyRemoved(reservations: RemovedReservation[]) {
    for (const reservation of reservations) {
      this.mail.sendInBackground(giftRemovedMail(reservation));
    }
  }
}
