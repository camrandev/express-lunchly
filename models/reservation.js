"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");
const { BadRequestError } = require("../expressError");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    console.log("startAt=", startAt)
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
        [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  /** save a reservation OR add new reservation if new */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE reservations
             SET customer_id=$1,
                num_guests=$2,
                 start_at=$3,
                 notes=$4
             WHERE id = $5`, [
            this.customerId,
            this.numGuests,
            this.startAt,
            this.notes,
            this.id,
          ],
      );
    }
  }

//////////////// GET / SET

  /** get /set for notes */

  get notes() {
    return this._notes;
  }
  set notes(note) {
    if (!note) {
      note = "";
    }
    this._notes = note;
  }

  /** get / set for numGuests */

  get numGuests() {
    return this._numGuests;
  }
  set numGuests(attendees) {
    if (attendees < 1) {
      throw new BadRequestError("Must have at least 1 guest")
    }
    this._numGuests = attendees;
  }

  /** get / set for startAt */

  get startAt() {
    return this._startAt;
  }
  set startAt(date) {
    if (isNaN(new Date(date))) {
      throw new BadRequestError("Invalid date")
    }
    this._startAt = new Date(date);
  }

}


module.exports = Reservation;
