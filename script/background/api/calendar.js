/**
 * naming convention:
 *   - g<Name> means google api object format. e.g. gEvent, gAttendee
 *   - <Name> (without "g" prefix) means internal entity. e.g. Event, Room, HumanAttendee
 *
 * g<Name> can be used within this namespace, returned objects MUST either be primitives or internal entities
 */
function buildCalendarAPI() {
  async function getGEvent(eventId) {
    const result = await _callCalendarAPI(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`);
    return result.error ? null : result;
  }

  async function getEventB64(b64Id) {
    const gEvent = await getGEvent(decodeEventId(b64Id).id);
    if (!gEvent) {
      return null;
    }

    return toInternalEvent(gEvent);
  }

  async function getRecurringGEvents(eventId, start, end) {
    const gEvent = await getGEvent(eventId);
    const recurringEventId = gEvent.recurringEventId;
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
    const gEvent = await getGEvent(id);
    const start = new Date(gEvent.start.dateTime);
    const end = new Date();
    end.setDate(start.getDate() + 7 * lookAheadWeeks);

    const recurringGEvents = await getRecurringGEvents(id, start, end);
    return recurringGEvents.map(gEvent => encodeEventId(gEvent.id, ownerEmail));
  }

  async function updateGEvent(gEvent) {
    return await _callCalendarAPI(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${gEvent.id}?sendUpdates=none`,
      'PUT',
      gEvent
    );
  }

  async function addRoom(eventId, roomEmail) {
    const gEvent = await getGEvent(eventId);
    gEvent.attendees = gEvent.attendees || [];
    gEvent.attendees.push({
      email: roomEmail
    });
    return await updateGEvent(gEvent);
  }

  async function addRoomB64(b64Id, roomEmail) {
    return await addRoom(decodeEventId(b64Id).id, roomEmail);
  }

  async function pickFreeRooms(startStr, endStr, roomEmails) {
    if (isEmpty(roomEmails)) {
      return [];
    }

    const params = {
      timeMin: startStr,
      timeMax: endStr,
      items: roomEmails.map(email => ({id: email}))
    };
    const freeBusy = await _callCalendarAPI(
      `https://www.googleapis.com/calendar/v3/freeBusy`,
      'POST',
      params
    );
    if (isEmpty(freeBusy.calendars)) {
      return [];
    }

    return roomEmails.filter(id => {
      const roomAvailability = freeBusy.calendars[id];
      return roomAvailability && !isEmpty(roomAvailability.busy);
    });
  }

  /**
   * Get all the rooms can be booked by the current user. Expect this function to run for long. Don't use it frequently
   * or block UI experience
   *
   * Note: this function returns a raw dictionary instead of an entity for easier serialization/deserialization
   */
  async function getAllRooms() {
    const rooms = [];
    let hasNext = true;
    let pageToken = "";
    let countdown = 20;  // use a countdown to guard against infinite loop

    while (countdown > 0 && hasNext) {
      countdown--;
      const result = await _getAllRoomsNext(pageToken);
      pageToken = result.nextPageToken;
      hasNext = Boolean(result.nextPageToken);

      result.items.forEach(item => rooms.push({
        email: item.resourceEmail,
        name: item.generatedResourceName,
      }));
    }

    if (countdown === 0) {
      GMateError("getAllRooms hits infinite loop");
    }

    return rooms;
  }

  async function _getAllRoomsNext(pageToken) {
    let url = "https://www.googleapis.com/admin/directory/v1/customer/my_customer/resources/calendars?maxResults=500&orderBy=resourceName";
    if (pageToken) {
      url = `${url}&pageToken=${pageToken}`;
    }

    return await _callCalendarAPI(url);
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

  // gEvent - google api event defined here: https://developers.google.com/calendar/v3/reference/events#resource
  function toInternalEvent(gEvent) {
    if (!Object.values(EVENT_STATUS).includes(gEvent.status)) {
      throw GMateError(`unrecognized event status ${gEvent.status}`);
    }

    const attendees = gEvent.attendees || [];
    return new Event({
      id: gEvent.id,
      name: gEvent.summary,
      status: gEvent.status,
      start: new Date(gEvent.start.dateTime),
      startStr: gEvent.start.dateTime,
      end: new Date(gEvent.end.dateTime),
      endStr: gEvent.end.dateTime,
      rooms: attendees.filter(gAttendee => gAttendee.resource).map(gAttendee => toInternalRoom(gAttendee)),
      humanAttendees: attendees.filter(gAttendee => !gAttendee.resource).map(gAttendee => toInternalHumanAttendee(gAttendee)),
    });
  }

  // gAttendee - google api attendee defined here: https://developers.google.com/calendar/v3/reference/events#resource
  function toInternalRoom(gAttendee) {
    if (!Object.values(ATTENDEE_STATUS).includes(gAttendee.responseStatus)) {
      throw GMateError(`unrecognized attendee status ${gAttendee.responseStatus}`);
    }

    return new Room({
      email: gAttendee.email,
      status: gAttendee.responseStatus,
      name: gAttendee.displayName,
    });
  }

  // gAttendee - google api attendee defined here: https://developers.google.com/calendar/v3/reference/events#resource
  function toInternalHumanAttendee(gAttendee) {
    if (!Object.values(ATTENDEE_STATUS).includes(gAttendee.responseStatus)) {
      throw GMateError(`unrecognized attendee status ${gAttendee.responseStatus}`);
    }

    return new HumanAttendee({
      email: gAttendee.email,
      status: gAttendee.responseStatus,
    });
  }

  return {
    getEventB64,
    getAllRooms,
    eventIdToRecurringIdsB64,
    pickFreeRooms,

    addRoomB64,
  }
}

const CalendarAPI = buildCalendarAPI();
