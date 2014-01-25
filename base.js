var container, stats;
var camera, scene, projector, renderer;
var particleMaterial;

var updateSteps = [];

container = document.createElement( 'div' );
document.body.appendChild( container );

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.set( 0, 100, 100 );
scene.add(camera);

projector = new THREE.Projector();
renderer = new THREE.WebGLRenderer({
  antialias : true
});

var light = new THREE.HemisphereLight( 0xffffff, 0, .7);
// light.position.set( 1, 1, 100 ).normalize();
// light.lookAt(scene.position);
camera.add( light );

container.appendChild( renderer.domElement );

window.addEventListener( 'resize', function() {
  renderer.setSize( window.innerWidth, window.innerHeight );
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}, false );


renderer.setClearColor(0x222233);

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



var last = 0;
var tick = function(t) {
  var d = t-last;
  last = t;
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.render( scene, camera );

  for (var i = 0; i<updateSteps.length; i++) {
    if (typeof updateSteps[i].update === 'function') {
      updateSteps[i].update(d);
    } else if (typeof updateSteps[i] === 'function') {
      updateSteps[i](d);
    }
  }

  requestAnimationFrame(tick);
};

tick();

