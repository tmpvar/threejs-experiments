function DrawMode(scene, camera) {
  this.scene = scene;
  this.camera = camera;

  this.plane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ color: 0x00ee00, transparent: true, opacity: .1 })
  );
  this.plane.quaternion = this.camera.quaternion.clone();
  this.plane.overdraw = true;
  this.plane.material.side = THREE.DoubleSide
  this.particles = new  THREE.Object3D();
}

DrawMode.prototype.activate = function(lastMode, options) {
  this.lastMode = lastMode;

  // Keep the default mode from catching mouseup which causes
  // issues.
  this.handledMouseDown = true;

  if (options.intersection) {
    var isect = options.intersection;

    var coplanar;

    if (isect.faceIndex) {
      var face = isect.object.geometry.faces[isect.faceIndex];
      coplanar = face.ngonHelper.position.clone();
      coplanar.setZ(10);
    } else {
      coplanar = isect.object.geometry.vertices[isect.face.a].clone().add(isect.object.position);
    }
 
    // TODO: need a method that will more appropriately locate the plane
    //  an idea is:
    //  - find coplanar points with the a,b,c of the isect
    //  - compute center and place the plane there

    coplanar.applyQuaternion(isect.object.quaternion);
    this.plane.position.copy(coplanar);
    this.plane.lookAt(coplanar.clone().add(isect.face.normal));
  } else {
    this.plane.quaternion = this.camera.quaternion.clone();
  }

  this.scene.add(this.particles);
  this.scene.add(this.plane);
  this.points = [];
  
};

DrawMode.prototype.deactivate = function() {
  this.scene.remove(this.plane);
  this.scene.remove(this.particles);
};

DrawMode.prototype.keydown = function(event) {

  switch (event.keyCode) {
    case 27:
      if (this.points.length > 2) {            

        // TODO: collect this from a modal
        var amount = 100;
        
        var extrudePath = new THREE.Path();

        var shapeGeometry = new THREE.Geometry();
        shapeGeometry.vertices = this.points;

        var originalCenter = THREE.GeometryUtils.center(shapeGeometry.clone());

        // apply inverse transform so the shape will be 
        // properly oriented
        shapeGeometry.applyMatrix(new THREE.Matrix4().getInverse(this.plane.matrixWorld));

        // Extrude the geometry without bevel, by the specified amount
        var geometry = new THREE.ExtrudeGeometry(new THREE.Shape(shapeGeometry.vertices), {
          amount: amount,
          bevelEnabled: false
        });

        THREE.GeometryUtils.center(geometry);

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
        centering.applyMatrix4(rot);
        obj.position.add(centering);

        tools.computeNgonHelpers(obj);        
        
        // rotate the object housing the extruded mesh
        // to match the drawing plane's normal
        obj.geometry.applyMatrix(rot);
        
        // move the object back to where we drew it on the plane
        obj.position.sub(originalCenter);

        obj.geometry.computeCentroids();
        obj.geometry.computeFaceNormals();
        obj.geometry.computeVertexNormals();



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
    this.handledMouseDown = true;
    var particle = new THREE.Sprite();
    particle.position = isect.point;

    var p = isect.point.clone();
    p.particle = particle;
    this.points.push(p);

    particle.scale.x = particle.scale.y = 1;
    this.particles.add(particle);

    // Let the mode manager know that we handled the mousedown
    return true;
  }
};

DrawMode.prototype.mouseup = function(event) {
  if (this.handledMouseDown) {
    this.handledMouseDown = false;
    return true;
  }
}


DrawMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};

DrawMode.prototype.update = function(dt) {

};