
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



var test = new THREE.Object3D();
scene.add(test);

var lineMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff
});

document.addEventListener('mousemove', function(event) {

  var isect = tools.mouseIntersections(sceneRoot, camera, new THREE.Vector2(event.clientX, event.clientY));

  test.children.forEach(function(child) {
    test.remove(child);
  });

  if (isect && isect.face) {
    if (isect.face.ngonHelper) {
      test.add(isect.face.ngonHelper);
    } else {

      var lineGeometry = new THREE.Geometry();
      lineGeometry.vertices.push(new THREE.Vector3(0, 10, 0));
      lineGeometry.vertices.push(new THREE.Vector3(10, 0, 0));

      lineGeometry.vertices[0] = isect.object.geometry.vertices[isect.face.a].clone().add(isect.object.position);
      lineGeometry.vertices[1] = isect.object.geometry.vertices[isect.face.b].clone().add(isect.object.position);

      var line = new THREE.Line(lineGeometry, lineMaterial);
      test.add(line);
    }
  }
});


updateSteps.push(function() {
  
  var n = camera.position.clone().normalize().multiplyScalar(50);

  camera2.position.set( n.x, n.y, n.z );
  camera2.lookAt(scene2.position);
  renderer2.render(scene2, camera2)
});

var sceneRoot = new THREE.Object3D();
scene.add(sceneRoot);

var controls = new THREE.OrbitControls(camera, document.body );
modeManager._defaultMode = 'navigation';
modeManager.add('navigation', controls);
modeManager.add('draw', new DrawMode(scene, sceneRoot, camera));
modeManager.add('drawplane', new DrawPlaneMode(modeManager, sceneRoot, camera, projector));

modeManager.mode('navigation');

updateSteps.push(modeManager);



var plane;

var cube = new THREE.Mesh( new THREE.CubeGeometry( 20, 20, 5 ), new THREE.MeshLambertMaterial({
  color: 0xcccccc,
  shading: THREE.FlatShading
}));

tools.computeNgonHelpers(cube);

cube.geometry.castShadow = true;
cube.geometry.receiveShadow = true;
cube.position.y = 100;
sceneRoot.add( cube );

var cube2 = new THREE.Mesh( new THREE.CubeGeometry( 100, 100, 5 ), new THREE.MeshLambertMaterial({
  color: 0xcccccc,
  shading: THREE.FlatShading,
}));

tools.computeNgonHelpers(cube2);

cube2.geometry.castShadow = true;
cube2.geometry.receiveShadow = true;
cube2.position.x = 100;
sceneRoot.add( cube2 );

window.addEventListener('keydown', function(event) {
  console.log(event.keyCode);

  switch (event.keyCode) {
    case 27:
      selectObject(null);
    break;

    case 68: // d
      modeManager.mode('drawplane');
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
      selectedObject.material.emissive.setHex(selectedObject.oldHex+0x000500);
    }
  }
}

