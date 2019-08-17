function wrapUIComponents(components) {
  const wrapper = document.createElement('div');
  components.forEach(component => wrapper.appendChild(component));
  return wrapper
}

function wrapUIWithText(name, child, textOn = LEFT) {
  const title = document.createElement('span');
  const errorMsg = document.createElement('div');
  errorMsg.style.color = '#a94442';
  let result;

  if (textOn === RIGHT) {
    title.textContent = ` ${name}`;
    result = wrapUIComponents([child, title, errorMsg]);
  } else {
    title.textContent = `${name}: `;
    result = wrapUIComponents([title, child, errorMsg]);
  }

  result.setError = validation => {
    if (!validation.valid) {
      errorMsg.textContent = validation.errMsg;
    } else {
      errorMsg.textContent = null;
    }
  };

  return result;
}

function renderDropDownSelect(name, options, initialVal, onSelect, validateInput) {
  const selectList = document.createElement('select');
  // populate the option list
  options.forEach(option => {
    const optionUI = document.createElement('option');
    // todo: account for text:value case
    optionUI.text = option;
    optionUI.value = option;
    selectList.appendChild(optionUI);
  });

  const result = wrapUIWithText(name, selectList);
  result.setError(validateInput(initialVal));

  // set up initial value and change listener
  selectList.value = initialVal;
  selectList.addEventListener('change', e => {
    const input = e.target.value;
    onSelect(input);
    result.setError(validateInput(input));
  });

  return result;
}

function renderAutoComplete(name, options, initialVal, onSelect, validateInput) {
  const input = document.createElement('input');
  autocomplete(input, options);

  const wrapper = wrapUIComponents([input]);
  wrapper.className = 'autocomplete';
  const result = wrapUIWithText(name, wrapper);
  result.setError(validateInput(initialVal));

  // set up initial value and change listener
  input.value = initialVal;
  input.addEventListener('change', e => {
    const input = e.target.value;
    onSelect(input);
    result.setError(validateInput(input));
  });

  return result;
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