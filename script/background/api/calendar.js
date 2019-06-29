/**
 * naming convention:
 *   - g<Name> means google api object format. e.g. gEvent, gAttendee
 *   - <Name> (without "g" prefix) means internal entity. e.g. Event, Room, HumanAttendee
 *
 * g<Name> can be used within this namespace, returned objects MUST either be primitives or internal entities
 */
function buildCalendarAPI() {
  function toCalendarId(ownerEmail) {
    if (!ownerEmail) {
      return 'primary';
    }

    // possible calendar id suffixes: https://webapps.stackexchange.com/questions/116392/how-to-get-a-link-to-add-a-google-calendar
    // it's observed that sometimes the b64 event id gets the suffix cut off after @g with unclear reasons
    // since @group.calendar.google.com is the most common calendar id suffix that starts with a "g", assume that for now
    if (ownerEmail.endsWith('@g')) {
      return ownerEmail.replace('@g', '@group.calendar.google.com')
    }

    return ownerEmail;
  }

  async function getGEvent(eventId, ownerEmail) {
    const result = await _callCalendarAPI(`https://www.googleapis.com/calendar/v3/calendars/${toCalendarId(ownerEmail)}/events/${eventId}`);
    if (result.error) {
      GMateError(`event fetching error - ${result.error.message}`, {
        eventId,
        ownerEmail,
        error: result.error
      });
    }

    return result.error ? null : result;
  }

  async function getEventB64(b64Id) {
    const {id, ownerEmail} = decodeEventId(b64Id);
    const gEvent = await getGEvent(id, ownerEmail);
    if (!gEvent) {
      return null;
    }

    return toInternalEvent(gEvent);
  }

  async function getRecurringGEvents(eventId, ownerEmail, start, end) {
    const gEvent = await getGEvent(eventId, ownerEmail);
    const recurringEventId = gEvent.recurringEventId;
    if (!recurringEventId) {
      return [];
    }

    const result = await _callCalendarAPI(
      `https://www.googleapis.com/calendar/v3/calendars/${toCalendarId(ownerEmail)}/events/${
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
    const gEvent = await getGEvent(id, ownerEmail);
    const start = new Date(gEvent.start.dateTime);
    const end = new Date();
    end.setDate(start.getDate() + 7 * lookAheadWeeks);

    const recurringGEvents = await getRecurringGEvents(id, ownerEmail, start, end);
    return recurringGEvents.map(gEvent => encodeEventId(gEvent.id, ownerEmail));
  }

  async function updateGEvent(eventId, ownerEmail, gEvent) {
    return await _callCalendarAPI(
      `https://www.googleapis.com/calendar/v3/calendars/${toCalendarId(ownerEmail)}/events/${eventId}?sendUpdates=none`,
      'PUT',
      gEvent
    );
  }

  async function addRoom(eventId, ownerEmail, roomEmail) {
    const gEvent = await getGEvent(eventId, ownerEmail);
    gEvent.attendees = gEvent.attendees || [];
    gEvent.attendees.push({
      email: roomEmail
    });
    return await updateGEvent(eventId, ownerEmail, gEvent);
  }

  async function addRoomB64(b64Id, roomEmail) {
    const {id, ownerEmail} = decodeEventId(b64Id);
    return await addRoom(id, ownerEmail, roomEmail);
  }

  async function pickFreeRooms(startTsStr, endTsStr, roomEmails) {
    if (isEmpty(roomEmails)) {
      return [];
    }

    const availabilities = await checkRoomAvailability(startTsStr, endTsStr, roomEmails);
    return roomEmails.filter(email => {
      const avail = availabilities[email];
      return avail && isEmpty(avail.errors) && isEmpty(avail.busy);
    });
  }

  async function checkRoomAvailability(startTsStr, endTsStr, roomEmails) {
    let result = {};

    // freeBusy api has a 50 item size limit
    const emailChunks = chunk(roomEmails, 50);
    for (let i = 0; i < emailChunks.length; i++) {
      const emailChunk = emailChunks[i];
      console.log(`check room availability batch ${i + 1}; count: ${emailChunk.length}`);
      const availability = await _checkRoomAvailability(startTsStr, endTsStr, emailChunk);
      result = Object.assign(result, availability);
    }

    return result;
  }

  async function _checkRoomAvailability(startTsStr, endTsStr, roomEmails) {
    const params = {
      timeMin: startTsStr,
      timeMax: endTsStr,
      items: roomEmails.map(email => ({id: email})),
      calendarExpansionMax: 50
    };
    const res = await _callCalendarAPI(
      `https://www.googleapis.com/calendar/v3/freeBusy`,
      'POST',
      params
    );

    return res.calendars;
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
