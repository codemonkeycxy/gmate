// self-invoking function to avoid name collision
(async () => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filter-ui-group';

  const uiGroupWrapper = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);
  uiGroupWrapper.appendChild(await asyncRenderRoomBookingFilters());

  // ----------------------- old style regex based filters --------------------------
  document.addEventListener("DOMContentLoaded", restoreOptions);

  // Restores feature toggle values using the preferences stored in chrome.storage
  async function restoreOptions() {
    // fill out saved room booking filters. use default if nothing is found
    const settings = await getFromStorage(DEFAULT_ROOM_BOOKING_FILTERS);
    Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(
      key => document.getElementById(key).value = settings[key]
    );
  }

  // add filter input listener
  Object.keys(DEFAULT_ROOM_BOOKING_FILTERS).forEach(key =>
    document.getElementById(key).addEventListener("input", e => persistPair(key, e.target.value))
  );
})();