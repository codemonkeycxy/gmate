function newTaskDisplay() {
  const header = htmlToElement('<div>GMate is currently searching room for the following events:</div>');
  const body = document.createElement('div');

  const taskDisplay = wrapUIComponents([header, body]);
  taskDisplay.pushTask = eventName => {
    body.appendChild(htmlToElement(`<div>${eventName}</div>`));
  };

  return taskDisplay;
}