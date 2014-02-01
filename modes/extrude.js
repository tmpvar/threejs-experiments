function ExtrudeMode(modeManager) {
  this.modeManager = modeManager;

  this.ui = new UI(tools.cdata(function() {/*!
    amount: <input type="text" name="amount" />
  */}), { amount : '100' });

  this.ui.bind('amount', this.createMesh.bind(this));

  this.material = new THREE.MeshLambertMaterial({
    color: 0x0086FF,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: .5
  });
}

ExtrudeMode.prototype.activate = function(oldMode, options) {
  this.plane = options.plane;
  this.mesh = options.mesh;
  this.draw = options.draw;

  this.shapes = tools.generateShapes(this.draw.renderables);

  this.createMesh();

  this.ui.render(qel('#parameters'));
  qel('#parameters').style.display = "block";
};

ExtrudeMode.prototype.deactivate = function() {
  this.cutPlane = null;
  this.extrudeMesh = null;

  qel('#parameters').style.display = "none";
};

ExtrudeMode.prototype.createMesh = function(amount) {
  var amount = parseFloat(this.ui.field('amount').val());

  if (this.extrudeMesh) {
    this.mesh.parent.remove(this.extrudeMesh);
  }

  //todo dispose
  this.extrudeMesh = tools.shapesToGeometry(this.shapes, amount, this.material);

  tools.alignWithPlane(this.extrudeMesh, this.plane);
  this.mesh.parent.add(this.extrudeMesh);
};


ExtrudeMode.prototype.extrudeGeometry = function(merge) {
  if (merge) {

    var extension = new ThreeBSP(this.extrudeMesh);
    var target = new ThreeBSP(this.mesh);

    var union_bsp = target.union(extension);

    // todo: dispose

    var result = union_bsp.toMesh(this.mesh.material);
    this.mesh.parent.add(result);
    this.mesh.parent.remove(this.extrudeMesh);
    this.mesh.parent.remove(this.mesh);

    return result;
  } else {
    this.extrudedMesh.material = this.mesh.material;
    this.scene.add(this.extrudeMesh);
    return this.extrudeMesh;
  }
};

ExtrudeMode.prototype.keydown = function(e) {

  switch (e.keyCode) {
    case 27: // escape
      this.extrudeMesh.parent.remove(this.extrudeMesh);
      this.modeManager.mode('draw');
      return true;
    break;

    case 13: // return

      // TODO: collect these from a modal
      var merge = true;

      var mesh = this.extrudeGeometry(merge);

      tools.computeNgonHelpers(mesh);

      this.plane.parent.remove(this.plane);

      this.modeManager.exit();

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
