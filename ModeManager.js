// TODO:
// - setup a default mode 'navigation' in this case
// - unhandled events are forwarded into the default


function ModeManager() {
  this._modes = {};
  this._mode = null;
  this._defaultMode = null;
}

ModeManager.prototype.mode = function(mode) {
  if (mode) {
    if (this._mode && typeof this._modes[this._mode].deactivate === 'function') {
      this._modes[this._mode].deactivate(mode);
    }

    var old = this._mode;
    this._mode = mode;

    if (typeof this._modes[mode].activate === 'function') {
      this._modes[mode].activate(old);
    }
  }

  return this._mode;
};

ModeManager.prototype.add = function(name, fn) {
  this._modes[name] = fn;
}

ModeManager.prototype.handle = function(type, event) {
  event.modeManager = this;
  if (this._modes[this._mode].handle) {
    if (!this._modes[this._mode].handle(type, event)) {

      if (this._defaultMode && this._modes[this._defaultMode].handle) {
        console.log('default', type)
        this._modes[this._defaultMode].handle(type, event);
      }
    }
  }
}


ModeManager.prototype.update = function(delta) {
  if (typeof this._modes[this._mode].update === 'function') {
    this._modes[this._mode].update(delta);
  }

  if (typeof this._modes[this._defaultMode].update === 'function') {
    this._modes[this._defaultMode].update(delta);
  }
};