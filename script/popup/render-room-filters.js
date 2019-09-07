// self-invoking function to avoid name collision
(async () => {
  const ROOM_BOOKING_FILTERS_UI_GROUP = 'room-booking-filter-ui-group';

  const uiGroupWrapper = document.getElementById(ROOM_BOOKING_FILTERS_UI_GROUP);
  uiGroupWrapper.appendChild(await asyncRenderRoomBookingFilters(
    persistPosRegexFilter,
    persistNegRegexFilter,
    persistNegTextFilter,
    persistFlexFilter,
  ));
})();