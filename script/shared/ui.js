function renderDropDownSelect(filterSetting) {
  const selectWrapper = document.createElement('div');
  const selectTitle = document.createElement('div');
  selectTitle.textContent = filterSetting.name;

  const selectList = document.createElement('select');
  // set up a default option to allow ANY
  const defaultOption = document.createElement('option');
  defaultOption.value = ANY;
  defaultOption.text = ANY;
  selectList.appendChild(defaultOption);

  // populate the option list
  filterSetting.options.forEach(option => {
    const optionUI = document.createElement('option');
    // todo: account for text:value case
    optionUI.text = option;
    optionUI.value = option;
    selectList.appendChild(optionUI);
  });

  selectWrapper.appendChild(selectTitle);
  selectWrapper.appendChild(selectList);
  return selectWrapper;
}