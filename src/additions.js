
/**
 * Convert a 2D array to a Matrix object on the webasm shared buffer
 *
 * @param arr 2D JavaScript array containing numeric or NaN values
 *
 * @return Matrix object - caller frees via obj.delete()
 */
Module.MatrixFromArray = function(arr) {
  if (arr.length === 0) {
    return new Module.Matrix(0, 0);
  }

  let v2d = new Module.Vector2d();
  for (let i = 0; i < arr.length; i++) {
    let v = new Module.Vector();
    for (let j = 0; j < arr[i].length; j++) {
      v.push_back(arr[i][j]);
    }
    v2d.push_back(v);
    v.delete();
  }
  const m = Module.Matrix.fromVector(v2d);
  v2d.delete();
  return m;
};

/**
 * Convert a Matrix object to a 2D JavaScript array
 *
 * @param m Matrix object on the webasm shared buffer
 *
 * @return array
 */
Module.MatrixToArray = function(m) {
  const res = [];
  for (let i = 0; i < m.rows(); i++) {
    res.push([]);
    for (let j = 0; j < m.cols(); j++) {
      res[i].push(m.get(i, j));
    }
  }
  return res;
};

/**
 * Convert a Vector object to a JavaScript array
 *
 * @param v Vector object on the webasm shared buffer
 *
 * @return array
 */
Module.VectorToArray = function(v) {
  const res = [];
  for (let i = 0; i < v.size(); i++) {
    res.push(v.get(i));
  }
  return res;
};

/**
 * Compute an ability estimate using the binary response model
 *
 * @param resp   Array of N response values (1=correct, 0=incorrect)
 * @param params 2D array (Nx3) of item parameters
 * @param range  Array (2-tuple) range to limit computed theta within
 *
 * @return object with "theta", "info", and "sem" properties. Or a single "error" property
 */
