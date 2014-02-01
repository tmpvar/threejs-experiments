function CutMode(modeManager) {
  this.modeManager = modeManager;

  this.ui = new UI(tools.cdata(function() {/*!
    amount: <input type="text" name="amount" />
  */}), { amount : 100 });

  this.ui.bind('amount', this.createMesh.bind(this));

  this.material = new THREE.MeshLambertMaterial({
    color: 0xFF9D40,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: .5
  });
}

CutMode.prototype.activate = function(oldMode, options) {

  this.plane = options.plane;
  this.mesh = options.mesh;
  this.draw = options.draw;

  this.shapes = tools.generateShapes(this.draw.renderables);

  options.mesh.material.opacity = .5;

  this.createMesh()

  this.ui.render(qel('#parameters'));
  qel('#parameters').style.display = "block";
};

CutMode.prototype.deactivate = function() {
  this.plane = null;

  this.mesh.material.opacity = 1;
  this.mesh = null;


  qel('#parameters').style.display = "none";
};

CutMode.prototype.createMesh = function(amount) {
  var amount = parseFloat(this.ui.field('amount').val());

  if (this.cutMesh) {
    this.mesh.parent.remove(this.cutMesh);
  }

  //todo dispose
  this.cutMesh = tools.shapesToGeometry(this.shapes, Math.abs(amount), this.material);
  if (amount > 0) {
    this.cutMesh.position.z -= amount;
  }

  tools.alignWithPlane(this.cutMesh, this.plane);
  this.mesh.parent.add(this.cutMesh);
};

CutMode.prototype.subtractMesh = function(obj) {

  var remove = new ThreeBSP(obj);
  var target = new ThreeBSP(this.mesh);

  var bsp = target.subtract(remove);

  var mesh = bsp.toMesh(this.mesh.material);

  this.mesh.parent.add(mesh);
  this.mesh.parent.remove(this.cutMesh);
  this.mesh.parent.remove(this.mesh);
  this.mesh = mesh;

  return this.mesh;
}

CutMode.prototype.keydown = function(e) {

  switch (e.keyCode) {
    case 27: // escape
      this.cutMesh.parent.remove(this.cutMesh);
      this.modeManager.mode('draw');
      return true;
    break;

    case 13: // return
      var mesh = this.subtractMesh(this.cutMesh);

      this.plane.parent.remove(this.plane);
      tools.computeNgonHelpers(mesh);

      this.modeManager.exit();

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
