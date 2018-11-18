const port = chrome.extension.connect({
  name: "long-lived pipe"
});

function startWorker() {
  port.postMessage({
    type: START_WORKER
  });
}

function stopWorker() {
  port.postMessage({
    type: STOP_WORKER
  });
}

// add worker controller buttons
document.getElementById(START_WORKER).onclick = startWorker;
document.getElementById(STOP_WORKER).onclick = stopWorker;