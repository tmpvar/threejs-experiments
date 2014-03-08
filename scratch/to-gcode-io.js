window.exportToGcodeIO = function(url, geometry) {
  geometry = geometry || window.sceneRoot.children[0].geometry;

  url = url || 'http://gcode.io';
  var w = window.open(url);

  var send = function(obj) {
    w.postMessage(JSON.stringify(obj), '*');
  };

  window.addEventListener('message', function(ev) {
    if (ev.data === 'ready') {

      // push the geometry through the pipe
      for (var i=0; i<geometry.faces.length; i++) {
        var face = geometry.faces[i];
        var a = geometry.vertices[face.a];
        var b = geometry.vertices[face.b];
        var c = geometry.vertices[face.c];
        send({
          name : 'face',
          data : {
            verts : [
              [a.x, a.y, a.z],
              [b.x, b.y, b.z],
              [c.x, c.y, c.z]
            ],
            normal: [face.normal.x, face.normal.y, face.normal.z]
          }
        });
      }

      send({ name: 'end'});
    }
  });



  return w;

};