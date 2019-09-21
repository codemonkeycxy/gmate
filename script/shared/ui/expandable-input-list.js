// idea borrowed from: https://stackoverflow.com/questions/42476463/add-remove-input-box-using-javascript
function newExpandableInputList(values = [], placeholder = '', minWidth = '100px', onChange) {
  const listWrapper = document.createElement('div');
  // make a copy of the initial values
  const results = isEmpty(values) ? [''] : [...values];

  const addBtn = newButton('+');
  addBtn.addEventListener("click", () => {
    results.push('');
    onInputChange();
    addRow(results.length - 1);
  });
  listWrapper.appendChild(addBtn);

  function onInputChange() {
    onChange(results.filter(res => res));
  }

  function addRow(i) {
    const rowWrapper = document.createElement('div');
    listWrapper.insertBefore(rowWrapper, addBtn);

    appendInput(i, rowWrapper);
    appendRemoveBtn(i, rowWrapper);
  }

  function appendInput(i, rowWrapper) {
    const input = document.createElement("INPUT");
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = results[i] || '';
    input.style.minWidth = minWidth;
    input.addEventListener("input", e => {
      results[i] = e.target.value;
      onInputChange();
    });
    rowWrapper.appendChild(input);
  }

  function appendRemoveBtn(i, rowWrapper) {
    const removeBtn = newButton('-');
    removeBtn.addEventListener("click", () => {
      results[i] = '';
      onInputChange();
      rowWrapper.remove();
    });
    rowWrapper.appendChild(removeBtn);
  }

  for (let index = 0; index < results.length; index++) {
    addRow(index);
  }

  return listWrapper;
}