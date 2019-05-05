const EVENT_STATUS = {
  CONFIRMED: 'confirmed',
  TENTATIVE: 'tentative',
  CANCELLED: 'cancelled',
};

const ATTENDEE_STATUS = {
  NEEDS_ACTION: 'needsAction',
  DECLINED: 'declined',
  TENTATIVE: 'tentative',
  ACCEPTED: 'accepted'
};

class Event {
  constructor({status, start, rooms, humanAttendees}) {
    this.status = status;
    this.start = start;
    this.rooms = rooms || [];
    this.humanAttendees = humanAttendees || [];
  }

  isPast() {
    const now = new Date();
    return this.start < now;
  }

  isCancelled() {
    return this.status === EVENT_STATUS.CANCELLED;
  }

  isRoomConfirmed(roomEmail) {
    if (isEmpty(this.rooms)) {
      return false;
    }

    return this.rooms.some(room => room.email === roomEmail && room.status === ATTENDEE_STATUS.ACCEPTED);
  }
}

class Attendee {
  constructor({id, email, status}) {
    this.id = id;
    this.email = email;
    this.status = status;
  }
}

class HumanAttendee extends Attendee {
  constructor(gAttendee) {
    super(gAttendee);
  }
}

class Room extends Attendee {
  constructor(gAttendee) {
    super(gAttendee);
  }
}