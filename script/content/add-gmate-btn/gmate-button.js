function newGMateBtn(eventId) {
  const gmateBtn = newButton(SEARCH_ROOM_BTN_MSG);
  gmateBtn.style.backgroundColor = '#4285f4';
  gmateBtn.style.color = '#fff';
  gmateBtn.style.height = '32px';
  gmateBtn.style.fontSize = '12px';
  gmateBtn.style.marginTop = '7px';
  gmateBtn.style.marginBottom = '4px';
  gmateBtn.style.paddingLeft = '12px';
  gmateBtn.style.paddingRight = '12px';

  if (isEmpty(eventId)) {
    gmateBtn.style.backgroundColor = '#cccccc';
    gmateBtn.style.color = '#666666';
    gmateBtn.addEventListener("click", () => alert(
      "Looks like this event hasn't been saved yet. Save the event and try again :)"
    ));
  }

  return gmateBtn;
}