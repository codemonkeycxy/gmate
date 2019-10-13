function newTaskDisplay() {
  const header = htmlToElement('<div>GMate is currently searching for:</div>');
  const body = document.createElement('ul');
  hide(header);
  hide(body);

  const taskDisplay = wrapUIComponents([header, body]);
  taskDisplay.pushTask = eventFilters => {
    show(header);
    show(body);
    body.appendChild(htmlToElement(`<li>A room ${eventFilters.toSummary()}</li>`));
  };

  return taskDisplay;
}