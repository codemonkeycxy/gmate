// ref: https://stackoverflow.com/questions/42476463/add-remove-input-box-using-javascript
function newExpandableInputList(values, onChange) {
  const wrapper = document.createElement('div');
  const addBtn = newButton('+');
  const removeBtn = newButton('-');

  wrapper.appendChild(addBtn);
  wrapper.appendChild(removeBtn);

  addBtn.addEventListener("click", add);
  removeBtn.addEventListener("click", remove);

  function add() {
    const input = document.createElement("INPUT");
    input.setAttribute("type", "text");
    input.setAttribute("placeholder", "Name");
    input.setAttribute("class", "expandable-input-list-item");
    wrapper.appendChild(input);
  }

  function remove() {
    const children = wrapper.getElementsByClassName("expandable-input-list-item");
    if(children.length > 0) {
      wrapper.removeChild(children[children.length - 1]);
    }
  }

  return wrapper;
}