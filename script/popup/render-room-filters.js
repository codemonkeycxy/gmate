// self-invoking function to avoid name collision
(async () => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filter-ui-group';

  const uiGroupWrapper = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);
  uiGroupWrapper.appendChild(await asyncRenderRoomBookingFilters(
    async val => await persistPairSync(ROOM_BOOKING_FILTER_POSITIVE, val),
    async val => await persistPairSync(ROOM_BOOKING_FILTER_NEGATIVE, val),
    async (key, val) => await persistPairSync(key, val),
  ));
})();