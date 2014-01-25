
var modeManager = new ModeManager();

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

  document.addEventListener(name, modeManager.handle.bind(modeManager, target));

});

updateSteps.push(function() {
  
  var n = camera.position.clone().normalize().multiplyScalar(50);

  camera2.position.set( n.x, n.y, n.z );
  camera2.lookAt(scene2.position);
  renderer2.render(scene2, camera2)
});

var controls = new THREE.OrbitControls(camera, document.body );

modeManager.add('navigation', controls);
modeManager.add('draw', new DrawMode(scene, camera));

modeManager.mode('navigation');

updateSteps.push(modeManager);

var plane;

var cube = new THREE.Mesh( new THREE.CubeGeometry( 20, 20, 20 ), new THREE.MeshLambertMaterial({
  color: 0xcccccc
}));
cube.position.y = 100;
scene.add( cube );

var cube2 = new THREE.Mesh( new THREE.CubeGeometry( 20, 20, 20 ), new THREE.MeshLambertMaterial({
  color: 0xcccccc
}));
cube2.position.x = 100;
scene.add( cube2 );

var objects = [cube, cube2];

window.addEventListener('keydown', function(event) {
  console.log(event.keyCode);

  switch (event.keyCode) {
    case 27:
      selectObject(null);
    break;

    case 68: // d
      modeManager.mode('draw');
    break;
  }
});

var selectedObject = null;

function selectObject(object) {
  if (selectedObject && selectedObject.material.emissive) {
    selectedObject.material.emissive.setHex(selectedObject.oldHex);
  }

  if (object) {
    selectedObject = object;
    if (selectedObject && selectedObject.material.emissive) {
      selectedObject.oldHex = selectedObject.material.emissive.getHex();
      selectedObject.material.emissive.setHex(selectedObject.oldHex+0x003300);
    }
  }
}

