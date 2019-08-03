const TASK_TYPE = {
  NAP: "nap",
  EVENT: "event"
};

function EventTask(eventId, eventName, eventFilters) {
  return {
    id: nextId(),
    type: TASK_TYPE.EVENT,
    data: {
      eventId: eventId,
      eventName: eventName,
      eventFilters: eventFilters
    }
  };
}

function NapTask() {
  return {
    id: nextId(),
    type: TASK_TYPE.NAP
  }
}