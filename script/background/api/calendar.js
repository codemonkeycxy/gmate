function buildCalendarAPI() {
  const RESPONSE_STATUS = {
    NEEDS_ACTION: 'needsAction',
    DECLINED: 'declined',
    TENTATIVE: 'tentative',
    ACCEPTED: 'accepted'
  };

  async function isRoomConfirmedB64(b64Id, roomEmail) {
    const event = await getEventB64(b64Id);
    if (!event || isEmpty(event.attendees)) {
      // no room in the first place
      return false;
    }

    return event.attendees.some(
      attendee => attendee.email === roomEmail && attendee.responseStatus === RESPONSE_STATUS.ACCEPTED
    );
  }

  async function isEventCancelledB64(b64Id) {
    const event = await getEventB64(b64Id);
    return event && event.status === 'cancelled';
  }

  async function isPastEventB64(b64Id) {
    const event = await getEventB64(b64Id);
    const now = new Date();

    return event && new Date(event.start.dateTime) < now;
  }

  async function getEvent(eventId) {
    const result = await _callCalendarAPI(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`);
    return result.error ? null : result;
  }

  async function getEventB64(b64Id) {
    return await getEvent(decodeEventId(b64Id).id);
  }

  async function getRecurringEvents(eventId, start, end) {
    const event = await getEvent(eventId);
    const recurringEventId = event.recurringEventId;
    if (!recurringEventId) {
      return [];
    }

    const result = await _callCalendarAPI(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${
        recurringEventId
      }/instances?timeMin=${
        start.toISOString()
      }&timeMax=${
        end.toISOString()
      }`
    );

    return result.items;
  }

  async function eventIdToRecurringIdsB64(b64Id, lookAheadWeeks = 54) {
    const {id, ownerEmail} = decodeEventId(b64Id);
    const event = await getEvent(id);
    const start = new Date(event.start.dateTime);
    const end = new Date();
    end.setDate(start.getDate() + 7 * lookAheadWeeks);

    const recurringEvents = await getRecurringEvents(id, start, end);
    return recurringEvents.map(recurringEvent => encodeEventId(recurringEvent.id, ownerEmail));
  }

  async function updateEvent(event) {
    return await _callCalendarAPI(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}`,
      'PUT',
      event
    );
  }

  async function addRoom(eventId, roomEmail) {
    const event = await getEvent(eventId);
    event.attendees = event.attendees || [];
    event.attendees.push({
      email: roomEmail
    });
    return await updateEvent(event);
  }

  async function addRoomB64(b64Id, roomEmail) {
    return await addRoom(decodeEventId(b64Id).id, roomEmail);
  }

  async function _callCalendarAPI(url, method = 'GET', data) {
    const queryParams = {
      headers: await _getRequestHeader(),
      method,
      body: data ? JSON.stringify(data) : undefined
    };

    return await new Promise(
      resolve => fetch(url, queryParams)
        .then(response => response.json()) // Transform the data into json
        .then(data => resolve(data))
        .catch(error => {
          throw GMateError(error.message);
        })
    );
  }

  async function _getRequestHeader() {
    return new Headers({
      'Authorization': 'Bearer ' + await getAuthToken(),
      'Content-Type': 'application/json'
    });
  }

  return {
    getEventB64,
    isPastEventB64,
    isRoomConfirmedB64,
    isEventCancelledB64,
    eventIdToRecurringIdsB64,

    addRoomB64,
  }
}

const CalendarAPI = buildCalendarAPI();
