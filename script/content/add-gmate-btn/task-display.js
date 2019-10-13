function newTaskDisplay() {
  const header = htmlToElement('<div>GMate is currently searching for:</div>');
  const body = document.createElement('div');
  hide(header);

  const taskDisplay = wrapUIComponents([header, body]);
  taskDisplay.pushTask = eventFilters => {
    show(header);
    body.appendChild(htmlToElement(`<div>A room ${eventFilters.toSummary()}</div>`));
  };

  return taskDisplay;
}