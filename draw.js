function DrawMode(scene, camera) {
  this.scene = scene;
  this.camera = camera;

  this.plane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshNormalMaterial());
  this.plane.quaternion = this.camera.quaternion.clone();
  this.plane.overdraw = true;
  this.particles = new  THREE.Object3D();
}

DrawMode.prototype.activate = function(lastMode) {
  console.log('activated draw mode', lastMode)
  this.lastMode = lastMode;

  this.scene.add(this.particles);
  this.scene.add(this.plane);
  this.points = [];
  
};

DrawMode.prototype.deactivate = function() {
  console.log('deactivated draw mode')
  this.scene.remove(this.plane);
  //this.scene.remove(this.particles);
};

DrawMode.prototype.keydown = function(event) {

  switch (event.keyCode) {
    case 27:
      if (this.points.length > 0) {            
        var extrusionSettings = {
          size: 30, height: 4, curveSegments: 3,
          bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
          material: 0, extrudeMaterial: 1
        };

        var amount = 10;
        
        var geometry = new THREE.ExtrudeGeometry(new THREE.Shape(this.points), {
            amount: amount,
            bevelEnabled: false
          }
        );

        THREE.GeometryUtils.center(geometry);

        var obj = new THREE.Mesh(
          geometry,
          new THREE.MeshLambertMaterial({
            color: 0xcccccc
          })
        );

        obj.quaternion = this.plane.quaternion.clone();
        obj.position = this.plane.position.clone().normalize().multiplyScalar(amount);

        this.scene.add(obj);
        this.points = [];

      } else {
        event.modeManager.mode(this.lastMode);
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

    var particle = new THREE.Sprite();
    particle.position = intersects[ 0 ].point;

    var p = intersects[ 0 ].point.clone();

    this.points.push(
      new THREE.Vector2(p.x, p.y)
    );
    particle.scale.x = particle.scale.y = 1;
    this.particles.add( particle );
  }
}


DrawMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    this[type](event);
  }
};

DrawMode.prototype.update = function(dt) {

};