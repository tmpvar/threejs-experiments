function CutMode(modeManager) {
  this.modeManager = modeManager;
}

CutMode.prototype.activate = function(oldMode, options) {
  console.log('CUT MODE ACTIVATED');
  this.plane = options.plane;
  this.mesh = options.mesh;
  this.draw = options.draw;
};

CutMode.prototype.deactivate = function() {
  this.plane = null;
  this.mesh = null;
};

CutMode.prototype.subtractGeometry = function(shapes, amount) {

  var obj = tools.shapesToGeometry(shapes, amount);

  tools.alignWithPlane(obj, this.plane);

  var remove = new ThreeBSP(obj);
  var target = new ThreeBSP(this.mesh);

  var bsp = target.intersect(remove);

  var mesh = bsp.toMesh(this.mesh.material);

  this.mesh.parent.add(mesh);
  this.mesh.parent.remove(this.mesh);
  this.mesh = mesh;

  return this.mesh;
}

CutMode.prototype.keydown = function(e) {

  switch (e.keyCode) {
    case 27: // escape
      this.modeManager.exit();

      return true;
    break;

    case 13: // return

      // TODO: check for self-intersections

      var shapes = tools.generateShapes(this.draw.renderables);

      // TODO: collect these from a modal
      var amount = -100;
      var merge = true;

      var mesh = this.subtractGeometry(shapes, amount, merge);

      tools.computeNgonHelpers(mesh);

      return true;
    break;
  }
};

CutMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    if (!this[type](event) && this.draw) {
      return this.draw.handle(type, event);
    }
  }
};
