var container, stats;
var camera, scene, projector, renderer;
var particleMaterial;

var updateSteps = [];

container = document.createElement( 'div' );
document.body.appendChild( container );

scene = new THREE.Scene();

camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
camera.position.set( 0, 0, 100 );
scene.add(camera);

projector = new THREE.Projector();
renderer = new THREE.WebGLRenderer({
  antialias : true,
  stencil: false,
  preserveDrawingBuffer: true
});

var light = new THREE.HemisphereLight( 0xffffff, 0x222233, .6);
light.position=camera.position;
scene.add( light );


container.appendChild( renderer.domElement );
renderer.setSize( window.innerWidth, window.innerHeight );
window.addEventListener( 'resize', function() {
  renderer.setSize( window.innerWidth, window.innerHeight );
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}, false );


renderer.setClearColor(0x222225);

// renderer used for ui axis in the lower left corner
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


// depth

var depthShader = THREE.ShaderLib[ "depthRGBA" ];
var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
depthMaterial.blending = THREE.NoBlending;

// postprocessing

composer = new THREE.EffectComposer( renderer );
composer.addPass( new THREE.RenderPass( scene, camera ) );

depthTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

var effect = new THREE.ShaderPass( THREE.SSAOShader );
effect.uniforms[ 'tDepth' ].value = depthTarget;
effect.uniforms[ 'size' ].value.set( window.innerWidth, window.innerHeight );
effect.uniforms[ 'cameraNear' ].value = camera.near;
effect.uniforms[ 'cameraFar' ].value = camera.far;
effect.renderToScreen = true;
composer.addPass( effect );



var last = 0;
var tick = function(t) {
  var d = t-last;
  last = t;
  renderer.renderPluginsPre = [];
  renderer.renderPluginsPre = [];

  scene.overrideMaterial = depthMaterial;
  renderer.render( scene, camera, depthTarget );
  scene.overrideMaterial = null;
  
  composer.render();
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

