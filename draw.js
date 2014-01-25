function DrawMode(scene, camera) {
  this.scene = scene;
  this.camera = camera;

  this.plane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshBasicMaterial({ color: 0x00ee00, transparent: true, opacity: .1 })
  );
  this.plane.quaternion = this.camera.quaternion.clone();
  //this.plane.overdraw = true;
  this.particles = new  THREE.Object3D();
}

DrawMode.prototype.activate = function(lastMode) {
  console.log('activated draw mode', lastMode)
  this.lastMode = lastMode;

  // TODO: add support for face selection
  //       otherwise it's probably better to snap to an axis plane
  this.plane.quaternion = this.camera.quaternion.clone();

  this.scene.add(this.particles);
  this.scene.add(this.plane);
  this.points = [];
  
};

DrawMode.prototype.deactivate = function() {
  console.log('deactivated draw mode')
  this.scene.remove(this.plane);
  this.scene.remove(this.particles);
};

DrawMode.prototype.keydown = function(event) {

  switch (event.keyCode) {
    case 27:
      if (this.points.length > 2) {            
        var extrusionSettings = {
          size: 30, height: 4, curveSegments: 3,
          bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
          material: 0, extrudeMaterial: 1
        };

        var amount = 10;
        
        var extrudePath = new THREE.Path();

        var shapeGeometry = new THREE.Geometry();
        shapeGeometry.vertices = this.points;

        // Collect the offset from the center of the scene
        // We'll use this when we re-position the extruded
        // geometry back into the proper location.
        var offset = THREE.GeometryUtils.center(shapeGeometry);
        
        // apply inverse transform so the shape will be 
        // properly oriented
        shapeGeometry.applyMatrix(new THREE.Matrix4().getInverse(this.plane.matrixWorld));


        // Extrude the geometry without bevel, by the specified amount
        var geometry = new THREE.ExtrudeGeometry(new THREE.Shape(shapeGeometry.vertices), {
          amount: amount,
          bevelEnabled: false,
        });

        geometry.computeCentroids();
        geometry.computeFaceNormals()

        var obj = new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({
            color: 0xcccccc
          })
        );

        // Move the geometry back to it's drawn location
        obj.position.set(-offset.x, -offset.y, -offset.z);

        // Apply rotation to match the draw plane
        obj.quaternion = this.plane.quaternion.clone();

        this.scene.add(obj);
        this.points = [];

      } else {
        event.modeManager.mode(this.lastMode);
        while (this.points.length) {
          this.particles.remove(this.points.pop().particle);
        }
      }
    break;
  }
}

DrawMode.prototype.mousedown = function(event) {

  // drop a point at unprojected x, y, z

  var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0 );
  projector.unprojectVector( vector, camera );

  var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  var intersects = raycaster.intersectObject(this.plane);

  if ( intersects.length > 0 ) {
    this.handledMouseDown = true;
    var particle = new THREE.Sprite();
    particle.position = intersects[0].point;

    var p = intersects[0].point.clone();
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