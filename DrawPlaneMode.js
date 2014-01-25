function DrawPlaneMode(modeManager, scene, camera, projector) {
  this.modeManager = modeManager;
  this.scene = scene;
  this.camera = camera;
  this.projector = projector;

}

DrawPlaneMode.prototype.activate = function() {
  // TODO: draw helpers for X/Y/Z planes
};

DrawPlaneMode.prototype.deactivate = function() {
  // TODO: remove helpers from scene
};

DrawPlaneMode.prototype.mousedown = function(event) {
  var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0 );
  projector.unprojectVector(vector, this.camera);

  var raycaster = new THREE.Raycaster(
    this.camera.position,
    vector.sub(this.camera.position).normalize()
  );

  var intersects = raycaster.intersectObjects(this.scene.children, true);


  if ( intersects.length > 0 ) {
    console.log(intersects[0].face);
    
    this.modeManager.mode('draw', {
      intersection : intersects[0]
    });

    this.handledMousedown = true
    return true;
  }
};

DrawPlaneMode.prototype.mouseup = function() {
  if (this.handledMousedown) {
    this.handledMousedown = false;
    return true;
  }
};

DrawPlaneMode.prototype.handle = function(type, event) {
  if (typeof this[type] === 'function') {
    return this[type](event);
  }
};
