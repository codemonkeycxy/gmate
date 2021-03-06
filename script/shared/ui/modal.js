/**
 * it's a shame that there's no good way to dynamically create elements from html file in chrome extension
 * (see a hacky way in here: https://stackoverflow.com/questions/19103183/how-to-insert-html-with-a-chrome-extension)
 *
 * the best way i can see now is to manually assembles the necessary component via code.
 * this function returns the following html
 * (html and styling reference: https://www.w3schools.com/howto/howto_css_modals.asp)

 <div class="modal">
     <div class="modal-content">
         <div class="modal-header">
             <h3>Modal Header</h3>
         </div>
         <div class="modal-body">
             <!--modal body to be injected according to the passed in parameter-->
         </div>
         <div class="modal-footer">
             <button>Cancel</button>
             <button>OK</button>
         </div>
     </div>
 </div>

 */
function renderModal(body, headerText, preConfirm, postConfirm, onCancel) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modal.appendChild(modalContent);

  _injectModalHeader(modalContent, headerText);
  _injectModalBody(modalContent, body);
  _injectModalFooter(modal, modalContent, preConfirm, postConfirm, onCancel);
  _handleCloseModalUX(modal);

  return modal;
}

function _injectModalHeader(modalContent, headerText) {
  if (!headerText) {
    return;
  }

  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'modal-header';

  const header = document.createElement('h3');
  header.innerText = headerText || '';
  headerWrapper.appendChild(header);

  modalContent.appendChild(headerWrapper);
}

function _injectModalBody(modalContent, body) {
  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  modalBody.appendChild(body);

  modalContent.appendChild(modalBody);
}

function _injectModalFooter(modal, modalContent, preConfirm, postConfirm, onCancel) {
  preConfirm = preConfirm || (() => true);
  postConfirm = postConfirm || noop();
  onCancel = onCancel || noop();

  const footerWrapper = document.createElement('div');
  footerWrapper.className = 'modal-footer';
  modalContent.appendChild(footerWrapper);

  const cancelBtn = document.createElement('span');
  cancelBtn.className = 'modal-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = async () => {
    await onCancel();
    hide(modal);
  };
  footerWrapper.appendChild(cancelBtn);

  const confirmBtn = document.createElement('span');
  confirmBtn.className = 'modal-confirm';
  confirmBtn.textContent = 'OK';
  confirmBtn.onclick = async () => {
    if (!await preConfirm()) {
      // allow callback hook to abort operation
      return;
    }
    hide(modal);
    await postConfirm();
  };
  footerWrapper.appendChild(confirmBtn);
}

function _handleCloseModalUX(modal) {
  // When the user clicks anywhere outside of the modal, close it
  window.onclick = event => {
    if (event.target === modal) {
      hide(modal);
    }
  };

  // When the user presses escape, close the modal
  document.onkeydown = evt => {
    evt = evt || window.event;
    if (evt.keyCode === 27) {
      hide(modal);
    }
  };
}