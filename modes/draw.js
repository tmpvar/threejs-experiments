function DrawMode(modeManager, drawPlaneRoot, scene, camera) {
  this.drawPlaneRoot = drawPlaneRoot
  this.scene = scene;
  this.camera = camera;
  this.modeManager = modeManager;

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
  if (options) {
    var draw = this.draw = new Draw();
    draw.modeManager.debug = true;

    draw.canvasDimensions(512, 512);
    draw.scale = 5.12;
    var texture = this.texture = new THREE.Texture(draw.canvas);
    texture.needsUpdate = true;
    texture.anisotropy = renderer.getMaxAnisotropy();
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.blending = THREE.NoBlending;

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
  }
};

DrawMode.prototype.deactivate = function() {

};

DrawMode.prototype.createShape = function(obj, hole) {
  var points = obj.computeGeometry([], hole).map(function(point) {
    return new THREE.Vector2(point.x, point.y);
  });

  return new THREE.Shape(points);
};

DrawMode.prototype.keydown = function(event) {

  if (this.draw.handle('keydown', event)) {
    console.log('draw handled', event.keyCode);
    return true;
  }

  switch (event.keyCode) {

    case 27: // escape
      this.modeManager.exit();
      this.drawPlaneRoot.remove(this.plane);
      return true;
    break

    case 69: // [e]xtrude

      // TODO: check for self-intersections
      this.draw.modeManager.exit();

      this.modeManager.mode('extrude', {
        plane: this.plane,
        mesh: this.targetMesh,
        draw: this.draw
      });

      return true;
    break;

    case 83: // [s]ubtract
      this.draw.modeManager.exit();

      this.modeManager.mode('cut', {
        plane: this.plane,
        mesh: this.targetMesh,
        draw: this.draw
      });

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