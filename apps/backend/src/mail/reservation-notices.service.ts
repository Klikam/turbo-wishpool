import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNotNull, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { giftsTable, usersTable, wishlistsTable } from '../db/schema';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import {
  giftEditedMail,
  giftsRemovedMail,
  type RemovedReservation,
} from './gift-removed.mail';
import { MailService } from './mail.service';

/**
 * Owners can't see reservations, so when they delete a reserved gift (or the
 * list it is on) the reserver is emailed instead. Look the reservations up
 * before deleting, send once the delete has succeeded.
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
      .innerJoin(usersTable, eq(usersTable.id, giftsTable.reservedByUserId))
      .innerJoin(wishlistsTable, eq(wishlistsTable.id, giftsTable.wishlistId))
      .innerJoin(owners, eq(owners.id, wishlistsTable.userId))
      .where(and(isNotNull(giftsTable.reservedAt), condition));
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

  /** One email per reserver, sent in the background so the owner's request isn't slowed down. */
  notifyRemoved(reservations: RemovedReservation[]) {
    const byRecipient = new Map<string, RemovedReservation[]>();
    for (const reservation of reservations) {
      const list = byRecipient.get(reservation.to) ?? [];
      list.push(reservation);
      byRecipient.set(reservation.to, list);
    }

    for (const [to, removed] of byRecipient) {
      this.mail.sendInBackground(giftsRemovedMail(to, removed));
    }
  }
}
