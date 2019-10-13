function newTaskDisplay() {
  const header = htmlToElement('<div>GMate is currently searching room for the following events:</div>');
  const body = document.createElement('div');
  hide(header);

  const taskDisplay = wrapUIComponents([header, body]);
  taskDisplay.pushTask = eventName => {
    show(header);
    body.appendChild(htmlToElement(`<div>${eventName}</div>`));
  };

  return taskDisplay;
}