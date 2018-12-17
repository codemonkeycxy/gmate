// self-invoking function to avoid name collision
(() => {
  const overlayId = 'overlay';

  function addOverlay() {
    if (document.getElementById(overlayId)) {
      return;
    }

    // see styling folder for overlay styling
    const overlay = document.createElement("div");
    overlay.id = overlayId;

    insertBefore(overlay, document.body.firstChild);
  }

  onMessage((msg, sender, sendResponse) => {
    if (msg.type === ADD_OVERLAY) {
      addOverlay();
    }
  });
})();