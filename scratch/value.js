// TODO: type filters and such.
function Value(value) {
  var listeners = this.listeners = [];

  var that = this;

  this.extractFormValueFromEvent = function (event) {
    that.val(event.target.value);
    event.stopPropagation();
  };

  this.val = function(val) {

    if (typeof val !== 'undefined') {
      var notify = value !== val;

      value = val;

      if (notify) {
        for (var i=0; i<listeners.length; i++) {
          listeners[i](this);
        }
      }
    }

    return value;
  };
}

Value.prototype.change = function(fn) {
  this.listeners.push(fn);
};
