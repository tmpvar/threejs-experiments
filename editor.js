
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



var axes = new THREE.AxisHelper(5);
//axes.position = mesh.position;
scene.add(axes);

var controls = new THREE.OrbitControls(camera, document.body );

modeManager.mode = 'navigation';
modeManager.add('navigation', function(type, event) {
  controls[type] && controls[type](event);
});


updateSteps.push(controls);

var plane;

var cube = new THREE.Mesh( new THREE.CubeGeometry( 20, 20, 20 ), new THREE.MeshNormalMaterial() );
cube.position.y = 100;
scene.add( cube );

var cube2 = new THREE.Mesh( new THREE.CubeGeometry( 20, 20, 20 ), new THREE.MeshNormalMaterial() );
cube2.position.x = 100;
scene.add( cube2 );

var objects = [cube, cube2];


window.addEventListener('mousedown', function(event) {
  event.preventDefault();


  var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
  projector.unprojectVector( vector, camera );

  var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  var intersects = raycaster.intersectObjects( objects );

  if ( intersects.length > 0 ) {
    event.stopImmediatePropagation();
    controls.center.copy(intersects[0].object.position);
  }
});

