function wrapUIComponents(components) {
  const wrapper = document.createElement('div');
  components.forEach(component => wrapper.appendChild(component));
  return wrapper
}

function wrapUIWithText(name, child, textOn = LEFT) {
  const title = document.createElement('span');

  if (textOn === RIGHT) {
    title.textContent = ` ${name}`;
    return wrapUIComponents([child, title]);
  } else {
    title.textContent = `${name}: `;
    return wrapUIComponents([title, child]);
  }
}

function renderDropDownSelect(name, options, initialVal, onSelect) {
  const selectList = document.createElement('select');
  // populate the option list
  options.forEach(option => {
    const optionUI = document.createElement('option');
    // todo: account for text:value case
    optionUI.text = option;
    optionUI.value = option;
    selectList.appendChild(optionUI);
  });

  // set up initial value and change listener
  selectList.value = initialVal;
  selectList.addEventListener('change', e => onSelect(e.target.value));

  return wrapUIWithText(name, selectList);
}

function renderStringNumberRange(name, initialVal, onChange) {
  const input = document.createElement('input');
  input.value = initialVal;
  input.placeholder = '1, 3, 5-12';
  // todo: add debounce https://davidwalsh.name/function-debounce
  // todo: add sane limit
  // todo: error on invalid input
  input.addEventListener('change', e => onChange(e.target.value));

  return wrapUIWithText(name, input);
}

function renderCheckbox(name, initialVal, onChange, textOn = LEFT) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = initialVal;
  checkbox.addEventListener('click', e => onChange(e.target.checked));

  return wrapUIWithText(name, checkbox, textOn);
}

function renderDivider() {
  return document.createElement('hr');
}