THREE.Shape.Utils.triangulateShape = function( pts, holes ) {

  // For use with Poly2Tri.js

  var allpts = pts.concat();
  var shape = [];
  for (var p in pts) {
    shape.push(new poly2tri.Point(pts[p].x, pts[p].y));
  }

  var swctx = new poly2tri.SweepContext(shape);

  for (var h in holes) {
    var aHole = holes[h];
    var newHole = []
    for (i in aHole) {
      newHole.push(new poly2tri.Point(aHole[i].x, aHole[i].y));
      allpts.push(aHole[i]);
    }
    swctx.AddHole(newHole);
  }

  var find;
  var findIndexForPt = function (pt) {
    find = new THREE.Vector2(pt.x, pt.y);
    var p;
    for (p=0, pl = allpts.length; p<pl; p++) {
      if (allpts[p].equals(find)) return p;
    }
    return -1;
  };

  // triangulate
  poly2tri.sweep.Triangulate(swctx);

  var triangles =  swctx.GetTriangles();
  var tr ;
  var facesPts = [];
  for (var t in triangles) {
    tr =  triangles[t];
    facesPts.push([
      findIndexForPt(tr.GetPoint(0)),
      findIndexForPt(tr.GetPoint(1)),
      findIndexForPt(tr.GetPoint(2))
    ]);
  }

  //  console.log(facesPts);
  //  console.log("triangles", triangles.length, triangles);

  // Returns array of faces with 3 element each
  return facesPts;
}