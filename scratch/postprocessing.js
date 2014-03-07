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
