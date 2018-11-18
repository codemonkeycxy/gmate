const START_WORKER_BTN_ID = 'start-worker';
const STOP_WORKER_BTN_ID = 'stop-worker';

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
document.getElementById(START_WORKER_BTN_ID).onclick = startWorker;
document.getElementById(STOP_WORKER_BTN_ID).onclick = stopWorker;