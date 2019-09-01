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
  constructor({id, name, htmlLink, status, start, startStr, end, endStr, rooms, humanAttendees}) {
    this.id = id;
    this.name = name || '';
    this.htmlLink = htmlLink;
    this.status = status;
    this.start = start;
    this.startStr = startStr;
    this.end = end;
    this.endStr = endStr;
    this.rooms = rooms || [];
    this.humanAttendees = humanAttendees || [];
  }

  isInPast() {
    const now = new Date();
    return this.start < now;
  }

  isCancelled() {
    return this.status === EVENT_STATUS.CANCELLED;
  }

  likelyOneOnOne() {
    if (this.humanAttendees.length !== 2) {
      return false;
    }

    if (!this.name.trim()) {
      return true;
    }

    if (this.name.includes('1:1')) {
      return true;
    }

    if (this.name.includes('1-1')) {
      return true;
    }

    if (this.name.includes('1x1')) {
      return true;
    }

    if (this.name.toLowerCase().includes('one on one')) {
      return true;
    }

    if (this.name.includes('/')) {
      return true;
    }

    if (this.name.includes('|')) {
      return true;
    }

    if (this.name.includes(':')) {
      return true;
    }

    if (this.name.includes('&')) {
      return true;
    }

    if (this.name.includes('-')) {
      return true;
    }

    if (this.name.includes(' x ')) {
      return true;
    }

    if (this.name.includes('<>')) {
      return true;
    }

    return false;
  }

  hasRoomAccepted(roomEmail) {
    if (isEmpty(this.rooms)) {
      return false;
    }

    return this.rooms.some(room => room.email === roomEmail && room.isAccepted());
  }

  matchingRooms(filters) {
    const rooms = this.rooms.filter(room => room.isAccepted());
    return rooms.filter(room => matchRoom(room, filters));
  }
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
  constructor({email, status, isOrganizer}) {
    super({email, status});

    this.isOrganizer = isOrganizer;
  }
}
