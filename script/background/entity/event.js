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
  constructor({id, name, status, start, rooms, humanAttendees}) {
    this.id = id;
    this.name = name;
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

  hasRoomAccepted(roomEmail) {
    if (isEmpty(this.rooms)) {
      return false;
    }

    return this.rooms.some(room => room.email === roomEmail && room.isAccepted());
  }

  // hasMatchingRoom() {
  //   rooms = rooms.filter(room => room.status !== DECLINED);
  //   return rooms.filter(room => matchRoom(room.name, posFilter, negFilter, flexFilters));
  // }
}

class Attendee {
  constructor({email, status}) {
    this.email = email;
    this.status = status;
  }

  isAccepted() {
    return this.status === ATTENDEE_STATUS.ACCEPTED;
  }
}

class HumanAttendee extends Attendee {
  constructor({email, status}) {
    super({email, status});
  }
}

class Room extends Attendee {
  constructor({email, status, name}) {
    super({email, status});

    this.name = name;
  }
}