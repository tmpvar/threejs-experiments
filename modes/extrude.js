function ExtrudeMode(modeManager) {
  this.modeManager = modeManager;
}

ExtrudeMode.prototype.activate = function(oldMode, options) {
  console.log('EXTRUDE MODE ACTIVATED');
  this.plane = options.plane;
  this.mesh = options.mesh;
  this.draw = options.draw;
};

ExtrudeMode.prototype.deactivate = function() {
  this.cutPlane = null;
  this.cutMesh = null;
};

ExtrudeMode.prototype.extrudeGeometry = function(shapes, amount, merge) {
  var obj = tools.shapesToGeometry(shapes, amount);

  tools.alignWithPlane(obj, this.plane);

  if (merge) {

    var extension = new ThreeBSP(obj);
    var target = new ThreeBSP(this.mesh);

    var union_bsp = target.union(extension);

    obj = union_bsp.toMesh(this.mesh.material);
    this.mesh.parent.add(obj);
    this.mesh.parent.remove(this.mesh);
  } else {
    this.scene.add(obj);
  }

  return obj;
};

ExtrudeMode.prototype.keydown = function(e) {

  switch (e.keyCode) {
    case 27: // escape
      this.modeManager.exit();

      return true;
    break;

    case 13: // return

      var shapes = tools.generateShapes(this.draw.renderables);

      // TODO: collect these from a modal
      var amount = 100;
      var merge = true;

      var mesh = this.extrudeGeometry(shapes, amount, merge);

      tools.computeNgonHelpers(mesh);

      return true;
    break;
  }
};

ExtrudeMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    if (!this[type](event) && this.draw) {
      return this.draw.handle(type, event);
    }
  }
};
