function DrawMode(drawPlaneRoot, scene, camera) {
  this.drawPlaneRoot = drawPlaneRoot
  this.scene = scene;
  this.camera = camera;

  this.plane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ color: 0x00ee00, transparent: true, opacity: .1 })
  );
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

    if (typeof isect.faceIndex !== 'undefined') {
      var face = isect.object.geometry.faces[isect.faceIndex];
      coplanar = face.ngonHelper.position.clone().add(face.ngonHelper.parent.position);
      this.plane.position.copy(coplanar);
    } else {
      coplanar = isect.object.geometry.vertices[isect.face.a].clone().add(isect.object.position);
    }

    this.plane.lookAt(coplanar.add(isect.face.normal));
  } else {
    this.plane.quaternion = this.camera.quaternion.clone();
  }

  this.drawPlaneRoot.add(this.particles);
  this.drawPlaneRoot.add(this.plane);
  this.points = [];

};

DrawMode.prototype.deactivate = function() {
  this.drawPlaneRoot.remove(this.plane);
  this.drawPlaneRoot.remove(this.particles);
};

DrawMode.prototype.keydown = function(event) {

  if (this.draw.handle('keydown', event)) {
    return true;
  }

  switch (event.keyCode) {
    case 69:

      this.draw.modeManager.exit();

      // TODO: check for self-intersections

      // var seen = {};
      var drawings = this.draw.renderables.concat().sort(function(a, b) {
        return (Math.abs(a.area()) > Math.abs(b.area())) ? -1 : 1;
      });

      var createShape = function(obj, hole) {
        var points = obj.computeGeometry([]).map(function(point) {
          return new THREE.Vector2(point.x, point.y);
        });

        return new THREE.Shape(points);
      };

      var generateShapes = function(array) {
        var raw = new Array();

        for (var i = 0; i<array.length; i++) {
          var inner = array[i];
          inner.shape = createShape(array[i]);

          for (var j = 0; j<raw.length; j++) {
            var outer = raw[j];
            if (outer.contains(inner)) {

              if (!outer.isHole) {
                inner.isHole = true;
              }
              outer.shape.holes.push(inner.shape);
              break;
            }
          }

          raw.unshift(inner);
        }
        return raw;
      }

      var shapes = generateShapes(drawings).filter(function(a) {
        return !a.isHole;
      }).map(function(a) {
        return a.shape;
      });

      // TODO: collect this from a modal
      var amount = 100;

      // Extrude the geometry without bevel, by the specified amount
      var geometry = new THREE.ExtrudeGeometry(shapes, {
        amount: amount,
        bevelEnabled: false
      });

      var obj = new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
          color: 0xFFFFFF,
          shading: THREE.FlatShading
        })
      );

      var rot = new THREE.Matrix4().extractRotation(this.plane.matrixWorld)

      // This will move the object's position so that the edge of the
      // extruded mesh touches the drawing plane
      obj.position.applyMatrix4(this.plane.matrixWorld);

      // rotate the object housing the extruded mesh
      // to match the drawing plane's normal
      obj.geometry.applyMatrix(rot);

      obj.geometry.castShadow = true;
      obj.geometry.receiveShadow = true;
      obj.geometry.computeCentroids();
      obj.geometry.computeFaceNormals();
      obj.geometry.computeVertexNormals();

      tools.computeNgonHelpers(obj);

      sceneRoot.add(obj);
      this.points = [];
      return true;
    break;
  }
}

DrawMode.prototype.mousedown = function(event) {

  var isect = tools.mouseIntersections(this.plane, this.camera, new THREE.Vector2(event.clientX, event.clientY));

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
    var isect = tools.mouseIntersections(this.plane, this.camera, new THREE.Vector2(event.clientX, event.clientY));
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