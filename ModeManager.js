function ModeManager() {
  this._modes = {};
}

ModeManager.prototype.mode = null;

ModeManager.prototype.add = function(name, fn) {
  this._modes[name] = fn;
}

ModeManager.prototype.handle = function(type, event) {
  this._modes[this.mode] && this._modes[this.mode](type, event);
}
