function DrawMode(drawPlaneRoot, scene, camera) {
  this.drawPlaneRoot = drawPlaneRoot
  this.scene = scene;
  this.camera = camera;

  this.plane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ color: 0x00ee00, transparent: true, opacity: .1 })
  );

  // One time setup to ensure the draw plane is above
  // the ngonHelper offset
  for (var i = 0; i<this.plane.geometry.vertices.length; i++) {
    this.plane.geometry.vertices[i].z = 0.011;
  }

  this.plane.quaternion = this.camera.quaternion.clone();
  this.plane.overdraw = true;
  this.plane.doublesided = true;
  this.plane.material.side = THREE.DoubleSide
  this.particles = new  THREE.Object3D();
}

DrawMode.prototype.activate = function(lastMode, options) {
  var draw = this.draw = new Draw();
  draw.canvasDimensions(1000, 1000);
  draw.scale = 10;
  var texture = this.texture = new THREE.Texture(draw.canvas);
  texture.needsUpdate = true;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipMapLinearFilter;

  var material = new THREE.MeshBasicMaterial({
    map : texture,
    transparent: true
  });

  this.plane.material = material;

  this.lastMode = lastMode;

  // Keep the default mode from catching mouseup which causes
  // issues.
  this.handledMouseDown = true;

  if (options.intersection) {
    var isect = options.intersection;

    var coplanar;

    this.targetMesh = null;
    if (typeof isect.faceIndex !== 'undefined') {
      var face = isect.object.geometry.faces[isect.faceIndex];
      this.targetMesh = isect.object;
      coplanar = face.ngonHelper.position.clone().add(face.ngonHelper.parent.position);
      this.plane.position.copy(coplanar);
    } else {
      coplanar = isect.object.geometry.vertices[isect.face.a].clone().add(isect.object.position);
    }

    this.plane.lookAt(coplanar.add(isect.face.normal));
  } else {
    this.plane.quaternion = this.camera.quaternion.clone();
  }

  this.drawPlaneRoot.add(this.plane);
};

DrawMode.prototype.deactivate = function() {
  this.drawPlaneRoot.remove(this.plane);
};

DrawMode.prototype.createShape = function(obj, hole) {
  var points = obj.computeGeometry([], hole).map(function(point) {
    return new THREE.Vector2(point.x, point.y);
  });

  return new THREE.Shape(points);
};

DrawMode.prototype.extrudeGeometry = function(shapes, amount, merge) {
  var obj = tools.shapesToGeometry(shapes, amount);

  tools.alignWithPlane(obj, this.plane);

  if (merge) {

    var extension = new ThreeBSP(obj);
    var target = new ThreeBSP(this.targetMesh);

    var union_bsp = target.union(extension);

    obj = union_bsp.toMesh(this.targetMesh.material);
    this.targetMesh.parent.add(obj);
    this.targetMesh.parent.remove(this.targetMesh);
  } else {
    this.scene.add(obj);
  }

  return obj;
}

DrawMode.prototype.subtractGeometry = function(shapes, amount) {

  var obj = tools.shapesToGeometry(shapes, amount);

  tools.alignWithPlane(obj, this.plane);

  var remove = new ThreeBSP(obj);
  var target = new ThreeBSP(this.targetMesh);

  var bsp = target.intersect(remove);

  var mesh = bsp.toMesh(this.targetMesh.material);

  this.targetMesh.parent.add(mesh);
  this.targetMesh.parent.remove(this.targetMesh);
  this.targetMesh = mesh;

  return this.targetMesh;
}

DrawMode.prototype.keydown = function(event) {

  if (this.draw.handle('keydown', event)) {
    return true;
  }

  switch (event.keyCode) {

    case 69: // [e]xtrude

      this.draw.modeManager.exit();

      // TODO: check for self-intersections

      var shapes = tools.generateShapes(this.draw.renderables);

      // TODO: collect these from a modal
      var amount = 100;
      var merge = true;

      var mesh = this.extrudeGeometry(shapes, amount, merge);

      tools.computeNgonHelpers(mesh);

      return true;
    break;

    case 83: // [s]ubtract

      this.draw.modeManager.exit();

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
}

DrawMode.prototype.mousedown = function(event) {

  var isect = tools.mouseIntersection(this.plane, this.camera, new THREE.Vector2(event.clientX, event.clientY));

  if (isect) {
    isect.point.applyMatrix4(new THREE.Matrix4().getInverse(this.plane.matrixWorld));

    this.plane.material.map.needsUpdate = true;
    event.position = Vec2(Math.round(isect.point.x), -Math.round(isect.point.y));

    // Forward the intersection off into 2d draw land
    return this.draw.handle('mousedown', event);
  }
};

DrawMode.prototype.mousemove = function(event) {
  if (this.draw) {
    this.handledMouseDown = true;
    var isect = tools.mouseIntersection(this.plane, this.camera, new THREE.Vector2(event.clientX, event.clientY));
    if (isect) {
      isect.point.applyMatrix4(new THREE.Matrix4().getInverse(this.plane.matrixWorld));

      event.position = Vec2(Math.round(isect.point.x), -Math.round(isect.point.y));
      return this.draw.handle('mousemove', event);
    }
  }
}

DrawMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    if (!this[type](event) && this.draw) {
      return this.draw.handle(type, event);
    }
  }
};

DrawMode.prototype.update = function(dt) {
  if (this.draw && this.draw._dirty) {
    this.draw.clearCanvas();
    this.draw.render();
    this.plane.material.map.needsUpdate = true;
  }
};