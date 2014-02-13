var rootModeManager = new ModeManager(true);
var userModeManager = new ModeManager(true);

[
  'mousedown', 'mousemove', 'mouseup',
  'contextmenu', 'mousewheel', ['DOMMouseScroll', 'mousewheel'],
  'keydown', 'keyup'
].forEach(function(name) {

  var target = name;
  if (Array.isArray(name)) {
    target = name[1];
    name = name[0];
  }

  document.addEventListener(name, rootModeManager.handle.bind(rootModeManager, target));

});

updateSteps.push(function() {

  var n = camera.position.clone().normalize().multiplyScalar(50);

  camera2.position.set( n.x, n.y, n.z );
  camera2.lookAt(scene2.position);
  renderer2.render(scene2, camera2)
});

var sceneRoot = new THREE.Object3D();
scene.add(sceneRoot);

rootModeManager.add('user', userModeManager);
rootModeManager.add('helper', new HelperMode(sceneRoot, camera), true);
rootModeManager.mode('user');

var controls = new THREE.OrbitControls(camera, document.body );
updateSteps.push(controls);

userModeManager.add('navigation', controls, true);

// 2D Drawing
var drawMode = new DrawMode(userModeManager, sceneRoot, sceneRoot, camera);
updateSteps.push(drawMode);

userModeManager.add('draw', drawMode);
userModeManager.add('drawplane', new DrawPlaneMode(userModeManager, sceneRoot, camera, projector));

// CSG
var cutMode = new CutMode(userModeManager);
updateSteps.push(cutMode);
userModeManager.add('cut', cutMode);

var extrudeMode = new ExtrudeMode(userModeManager);
updateSteps.push(extrudeMode);
userModeManager.add('extrude', extrudeMode);


userModeManager.mode('navigation');

updateSteps.push(rootModeManager);



var plane;

var baseMaterial = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  emissive: 0x020202,
  ambient: 0x111111,
  shading: THREE.SmoothShading,
  shinyness: 100
});

var cube = new THREE.Mesh( new THREE.CubeGeometry( 20, 20, 5 ), baseMaterial);

cube.position.y = 100;
sceneRoot.add( cube );

tools.computeNgonHelpers(cube);

var cube2 = new THREE.Mesh( new THREE.CubeGeometry( 100, 100, 5 ), baseMaterial);

cube2.position.x = 100;
sceneRoot.add( cube2 );

tools.computeNgonHelpers(cube2);

var selectedObject = null;

function selectObject(object) {
  if (selectedObject && selectedObject.material.emissive) {
    selectedObject.material.emissive.setHex(selectedObject.oldHex);
  }

  if (object) {
    selectedObject = object;
    if (selectedObject && selectedObject.material.emissive) {
      selectedObject.oldHex = selectedObject.material.emissive.getHex();
      selectedObject.material.emissive.setHex(selectedObject.oldHex+0x111111);
    }
  }
}


