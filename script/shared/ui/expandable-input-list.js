// idea borrowed from: https://stackoverflow.com/questions/42476463/add-remove-input-box-using-javascript
function newExpandableInputList(values, onChange) {
  const listWrapper = document.createElement('div');
  // make a copy of the initial values
  const results = [...values];

  function formRowId(i) {
    return `expandable-input-list-item-${i}`;
  }

  function addRow(i, text) {
    const rowWrapper = document.createElement('div');
    rowWrapper.id = formRowId(i);
    listWrapper.appendChild(rowWrapper);

    const input = document.createElement("INPUT");
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", "Name");
    input.setAttribute("textContent", text);
    input.addEventListener("input", e => {
      results[i] = e.target.value;
      onChange(results.filter(res => res));
    });
    rowWrapper.appendChild(input);

    const addBtn = newButton('+');
    addBtn.addEventListener("click", () => {
      addRow(i + 1);
      results[i + 1] = '';
    });
    rowWrapper.appendChild(addBtn);

    const removeBtn = newButton('−');
    removeBtn.addEventListener("click", () => {
      removeRow(i);
      results[i] = '';
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
      addRow(index, results[index]);
    }
  }
  return listWrapper;
}