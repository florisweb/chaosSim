export function setTextToElement(element, text) {
  element.innerHTML = "";
  let a = document.createElement('a');
  a.text = text;
  element.append(a);
}

export function createElement(_tag, _class) {
  let el = document.createElement(_tag);
  if (_class) el.className = _class;
  return el;
}



export function wait(_ms) {
  return new Promise((resolve) => setTimeout(resolve, _ms));
}

