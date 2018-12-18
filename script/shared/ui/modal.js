/**
 * it's a shame that there's no good way to dynamically create elements from html file in chrome extension
 * (see a hacky way in here: https://stackoverflow.com/questions/19103183/how-to-insert-html-with-a-chrome-extension)
 *
 * the best way i can see now is to manually assembles the necessary component via code.
 * this function returns the following html
 * (html and styling reference: https://www.w3schools.com/howto/howto_css_modals.asp)

 <div class="modal">
     <div class="modal-content">
         <span class="modal-close">&times;</span>
         <p>Some text in the Modal..</p>
     </div>
 </div>

 */
function renderModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  const closeBtn = document.createElement('span');
  closeBtn.className = 'modal-close';
  closeBtn.textContent = 'x';
  closeBtn.onclick = () => modal.style.display = "none";

  const modalText = document.createElement('p');
  modalText.textContent = 'Some text in the Modal..';

  modalContent.appendChild(closeBtn);
  modalContent.appendChild(modalText);
  modal.appendChild(modalContent);

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = event => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };

  return modal;
}