Module.wleEst_brm_one = function(resp, params, range=[-4.5, 4.5]) {
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
  if (!(Array.isArray(params[0]) && params[0].length === 3)) {
    return {
      error: 'each params array must be of length 3'
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
  const est = Module.wasm_wleEst(mResp, mParams, mRange, Module.ModelType.BRM);

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

/**
 * Compute an ability estimate using a graded response model of M categories
 *
 * @param resp   Array of N response values ranging from (1 to M)
 * @param params 2D array (NxM) of item parameters
 * @param range  Array (2-tuple) range to limit computed theta within. [-4.5, 4.5] by default
 *
 * @return object with "theta", "info", and "sem" properties. Or a single "error" property
 */
Module.wleEst_grm_one = function(resp, params, range=[-4.5, 4.5]) {
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
  const est = Module.wasm_wleEst(mResp, mParams, mRange, Module.ModelType.GRM);

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

/**
 * Compute expected Fisher Information values for a set of items using the binary response model
 *
 * @param params 2D array (Nx3) of item parameters
 * @param theta  a single ability estimate
 *
 * @return object with "item", "test", and "sem" properties. Or a single "error" property
 */
Module.FI_brm_expected_one = function(params, theta) {
  if (!(Array.isArray(params) && params.length)) {
    return {
      error: 'params must be a non-empty array'
    };
  }
  if (!Number.isFinite(theta)) {
    return {
      error: 'theta must be a finite number'
    };
  }

  const result = {
    item: []
  };

  const mParams = Module.MatrixFromArray(params);
  const mTheta = Module.MatrixFromArray([[theta]]);
  const mResp = new Module.Matrix(0, 0);
  const res = Module.wasm_FI_brm(mParams, mTheta, Module.FIType.EXPECTED, mResp);

  for (let i = 0; i < res.item.cols(); i++) {
    result.item.push(res.item.get(0, i));
  }
  result.test = res.test.get(0);
  result.sem = res.sem.get(0);

  // wasm heap cleanup
  mParams.delete();
  mTheta.delete();
  mResp.delete();
  res.item.delete();
  res.test.delete();
  res.sem.delete();

  return result;
};

/**
 * Compute expected Fisher Information (modified unweighted) values for a set of items using the binary response model
 *
 * @param params2 2D array (Nx3) of phase2 item parameters
 * @param theta2  a single phase2 ability estimate
 * @param params1 2D array (Nx3) of phase1 item parameters
 * @param theta1  a single phase1 ability estimate
 *
 * @return object with "item", "test", and "sem" properties. Or a single "error" property
 */
Module.FI_brm_expected_one_modified = function(params2, theta2, params1, theta1) {
  if (!(Array.isArray(params2) && params2.length)) {
    return {
      error: 'params2 must be a non-empty array'
    };
  }
  if (!Number.isFinite(theta2)) {
    return {
      error: 'theta2 must be a finite number'
    };
  }
  if (!(Array.isArray(params1) && params1.length)) {
    return {
      error: 'params1 must be a non-empty array'
    };
  }
  if (!Number.isFinite(theta1)) {
    return {
      error: 'theta1 must be a finite number'
    };
  }

  const result = {
    item: []
  };

  const mParams2 = Module.MatrixFromArray(params2);
  const mTheta2 = Module.MatrixFromArray([[theta2]]);
  const mParams1 = Module.MatrixFromArray(params1);
  const mTheta1 = Module.MatrixFromArray([[theta1]]);
  const res = Module.wasm_FI_brm_modified_expected(mParams2, mTheta2, mParams1, mTheta1);

  for (let i = 0; i < res.item.cols(); i++) {
    result.item.push(res.item.get(0, i));
  }
  result.test = res.test.get(0);
  result.sem = res.sem.get(0);

  // wasm heap cleanup
  mParams2.delete();
  mTheta2.delete();
  mParams1.delete();
  mTheta1.delete();
  res.item.delete();
  res.test.delete();
  res.sem.delete();

  return result;
};

/**
 * Compute expected Fisher Information values for a set of items using a graded response model of M categories
 *
 * @param params 2D array (NxM) of item parameters
 * @param theta  a single ability estimate
 *
 * @return object with "item", "test", and "sem" properties. Or a single "error" property
 */
Module.FI_grm_expected_one = function(params, theta) {
  if (!(Array.isArray(params) && params.length)) {
    return {
      error: 'params must be a non-empty array'
    };
  }
  if (!Number.isFinite(theta)) {
    return {
      error: 'theta must be a finite number'
    };
  }

  const result = {
    item: []
  };

  const mParams = Module.MatrixFromArray(params);
  const mTheta = Module.MatrixFromArray([[theta]]);
  const mResp = new Module.Matrix(0, 0);
  const res = Module.wasm_FI_grm(mParams, mTheta, Module.FIType.EXPECTED, mResp);

  for (let i = 0; i < res.item.cols(); i++) {
    result.item.push(res.item.get(0, i));
  }
  result.test = res.test.get(0);
  result.sem = res.sem.get(0);

  // wasm heap cleanup
  mParams.delete();
  mTheta.delete();
  mResp.delete();
  res.item.delete();
  res.test.delete();
  res.sem.delete();

  return result;
};

/**
 * Attempt to classify respones to a GRM of N categories using the generalized likelihood ratio
 *
 * options defaults:
 *  {
 *      range:      [-4.5, 4.5], // range of theta values to analyze
 *      bounds:     [-1, 1],     // likelihood boundaries (size N-1)
 *      categories: [0, 1, 2],   // category labels that will be returned (size N)
 *      delta:      0.1,         // defines size of indifference region
 *      alpha:      0.05,        // controls upper and lower likelihood threshold
 *      beta:       0.05         // controls upper and lower likelihood threshold
 *  }
 *
 * @param params  2D array (NxM) of item parameters
 * @param resp    Array of N response values ranging from (1 to M)
 * @param options Options object (see description above)
 *
 * @return options.category value OR NULL if unable to classify
 */
Module.termGLR_one = function(params, resp, options={}) {
  const defaults = {
    range: [-4.5, 4.5],
    bounds: [-1, 1],
    categories: [0, 1, 2],
    delta: 0.1,
    alpha: 0.05,
    beta: 0.05
  };
  options = Object.assign({}, defaults, options);

  //
  // Argument checks
  //

  // validate params
  if (!(Array.isArray(params) && params.length && Array.isArray(params[0]) && params[0].length > 1)) {
    return {
      error: 'params must be a non-empty 2-D array'
    };
  }
  // validate resp
  if (!(Array.isArray(resp) && resp.length === params.length)) {
    return {
      error: 'length of resp must match length of params'
    };
  }
  for (let i = 0; i < resp.length; i++) {
    if (!((typeof resp[i] === 'number') && Number.isFinite(resp[i]))) {
      return {
        error: 'resp values must all be finite'
      };
    }
  }
  // validate options
  if (!(Array.isArray(options.range) && (options.range.length === 2) && (options.range[0] < options.range[1]))) {
    return {
      error: 'invalid range option'
    };
  }
  if (!(Array.isArray(options.bounds) && options.bounds.length === params[0].length - 1)) {
    return {
      error: 'invalid bounds option'
    };
  }
  if (!(Array.isArray(options.categories) && options.categories.length === params[0].length)) {
    return {
      error: 'invalid categories option'
    };
  }
  if (!(Number.isFinite(options.delta) && options.delta > 0)) {
    return {
      error: 'invalid delta option'
    };
  }
  if (!(Number.isFinite(options.alpha) && options.alpha > 0)) {
    return {
      error: 'invalid alpha option'
    };
  }
  if (!(Number.isFinite(options.beta) && options.beta > 0)) {
    return {
      error: 'invalid beta option'
    };
  }

  const c_lower = Math.log( options.beta / (1 - options.alpha) );
  const c_upper = Math.log( (1 - options.beta) / options.alpha );

  // get likVals for points surrounding the cutpoint
  const theta = [];
  for (let t = options.range[0]; t <= options.range[1]; t += 0.01) {
    theta.push(t);
  }

  const mResp = Module.MatrixFromArray([resp]);
  const mParams = Module.MatrixFromArray(params);
  const mTheta = Module.MatrixFromArray([theta]);
  const res = Module.wasm_logLik_grm(mResp, mTheta, mParams, Module.LogLikType.MLE);

  const likVals = Module.VectorToArray(res);

  mResp.delete();
  mParams.delete();
  mTheta.delete();
  res.delete();

  // find the highest point on the likelihood ratiofunction
  const likRat = [];
  for (let k = 0; k < options.bounds.length; k++) {
    // Find the likelihood based on the indifference region
    const u = Math.max(...likVals.filter((v, i) => (theta[i] > options.bounds[k] + options.delta)));
    const l = Math.max(...likVals.filter((v, i) => (theta[i] < options.bounds[k] - options.delta)));

    // standard likelihood ratio
    likRat[k] = u - l;
  }
  likRat.unshift(c_upper + 0.000001);
  likRat.push(c_lower - 0.000001);

  // test each category
  for (let k = 0; k < options.bounds.length + 1; k++) {
    if ((likRat[k] >= c_upper) && (likRat[k+1] <= c_lower)) {
      return options.categories[k];
    }
  }

  return null;
};

// add deep copy to objects and arrays
if (typeof Object.prototype.deepcopy === 'undefined') {
  Object.defineProperty(Object.prototype, 'deepcopy', {
    value: function() {
      function deepcopy(obj) {
        if (typeof obj !== 'object' || obj === null) {
          return obj;
        }
        const copy = Array.isArray(obj) ? [] : {};
        for (key in obj) {
          copy[key] = deepcopy(obj[key]);
        }
        return copy;
      }
      return deepcopy(this);
    }
  });
}

// add Fisher-Yates shuffle to arrays
if (typeof Array.prototype.shuffle === 'undefined') {
  Object.defineProperty(Array.prototype, 'shuffle', {
    value: function() {
      for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
      }
      return this;
    }
  });
}

/**
 * Choose optimal item(s) for test administration
 *
 * options defaults:
 *  {
 *      numb:     1,    // number of items to randomly select from top N
 *      n_select: 1,    // top N items to consider
 *      cat_theta: null // estimated ability of respondant
 *  }
 *
 * @param from_items Array of item objects to choose from (with id and params properties)
 * @param model      'brm' or 'grm'
 * @param select     Item information function type. Currently only 'UW-FI' is supported
 * @param at         Item selection parameter. Currently only 'theta' is supported.
 *
 * @return Object with 'items' array or 'error' string
 */
Module.itChoose = function(from_items, model, select, at, options={}) {
  const defaults = {
    numb: 1,
    n_select: 1,
    cat_par: null,
    cat_resp: null,
    cat_theta: null,
    range: null,
    it_range: null,
    delta: null,
    bounds: null,
    phase1_est_theta: null,
    phase1_params: null,
    ddist: null,
    quad: null
  };
  options = Object.assign({}, defaults, options);

  //
  // Argument checks
  //

  // validate model
  if (!(model === 'brm' || model === 'grm')) {
    return {
      error: `Invalid or unsupported "model" provided: "${model}"`
    };
  }

  // validate from_items
  if (!(Array.isArray(from_items) && from_items.length > 0)) {
    return {
      error: `"from_items" must be a non-empty array`
    };
  }
  if (!(typeof from_items[0] === 'object' && Array.isArray(from_items[0].params))) {
    return {
      error: `"from_items" entries must be objects with params array`
    };
  }
  if ((model === 'brm') && !(from_items[0].params.length === 3)) {
    return {
      error: `"from_items" params must have length 3 for brm model`
    };
  }
  if ((model === 'grm') && !(from_items[0].params.length > 1)) {
    return {
      error: `"from_items" params must have length greater than 1 for grm model`
    };
  }

  // validate select
  if (!(select === 'UW-FI' || select === 'UW-FI-Modified')) {
    return {
      error: `Invalid or unsupported "select" provided: "${select}"`
    };
  }
  if ((select === 'UW-FI-Modified') && (model !== 'brm')) {
    return {
      error: `UW-FI-Modified is only supported with the brm model`
    };
  }

  // validate at
  if (!(at === 'theta')) {
    return {
      error: `Invalid or unsupported "at" provided: "${at}"`
    };
  }

  // validate options
  if (!(Number.isFinite(options.numb) && options.numb > 0 && Math.floor(options.numb) === options.numb)) {
    return {
      error: `"numb" must be be an integer greater than 0`
    };
  }
  if (!(Number.isFinite(options.n_select) && options.n_select > 0 && Math.floor(options.n_select) === options.n_select)) {
    return {
      error: `"n_select" must be be an integer greater than 0`
    };
  }
  if (!(options.cat_par === null)) {
    return {
      error: `non-null "cat_par" not used`
    };
  }
  if (!(options.cat_resp === null)) {
    return {
      error: `non-null "cat_resp" not used`
    };
  }
  if (!(options.cat_theta === null || Number.isFinite(options.cat_theta))) {
    return {
      error: `"cat_theta" must be finite or null`
    };
  }
  if (!(options.range === null)) {
    return {
      error: `"range" not used`
    };
  }
  if (!(options.it_range === null)) {
    return {
      error: `"it_range" not supported`
    };
  }
  if (!(options.delta === null)) {
    return {
      error: `non-null "delta" not used`
    };
  }
  if (!(options.bounds === null)) {
    return {
      error: `non-null "bounds" not used`
    };
  }
  if (!(options.phase1_est_theta === null || Number.isFinite(options.phase1_est_theta))) {
    return {
      error: `"phase1_est_theta" must be finite or null`
    };
  }
  if (!(options.phase1_params === null || (Array.isArray(options.phase1_params) && options.phase1_params.length === from_items.length))) {
    return {
      error: `"phase1_params" must be null or array of length matching "from_items"`
    };
  }
  if (select === 'UW-FI-Modified' && (options.phase1_est_theta === null || options.phase1_params === null)) {
    return {
      error: `"phase1_est_theta" and "phase1_params" required for "${select}" select mode`
    };
  }
  if (!(options.ddist === null)) {
    return {
      error: `non-null "ddist" not used`
    };
  }
  if (!(options.quad === null)) {
    return {
      error: `non-null "quad" not used`
    };
  }

  //
  // Calculate item info
  //

  const theta = (options.cat_theta || 0);
  let item_info = [];

  if (select === 'UW-FI') {
    if (model === 'brm') {
      item_info = Module.FI_brm_expected_one(from_items.map(item => item.params), theta)['item'];
    }
    else {
      item_info = Module.FI_grm_expected_one(from_items.map(item => item.params), theta)['item'];
    }
  }
  else if (select === 'UW-FI-Modified' && model === 'brm') {
    item_info = Module.FI_brm_expected_one_modified(from_items.map(item => item.params), theta, options.phase1_params, options.phase1_est_theta)['item'];
  }

  // create sortable info array that tracks from_items index
  const info_sort = [];
  for (let i = 0; i < item_info.length; i++) {
    info_sort.push({info: item_info[i], index: i});
  }


  //
  // Sort and choose items
  //

  // sort and select random sample from top N items
  info_sort.sort((a, b) => b.info - a.info);
  const top_items = info_sort.slice(0, options.n_select).map(o => {
    return {
      id: from_items[o.index].id,
      params: from_items[o.index].params,
      info: o.info
    };
  });
  const selected_items = top_items.shuffle().slice(0, options.numb);

  return {
    items: selected_items,
  }
};

/**
 * Extract answers (i.e. finite values) from an array of responses
 *
 * @param resp Array NaN, Infinity, or numeric response values
 *
 * @return array Array of just the finite response values
 */
Module.getAnswers = function(resp) {
  if (!Array.isArray(resp)) {
    return [];
  }
  return resp.filter(r => Number.isFinite(r));
}

/**
 * Filter array of items for those that have been answered
 *
 * @param items Array of N items
 * @param resp Array of N response values
 *
 * @return array Array of items which have been answered (a finite response value is present)
 */
Module.getAnsweredItems = function(items, resp) {
  if (!Array.isArray(resp) || !Array.isArray(items) || items.length !== resp.length) {
    return [];
  }
  return items.filter((val, i) => Number.isFinite(resp[i]));
}

/**
 * Filter array of items for those that have not been answered
 *
 * @param items Array of N items
 * @param resp Array of N response values
 *
 * @return array Array of items which have not been answered (no finite response value present)
 */
Module.getUnansweredItems = function(items, resp) {
  if (!Array.isArray(resp) || !Array.isArray(items) || items.length !== resp.length) {
    return [];
  }
  return items.filter((val, i) => !Number.isFinite(resp[i]));
}
