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

Module['wleEst_brm_one'] = function(resp, params, range=[-4.5, 4.5]) {
  if (!(Array.isArray(resp) && resp.length)) {
    return {
      error: 'response must be a non-empty array'
    };
  }
  if (!(Array.isArray(params) && params.length)) {
    return {
      error: 'params must be a non-empty array'
    };
  }
  if (!(resp.length === params.length)) {
    return {
      error: 'length of response must match length of params'
    };
  }
  for (let i = 0; i < resp.length; i++) {
    if (!((typeof resp[i] === 'number') && Number.isFinite(resp[i]))) {
      return {
        error: 'response has non-numeric or non-finite elements'
      };
    }
  }

  const result = {};
  const mResp = Module.MatrixFromArray([resp]);
  const mParams = Module.MatrixFromArray(params);
  const mRange = Module.MatrixFromArray([range]);
  const est = Module.wleEst(mResp, mParams, mRange, Module.ModelType.BRM);

  result.theta = est.theta.get(0);
  result.info = est.info.get(0);
  result.sem = est.sem.get(0);

  // cleanup wasm heap
  mResp.delete();
  mParams.delete();
  mRange.delete();
  est.theta.delete();
  est.info.delete();
  est.sem.delete();

  return result;
};
