// idea borrowed from: https://stackoverflow.com/questions/42476463/add-remove-input-box-using-javascript
function newExpandableInputList(values, onChange) {
  const listWrapper = document.createElement('div');
  // make a copy of the initial values
  const results = [...values];

  function formRowId(i) {
    return `expandable-input-list-item-${i}`;
  }

  function onInputChange() {
    onChange(results.filter(res => res));
  }

  function addRow(i) {
    const rowWrapper = document.createElement('div');
    rowWrapper.id = formRowId(i);
    listWrapper.appendChild(rowWrapper);

    const input = document.createElement("INPUT");
    input.type = 'text';
    input.placeholder = 'full or partial room name';
    input.value = results[i] || '';
    input.style.minWidth = '275px';
    input.addEventListener("input", e => {
      results[i] = e.target.value;
      onInputChange();
    });
    rowWrapper.appendChild(input);

    const addBtn = newButton('+');
    addBtn.addEventListener("click", () => {
      results[i + 1] = '';
      onInputChange();
      addRow(i + 1);
    });
    rowWrapper.appendChild(addBtn);

    const removeBtn = newButton('−');
    removeBtn.addEventListener("click", () => {
      results[i] = '';
      onInputChange();
      removeRow(i);
    });
    rowWrapper.appendChild(removeBtn);
  }

  function removeRow(i) {
    findChildById(listWrapper, formRowId(i)).remove();
  }

  if (isEmpty(results)) {
    addRow(0);
  } else {
    for (let index = 0; index < results.length; index++) {
      addRow(index);
    }
  }
  return listWrapper;
}