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
  var isect = tools.mouseIntersections(sceneRoot, this.camera, new THREE.Vector2(event.clientX, event.clientY));

  if (isect) {
    this.modeManager.mode('draw', {
      intersection : isect
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
