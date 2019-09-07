// idea borrowed from: https://stackoverflow.com/questions/42476463/add-remove-input-box-using-javascript
function newExpandableInputList(values, onChange) {
  const listWrapper = document.createElement('div');

  function formRowId(id) {
    return `expandable-input-list-item-${id}`;
  }

  function addRow(id) {
    const rowWrapper = document.createElement('div');
    rowWrapper.id = formRowId(id);
    listWrapper.appendChild(rowWrapper);

    const input = document.createElement("INPUT");
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", "Name");
    rowWrapper.appendChild(input);

    const addBtn = newButton('+');
    addBtn.addEventListener("click", () => addRow(id + 1));
    rowWrapper.appendChild(addBtn);

    const removeBtn = newButton('−');
    removeBtn.addEventListener("click", () => removeRow(id));
    rowWrapper.appendChild(removeBtn);
  }

  function removeRow(id) {
    findChildById(listWrapper, formRowId(id)).remove();
  }

  addRow(0);
  return listWrapper;
}