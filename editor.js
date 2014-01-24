
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


// renderer
var renderer2 = new THREE.CanvasRenderer();
renderer2.setSize( 100, 100 );
document.body.appendChild( renderer2.domElement );


renderer2.domElement.setAttribute('class', "axes");
// scene
scene2 = new THREE.Scene();


camera2 = new THREE.PerspectiveCamera( 50, 1, 1, 1000 );
camera2.up = camera.up; // important!


camera2.position.set( 50, 100 , 500 );

scene2.add( camera2 );

var axes = new THREE.AxisHelper(10);
var axes2 = new THREE.AxisHelper(10);
scene.add(axes)
scene2.add(axes2);

updateSteps.push(function() {
  
  var n = camera.position.clone().normalize().multiplyScalar(50);

  camera2.position.set( n.x, n.y, n.z );
  camera2.lookAt(scene2.position);
  renderer2.render(scene2, camera2)
});

var controls = new THREE.OrbitControls(camera, document.body );

modeManager.mode = 'navigation';
modeManager.add('navigation', function(type, event) {
  controls[type] && controls[type](event);
});


updateSteps.push(controls);

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
  }
});

var selectedObject = null;

function selectObject(object) {
  if (selectedObject) {
    selectedObject.material.emissive.setHex(selectedObject.oldHex);
  }

  if (object) {
    selectedObject = object;
    selectedObject.oldHex = selectedObject.material.emissive.getHex();
    selectedObject.material.emissive.setHex(selectedObject.oldHex+0x003300);
  }
}

window.addEventListener('mousedown', function(event) {
  event.preventDefault();


  var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
  projector.unprojectVector( vector, camera );

  var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  var intersects = raycaster.intersectObjects( objects );

  if ( intersects.length > 0 ) {
    event.stopImmediatePropagation();
    controls.center.copy(intersects[0].object.position);
    selectObject(intersects[0].object);
  }
});

