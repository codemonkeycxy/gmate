function renderDropDownSelect(name, options, initialVal, onSelect) {
  const selectWrapper = document.createElement('div');
  const selectTitle = document.createElement('div');
  selectTitle.textContent = name;

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
  selectList.addEventListener("change", e => onSelect(e));

  // put everything together
  selectWrapper.appendChild(selectTitle);
  selectWrapper.appendChild(selectList);
  return selectWrapper;
}