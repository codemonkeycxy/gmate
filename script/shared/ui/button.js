/**
 * it's a shame that there's no good way to dynamically create elements from html file in chrome extension
 * (see a hacky way in here: https://stackoverflow.com/questions/19103183/how-to-insert-html-with-a-chrome-extension)
 *
 * the best way i can see now is to manually assembles the necessary component via code.
 * this function returns the following html
 * (html and styling reference: https://www.w3schools.com/howto/howto_css_modals.asp)

 <button class="buttonload">
     <span>text content</span><span class="fa fa-spinner fa-spin"></span>
 </button>

 */
function newButton(text) {
  injectCss("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css");
  const btn = document.createElement('button');
  btn.style.borderRadius = '3px';
  btn.style.fontFamily = "'Google Sans',Roboto,Arial,sans-serif";

  const btnText = document.createElement('span');
  btnText.textContent = text;
  btn.appendChild(btnText);

  const spinner = document.createElement('span');
  spinner.className = 'fa fa-spinner fa-spin';
  hide(spinner);
  btn.appendChild(spinner);

  // inject convenient helper functions
  btn.showSpinner = () => show(spinner);
  btn.hideSpinner = () => hide(spinner);

  return btn;
}