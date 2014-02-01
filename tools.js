var tools = window.tools = {};

var qel = function(selector) {
  return document.querySelector(selector);
};


tools.mouseIntersections = function(root, camera, vec2) {
  var vector = new THREE.Vector3( ( vec2.x / window.innerWidth ) * 2 - 1, - ( vec2.y / window.innerHeight ) * 2 + 1, .5 );
  projector.unprojectVector( vector, camera );

  var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  var intersects = raycaster.intersectObject(root, true);

  return intersects;
};

tools.mouseIntersection = function(root, camera, vec2) {
  var intersects = tools.mouseIntersections(root, camera, vec2);

  if (intersects.length) {
    for (var i=0; i<intersects.length; i++) {
      if (!intersects[i].object.userData.ignoreRaycasts) {
        return intersects[i];
      }
    }
  }
  return null;
};


tools.mouseNgonHelperIntersection = function(root, camera, vec2) {
  var isects = tools.mouseIntersections(root, camera, vec2);

  return isects.filter(function(isect) {
    return isect.face && isect.face.ngonHelper;
  }).shift();
};

var num = function(a) {
  return parseFloat(Number(a).toFixed(6));
};

THREE.Vector3.prototype.clean = function() {
  this.set(
    Vec2.clean(this.x),
    Vec2.clean(this.y),
    Vec2.clean(this.z)
  );
  return this;
}

THREE.Vector3.prototype.near = function(b, threshold) {

  threshold = threshold || .000000001;

  var x = Math.abs(Vec2.clean(this.x - b.x));
  var y = Math.abs(Vec2.clean(this.y - b.y));
  var z = Math.abs(Vec2.clean(this.z - b.z));

  return (x < threshold && y < threshold && z < threshold);
};

tools.pointsCoplanar = function(a, b, c, d) {
  var mat = new THREE.Matrix4(
    a.x, a.y, a.z, 1,
    b.x, b.y, b.z, 1,
    c.x, c.y, c.z, 1,
    d.x, d.y, d.z, 1
  );

  return Math.abs(mat.determinant()) < 0.1;
};

tools.facesAreCoplanar = function(a, b, c, a2, b2, c2) {
  if (tools.pointsCoplanar(a, b, c, a2) && tools.pointsCoplanar(a2, b2, c2, a)) {
    return true;
  }
};

tools.computeCoplanarFaces = function(mesh) {
  var geometry = mesh.geometry || mesh;
  var faces = geometry.faces;
  var verts = geometry.vertices;
  var i, j;

  // First, lets collect the normals.  We can assume that
  // if the face normals don't match, then they are not
  // going to be coplanar

  var coplanar = [];
  for (i=0; i<faces.length; i++) {

    var combined = false;
    for (j=0; j<coplanar.length; j++) {
      if (coplanar[j][0].normal.clean().equals(faces[i].normal.clean())) {

        // If the normals are matching then we have a candidate for
        // a coplanar match

        var res = tools.facesAreCoplanar(
          verts[faces[i].a].clean(),
          verts[faces[i].b].clean(),
          verts[faces[i].c].clean(),
          verts[coplanar[j][0].a].clean(),
          verts[coplanar[j][0].b].clean(),
          verts[coplanar[j][0].c].clean()
        );

        if (res) {
          coplanar[j].push(faces[i]);
          combined = true;
          break;
        }
      }
    }

    if (!combined) {
      coplanar.push([faces[i]]);
    }
  }

  return coplanar;
};


tools.shapesToGeometry = function(shapes, amount, material) {
  // Extrude the geometry without bevel, by the specified amount
  var geometry = new THREE.ExtrudeGeometry(shapes, {
    amount: amount,
    bevelEnabled: false
  });

  var obj = new THREE.Mesh(
    geometry,
    material || new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      shading: THREE.FlatShading,
      transparent: true,
      opacity: 1
    })
  );

  return obj;
}

tools.computeNgonHelpers = function(sourceMesh) {

  var faceGeometries = tools.computeCoplanarFaces(sourceMesh);

  faceGeometries.forEach(function(obj) {
    var geometry = new THREE.Geometry();

    var mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x0086FF,
        transparent: true,
        opacity: .7,
        shading: THREE.FlatShading
      })
    );

    var map = {};

    obj.forEach(function(face, idx) {
      var clone = face.clone();

      var zFighting = face.normal.clone().multiplyScalar(.01);

      clone.a = geometry.vertices.length;
      geometry.vertices.push(sourceMesh.geometry.vertices[face.a].clone().add(zFighting));

      clone.b = geometry.vertices.length;
      geometry.vertices.push(sourceMesh.geometry.vertices[face.b].clone().add(zFighting));

      clone.c = geometry.vertices.length;
      geometry.vertices.push(sourceMesh.geometry.vertices[face.c].clone().add(zFighting));

      geometry.faces.push(clone);

      face.ngonHelper = mesh;
    });

    geometry.mergeVertices();
    geometry.computeVertexNormals();
    geometry.computeFaceNormals();
    geometry.computeCentroids();

    mesh.position.sub(THREE.GeometryUtils.center(mesh.geometry))

    mesh.doublesided = true;
    mesh.overdraw = true;
    mesh.targetObject = sourceMesh;

    mesh.userData.ignoreRaycasts = true;

    sourceMesh.add(mesh);
    mesh.visible = false;
  });
};

tools.createShape = function(obj, hole) {
  var points = obj.computeGeometry([], hole).map(function(point) {
    return new THREE.Vector2(point.x, point.y);
  });

  return new THREE.Shape(points);
};

tools.generateShapes = function(array) {
  array = array.concat();

  array.sort(function(a, b) {
    return (Math.abs(a.area()) > Math.abs(b.area())) ? -1 : 1;
  });

  var raw = new Array();

  for (var i = 0; i<array.length; i++) {
    var inner = array[i];

    for (var j = 0; j<raw.length; j++) {
      var outer = raw[j];
      if (outer.contains(inner)) {

        if (!outer.isHole) {
          inner.isHole = true;
        }

        inner.shape = tools.createShape(array[i], inner.isHole);
        outer.shape.holes.push(inner.shape);
        raw.unshift(inner);
        break;
      }
    }

    if (!inner.shape) {
      inner.shape = tools.createShape(array[i], false);
    }

    raw.unshift(inner);
  }

  return raw.filter(function(a) {
            return !a.isHole;
          }).map(function(a) {
            return a.shape;
          });
};

tools.alignWithPlane = function(obj, plane) {
  var rot = new THREE.Matrix4().extractRotation(plane.matrixWorld)

  // This will move the object's position so that the edge of the
  // extruded mesh touches the drawing plane
  obj.position.applyMatrix4(plane.matrixWorld);

  // rotate the object housing the extruded mesh
  // to match the drawing plane's normal
  obj.geometry.applyMatrix(rot);

  obj.geometry.castShadow = true;
  obj.geometry.receiveShadow = true;
  obj.geometry.computeCentroids();
  obj.geometry.computeFaceNormals();
  obj.geometry.computeVertexNormals();
};


tools.cdata = function(fn) {
  return fn.toString().
      replace(/^[^\/]+\/\*!?/, '').
      replace(/\*\/[^\/]+$/, '');
};

