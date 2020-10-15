Module['MatrixFromArray'] = function(arr) {
  if (arr.length === 0) {
    return new Module.Matrix(0, 0);
  }

  let v2d = new Module.Vector2d();
  arr.forEach(a => {
    let v = new Module.Vector();
    a.forEach(val => v.push_back(val));
    v2d.push_back(v);
    v.delete();
  });
  const m = Module.Matrix.fromVector(v2d);
  v2d.delete();
  return m;
};

Module['MatrixToArray'] = function(m) {
  const res = [];
  for (let i = 0; i < m.rows(); i++) {
    res.push([]);
    for (let j = 0; j < m.cols(); j++) {
      res[i].push(m.get(i, j));
    }
  }
  return res;
};

Module['VectorToArray'] = function(v) {
  const res = [];
  for (let i = 0; i < v.size(); i++) {
    res.push(v.get(i));
  }
  return res;
};
