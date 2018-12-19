/**
 * it's a shame that there's no good way to dynamically create elements from html file in chrome extension
 * (see a hacky way in here: https://stackoverflow.com/questions/19103183/how-to-insert-html-with-a-chrome-extension)
 *
 * the best way i can see now is to manually assembles the necessary component via code.
 * this function returns the following html
 * (html and styling reference: https://www.w3schools.com/howto/howto_css_modals.asp)

 <div class="modal">
     <div class="modal-content">
         <span class="close">&times;</span>
         <div class="modal-header">
             <h3>Modal Header</h3>
         </div>
         <div class="modal-body">
             <!--modal body to be injected according to the passed in parameter-->
         </div>
     </div>
 </div>

 */
function renderModal(body, headerText) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modal.appendChild(modalContent);

  // ======================= construct modal close button ========================
  const closeBtn = document.createElement('span');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = 'x';
  closeBtn.onclick = () => modal.style.display = "none";
  modalContent.appendChild(closeBtn);

  // ======================= construct modal header ========================
  const headerWrapper = document.createElement('div');
  headerWrapper.className = 'modal-header';

  const header = document.createElement('h3');
  header.innerText = headerText || '';
  headerWrapper.appendChild(header);

  modalContent.appendChild(headerWrapper);

  // ======================= construct modal body ========================
  const modalBody = document.createElement('div');
  modalBody.className = 'modal-body';
  modalBody.appendChild(body);

  modalContent.appendChild(modalBody);

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = event => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };

  // When the user presses escape, close the modal
  document.onkeydown = evt => {
    evt = evt || window.event;
    if (evt.keyCode === 27) {
      modal.style.display = "none";
    }
  };

  return modal;
}