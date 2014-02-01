function UI(html, fields) {

  // do an initial weld to the frag and databind
  // TODO: 2 way databinding
  this.frag = document.createElement('div')
  this.frag.innerHTML = html;


  this._fields = {};

  if (fields) {
    weld(this.frag, fields, {
      map : this.createBinding.bind(this)
    });
  }
}


UI.prototype.bind = function(name, fn) {
  if (this._fields[name]) {
    this._fields[name].change(fn);
  }
};

UI.prototype.field = function(name) {
  return this._fields[name] || null;
}

UI.prototype.handleSelect = function(ev) {
  console.log('select', ev);
  if (ev.select) {
    console.log('selecting?')
    ev.select();
  } else if (ev.target && ev.target.select) {
    ev.target.select();
  }
};

UI.prototype.createBinding = function(parent, current, name, value) {

  var events = [];

  switch (current.tagName.toLowerCase()) {
    case 'input':
      Array.prototype.push.apply(events, ['mousedown', 'keyup']);
    break;
  }

  this._fields[name] = new Value(value);

  for (var i=0; i<events.length; i++) {
    console.log('binding', events[i])
    current.addEventListener(
      events[i],
      this._fields[name].extractFormValueFromEvent
    );
  }

  current.addEventListener('focus', this.handleSelect);

};

UI.prototype.render = function(target) {
  target.innerHTML = '';
  target.appendChild(this.frag);

  var el = target.querySelector('input');
  if (el) {
    el.focus();
    this.handleSelect(el);
  }

};
