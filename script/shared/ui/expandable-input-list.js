// idea borrowed from: https://stackoverflow.com/questions/42476463/add-remove-input-box-using-javascript
function newExpandableInputList(values, placeholder = '', style = {minWidth: '100px'}, onChange) {
  const uniqueKey = getRandomInt(Number.MAX_SAFE_INTEGER);
  const listWrapper = document.createElement('div');
  // make a copy of the initial values
  const results = [...values];

  function formRowId(i) {
    return `${uniqueKey}-expandable-input-list-item-${i}`;
  }

  function onInputChange() {
    onChange(results.filter(res => res));
  }

  function addRow(i) {
    const rowWrapper = document.createElement('div');
    rowWrapper.id = formRowId(i);
    listWrapper.appendChild(rowWrapper);

    appendInput(i, rowWrapper);
    appendAddBtn(i, rowWrapper);
    appendRemoveBtn(i, rowWrapper);
  }

  function appendInput(i, rowWrapper) {
    const input = document.createElement("INPUT");
    input.type = 'text';
    input.placeholder = placeholder;
    input.value = results[i] || '';
    input.style.minWidth = style.minWidth;
    input.addEventListener("input", e => {
      results[i] = e.target.value;
      onInputChange();
    });
    rowWrapper.appendChild(input);
  }

  function appendAddBtn(i, rowWrapper) {
    const addBtn = newButton('+');
    addBtn.addEventListener("click", () => {
      results[i + 1] = '';
      onInputChange();
      addRow(i + 1);
    });
    rowWrapper.appendChild(addBtn);
  }

  function appendRemoveBtn(i, rowWrapper) {
    const removeBtn = newButton('−');
    removeBtn.addEventListener("click", () => {
      results[i] = '';
      onInputChange();
      rowWrapper.remove();
    });
    rowWrapper.appendChild(removeBtn);
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