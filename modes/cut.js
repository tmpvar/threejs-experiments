function CutMode() {


}

CutMode.prototype.activate = function() {

};

CutMode.prototype.deactivate = function() {

};

CutMode.prototype.keydown = function(e) {

  switch (e.keyCode) {
    case 27: // escape



      return true;
    break;

    case 13: // return



      return true;
    break;
  }
};
