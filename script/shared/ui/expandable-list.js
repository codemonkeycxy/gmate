function newList(itemHTMLs) {
  const list = document.createElement('ul');

  itemHTMLs.forEach(htmlStr => {
    const item = htmlToElement(htmlStr);
    list.appendChild(item);
  });

  return list;
}

function newExpandableInputList(values = [], placeholder = '', minWidth = '100px', onChange) {
  const rowGenerator = (initVal, onRowValChange) => newTextInput(initVal, placeholder, minWidth, onRowValChange);

  return newExpandableList(values, rowGenerator, onChange);
}

// idea borrowed from: https://stackoverflow.com/questions/42476463/add-remove-input-box-using-javascript
function newExpandableList(values = [], rowGenerator, onChange) {
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
    onChange(results.filter(res => Boolean(res)));
  }

  function addRow(i) {
    const rowWrapper = document.createElement('div');
    listWrapper.insertBefore(rowWrapper, addBtn);

    const input = rowGenerator(
      results[i],
      val => {
        results[i] = val;
        onInputChange();
      }
    );
    rowWrapper.appendChild(input);
    renderRemoveBtn(i, rowWrapper);
  }

  function renderRemoveBtn(i, rowWrapper) {
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