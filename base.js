var container, stats;
var camera, scene, projector, renderer;
var particleMaterial;

var updateSteps = [];

container = document.createElement( 'div' );
document.body.appendChild( container );

camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.set( 0, 100, 100 );

scene = new THREE.Scene();
projector = new THREE.Projector();
renderer = new THREE.WebGLRenderer({
  antialias : true
});

container.appendChild( renderer.domElement );

window.addEventListener( 'resize', function() {
  renderer.setSize( window.innerWidth, window.innerHeight );
}, false );


renderer.setClearColor(0x222233);

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
