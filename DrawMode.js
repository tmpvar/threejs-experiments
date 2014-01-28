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
      // TODO: check for self-intersections
      var seen = {};
      var points = this.draw.computeGeometry();

      points = points.filter(function(a) {
        var key = a.toString();
        var ret = !seen[key];
        seen[key] = true;
        return ret;
      }).map(function(a) {
        var vec = a.clone();
        vec.y = -vec.y;
        return vec;
      })

      if (points.length > 2) {

        // TODO: collect this from a modal
        var amount = 100;
        

        var shape = new THREE.Shape();
        shape.fromPoints(points);

        var shapeGeometry = new THREE.ShapeGeometry(shape);

        // Rewind the polygon into something the extruder can use
        if (!THREE.Shape.Utils.isClockWise(points)) {
          points.reverse();
        }

        // Extrude the geometry without bevel, by the specified amount
        var geometry = new THREE.ExtrudeGeometry(new THREE.Shape(points), {
          amount: amount,
          bevelEnabled: false
        });

        geometry.computeCentroids();
        geometry.computeFaceNormals()
        geometry.computeVertexNormals()

        var obj = new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({
            color: 0xFFFFFF,
            shading: THREE.FlatShading
          })
        );

        obj.geometry.castShadow = true;
        obj.geometry.receiveShadow = true;

        var rot = new THREE.Matrix4().extractRotation(this.plane.matrixWorld)
        
        // This will move the object's position so that the edge of the
        // extruded mesh touches the drawing plane
        var centering = new THREE.Vector3(0, 0, amount/2);
        obj.position.applyMatrix4(this.plane.matrixWorld);

        // rotate the object housing the extruded mesh
        // to match the drawing plane's normal
        obj.geometry.applyMatrix(rot);

        obj.geometry.computeCentroids();
        obj.geometry.computeFaceNormals();
        obj.geometry.computeVertexNormals();

        tools.computeNgonHelpers(obj);

        sceneRoot.add(obj);
        this.points = [];
        return true;

      } else {
        event.modeManager.mode('navigation');
        while (this.points.length) {
          this.particles.remove(this.points.pop().particle);
        }
        return true;
      }
    break;
  }
}

DrawMode.prototype.mousedown = function(event) {

  // drop a point at unprojected x, y, z

  var isect = tools.mouseIntersections(this.plane, this.camera, new THREE.Vector2(event.clientX, event.clientY));

  if (isect) {
    // var particle = new THREE.Sprite();
    // particle.position = isect.point;

    // var p = isect.point.clone();
    // p.particle = particle;
    // this.points.push(p);

    // particle.scale.x = particle.scale.y = 1;
    // this.particles.add(particle);

    isect.point.applyMatrix4(new THREE.Matrix4().getInverse(this.plane.matrixWorld));

    this.plane.material.map.needsUpdate = true;
    event.position = Vec2(Math.round(isect.point.x), -Math.round(isect.point.y));
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