// ref: https://stackoverflow.com/questions/42476463/add-remove-input-box-using-javascript
function newExpandableInputList(values, onChange) {
  const listWrapper = document.createElement('div');

  function addRow(id) {
    const rowWrapper = document.createElement('div');
    rowWrapper.id = `expandable-input-list-item-${id}`;
    listWrapper.appendChild(rowWrapper);

    const input = document.createElement("INPUT");
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", "Name");
    rowWrapper.appendChild(input);

    const addBtn = newButton('+');
    addBtn.addEventListener("click", () => addRow(id + 1));
    rowWrapper.appendChild(addBtn);

    const removeBtn = newButton('-');
    removeBtn.addEventListener("click", () => removeRow(id));
    rowWrapper.appendChild(removeBtn);
  }

  function removeRow(id) {
    const toRemove = findChildById(listWrapper, `expandable-input-list-item-${id}`);
    toRemove.remove();
  }

  addRow(0);
  return listWrapper;
}