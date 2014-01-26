var tools = window.tools = {};

tools.mouseIntersections = function(root, camera, vec2) {
  var vector = new THREE.Vector3( ( vec2.x / window.innerWidth ) * 2 - 1, - ( vec2.y / window.innerHeight ) * 2 + 1, .5 );
  projector.unprojectVector( vector, camera );

  var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  var intersects = raycaster.intersectObject(root, true);

  if (intersects.length) {
    for (var i=0; i<intersects.length; i++) {
      if (!intersects[i].object.userData.ignoreRaycasts) {
        return intersects[i];
      }
    }
  }
  return null;
};

tools.groupFacesByNormal = function(triangles) {
  var l = triangles.length, i, faces = {};

  for (i=0; i<l; i++) {
    var key = triangles[i].normal.toArray().join('-');

    if (!faces[key]) {
      faces[key] = [];
    }

    faces[key].push(i);
  }

  var ret = [];
  Object.keys(faces).forEach(function(key) {
    var array = faces[key];
    var inner = [];

    for (var i=0; i<array.length; i++) {
      inner.push(triangles[array[i]]);
    }

    ret.push(inner);
  });

  return ret;
};

tools.computeCoplanarFaces = function(mesh) {
  var faceGeometry = [];
  var geometry = mesh.geometry;
  geometry.mergeVertices();

  var groups = tools.groupFacesByNormal(geometry.faces);
  // TODO: make this work with more than 2 faces per group
  groups.forEach(function(group) {

    // filter shared verts
    var verts = [], seen = {};
    group.forEach(function(face) {
      !seen[face.a] && verts.push(geometry.vertices[face.a]);
      !seen[face.b] && verts.push(geometry.vertices[face.b]);
      !seen[face.c] && verts.push(geometry.vertices[face.c]);

      seen[face.a] = seen[face.b] = seen[face.c] = true;
    });

    var mat;
    if (verts.length > 3) {
      mat = new THREE.Matrix4(
        verts[0].x, verts[0].y, verts[0].z, 1,
        verts[1].x, verts[1].y, verts[1].z, 1,
        verts[2].x, verts[2].y, verts[2].z, 1,
        verts[3].x, verts[3].y, verts[3].z, 1
      );
    } else {
      mat = new THREE.Matrix4(
        verts[0].x, verts[0].y, verts[0].z, 1,
        verts[1].x, verts[1].y, verts[1].z, 1,
        verts[2].x, verts[2].y, verts[2].z, 1,
        verts[2].x, verts[2].y, verts[2].z, 1
      );
    }

    var det = mat.determinant()

    if (true || Math.abs(det) < 0.0001) {
      faceGeometry.push({
        faces : group,  // TODO: there may be faces that get pruned above.
        verts : verts
      });
    } else {
      console.log('not coplanar :(', verts.length, det)
    }
  });

  return faceGeometry;
};


tools.computeNgonHelpers = function(sourceMesh) {
  var faceGeometries = tools.computeCoplanarFaces(sourceMesh);
  faceGeometries.forEach(function(obj) {
    var geometry = new THREE.Geometry();
    obj.faces.forEach(function(face) {
      var clone = face.clone();

      clone.a = geometry.vertices.length;
      geometry.vertices.push(sourceMesh.geometry.vertices[face.a].clone());
      
      clone.b = geometry.vertices.length;
      geometry.vertices.push(sourceMesh.geometry.vertices[face.b].clone());

      clone.c = geometry.vertices.length;
      geometry.vertices.push(sourceMesh.geometry.vertices[face.c].clone());

      geometry.faces.push(clone);
    });

    var faces = obj.faces;
    var array = obj.verts;

    var mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xF0FF33,
        transparent: true,
        opacity: .4
      })
    );

    mesh.position.sub(THREE.GeometryUtils.center(mesh.geometry))

    mesh.doublesided = true;
    mesh.overdraw = true;
    mesh.targetObject = sourceMesh;

    mesh.userData.ignoreRaycasts = true;

    sourceMesh.add(mesh);
    mesh.visible = false;

    obj.faces.forEach(function(face) {
      face.ngonHelper = mesh;
    });
  });
};
