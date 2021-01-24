'use strict';
const catirt_load = require('../dist/catirt');
const mathjs = require('mathjs');
const assert = require('assert').strict;
let catirtlib = {};

// helper function for converting values to a fixed precision string for simple comparison
function format(a, precision=6) {
  return mathjs.format(a, {precision});
}

describe('catIrt JS additions', function () {
  // setup data
  const range = [-4.5, 4.5];
  const theta = [-1.3, 1.3];
  const uresp = [
      [1, 1, 1, 0, 0],
      [0, 0, 1, 0, 1]
  ];
  const uresp_grm = [
      [1, 2, 1, 3, 1],
      [2, 1, 3, 3, 2]
  ];
  const items = [
    {id: 'item1', params: [1.55,-1.88,0.12]},
    {id: 'item2', params: [3.02,-0.38,0.12]},
    {id: 'item3', params: [1.9,-0.1,0.12]},
    {id: 'item4', params: [2.06,0.41,0.12]},
    {id: 'item5', params: [1.48,0.72,0.12]}
  ];
  const itemparams = items.map(item => item.params);

  // load wasm (asynchronous)
  before('loading catirtlib wasm module', function(done) {
    catirt_load().then(function(Module) {
      catirtlib = Module;
      done();
    });
  });

  // define test suite
  describe('wleEst_brm_one:', function () {
    it('wleEst_brm_one(uresp[0], params, range)', function () {
      const expected = {
        theta: 0.02317778,
        info: 3.341271,
        sem: 0.5543441
      };
      const res = catirtlib.wleEst_brm_one(uresp[0], itemparams, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('wleEst_brm_one: true theta:-3, 10 responses', function () {
      const expected = {
        theta: -0.7657313,
        info: 10.82811,
        sem: 0.3046733
      };
      const resp = [0, 1, 1, 0, 1, 1, 0, 1, 0, 0];
      const params = [
        [3.18342,-0.2713,0.24],
        [2.93165,-0.649,0.24],
        [2.85039,-0.5207,0.24],
        [2.76896,-0.5084,0.24],
        [2.78698,-0.798,0.24],
        [2.72595,-0.7866,0.24],
        [2.77967,-0.4423,0.24],
        [2.66407,-0.7434,0.24],
        [2.67223,-0.6145,0.24],
        [2.65013,-0.7712,0.24]
      ];
      const res = catirtlib.wleEst_brm_one(resp, params, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('wleEst_brm_one: non-finite responses filtered', function () {
      const expected = {
        theta: -0.7657313,
        info: 10.82811,
        sem: 0.3046733
      };
      const resp = [0, 1, 1, NaN, 0, 1, 1, Infinity, 0, 1, 0, 0];
      const params = [
        [3.18342,-0.2713,0.24],
        [2.93165,-0.649,0.24],
        [2.85039,-0.5207,0.24],
        [1.0,-0.5,0.24],
        [2.76896,-0.5084,0.24],
        [2.78698,-0.798,0.24],
        [2.72595,-0.7866,0.24],
        [1.0,-0.5,0.24],
        [2.77967,-0.4423,0.24],
        [2.66407,-0.7434,0.24],
        [2.67223,-0.6145,0.24],
        [2.65013,-0.7712,0.24]
      ];
      const res = catirtlib.wleEst_brm_one(resp, params, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('wleEst_brm_one: all non-finite responses filtered', function () {
      const expected = {
        theta: 0.0,
        info: NaN,
        sem: NaN
      };
      const resp = [NaN, Infinity, -Infinity];
      const params = [
        [3.18342,-0.2713,0.24],
        [2.93165,-0.649,0.24],
        [2.85039,-0.5207,0.24],
      ];
      const res = catirtlib.wleEst_brm_one(resp, params, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid response: non-array or empty', function () {
      const expected = {
        error: 'response must be a non-empty array'
      };

      let res = catirtlib.wleEst_brm_one([], itemparams, range);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.wleEst_brm_one({}, itemparams, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid response: non-numeric response element', function () {
      const expected = {
        error: 'response has non-numeric elements'
      };

      let res = catirtlib.wleEst_brm_one([1, [], {}, 'testo', 5], itemparams, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid params: non-array or empty', function () {
      const expected = {
        error: 'params must be a non-empty array'
      };

      let res = catirtlib.wleEst_brm_one(uresp[0], [], range);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.wleEst_brm_one(uresp[0], {}, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid params: response/params length mismatch', function () {
      const expected = {
        error: 'length of response must match length of params'
      };
      const res = catirtlib.wleEst_brm_one(uresp[0], itemparams.slice(1, 2), range);
      assert.strictEqual(format(res), format(expected));
    });
  });

  describe('wleEst_grm_one:', function () {
    it('wleEst_grm_one(uresp_grm[0], params, range)', function () {
      const expected = {
        theta: -0.3175944,
        info: 6.011785,
        sem: 0.4098758
      };
      const res = catirtlib.wleEst_grm_one(uresp_grm[0], itemparams, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid response: non-array or empty', function () {
      const expected = {
        error: 'response must be a non-empty array'
      };

      let res = catirtlib.wleEst_grm_one([], itemparams, range);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.wleEst_brm_one({}, itemparams, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid response: non-numeric/non-finite response element', function () {
      const expected = {
        error: 'response has non-numeric or non-finite elements'
      };

      let res = catirtlib.wleEst_grm_one([1, 2, NaN, 4, 5], itemparams, range);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.wleEst_grm_one([1, [], {}, 'testo', 5], itemparams, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid params: non-array or empty', function () {
      const expected = {
        error: 'params must be a non-empty array'
      };

      let res = catirtlib.wleEst_grm_one(uresp[1], [], range);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.wleEst_grm_one(uresp[1], {}, range);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid params: response/params length mismatch', function () {
      const expected = {
        error: 'length of response must match length of params'
      };
      const res = catirtlib.wleEst_grm_one(uresp_grm[0], itemparams.slice(1, 2), range);
      assert.strictEqual(format(res), format(expected));
    });
  });

  describe('FI_brm_expected_one:', function () {
    it('FI_brm_expected_one(params, theta[0])', function () {
      const expected = {
        item: [0.4144132, 0.15081586, 0.1230584, 0.02053748, 0.02596604],
        test: 0.734791,
        sem: 1.1665896
      };
      const res = catirtlib.FI_brm_expected_one(itemparams, theta[0]);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid params: non-array or empty', function () {
      const expected = {
        error: 'params must be a non-empty array'
      };

      let res = catirtlib.FI_brm_expected_one([], theta[0]);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.FI_brm_expected_one({}, theta[0]);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid theta: non-finite / non-numeric', function () {
      const expected = {
        error: 'theta must be a finite number'
      };

      let res = catirtlib.FI_brm_expected_one(itemparams, null);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.FI_brm_expected_one(itemparams, [1.7]);
      assert.strictEqual(format(res), format(expected));
    });
  });

  describe('FI_grm_expected_one:', function () {
    it('FI_grm_expected_one(params, theta[0])', function () {
      const expected = {
        item: [0.5979150, 0.5026771, 0.3045263, 0.1180620, 0.09919267],
        test: 1.622373,
        sem: 0.7850994
      };
      const res = catirtlib.FI_grm_expected_one(itemparams, theta[0]);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid params: non-array or empty', function () {
      const expected = {
        error: 'params must be a non-empty array'
      };

      let res = catirtlib.FI_grm_expected_one([], theta[0]);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.FI_grm_expected_one({}, theta[0]);
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid theta: non-finite / non-numeric', function () {
      const expected = {
        error: 'theta must be a finite number'
      };

      let res = catirtlib.FI_grm_expected_one(itemparams, null);
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.FI_grm_expected_one(itemparams, [1.7]);
      assert.strictEqual(format(res), format(expected));
    });
  });

  describe('itChoose:', function () {
    it('itChoose(items, "brm", "UW-FI", "theta", {cat_theta=0.0})', function () {
      const expected = {
        items: [{id: 'item2', params: [3.02, -0.38, 0.12], info: 1.41394}]
      };
      const res = catirtlib.itChoose(items, 'brm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));
    });

    it('itChoose(items, "brm", "UW-FI-Modified", "theta", {cat_theta=0.0, phase1_params=itemparams, phase1_est_theta=0.0})', function () {
      const expected = {
        items: [{id: 'item4', params: [2.06, 0.41, 0.12], info: 0.3777282}]
      };
      const res = catirtlib.itChoose(items, 'brm', 'UW-FI-Modified', 'theta', {cat_theta: 0.0, phase1_params:itemparams, phase1_est_theta:0.0});
      assert.strictEqual(format(res), format(expected));
    });

    it('itChoose(items, "grm", "UW-FI", "theta", {cat_theta=2.0})', function () {
      const expected = {
        items: [{id: 'item5', params: [1.48, 0.72, 0.12], info: 0.1190124}]
      };
      const res = catirtlib.itChoose(items, 'grm', 'UW-FI', 'theta', {cat_theta: 2.0});
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid items: non-array or empty', function () {
      const expected = {
        error: '"from_items" must be a non-empty array'
      };
      let res = catirtlib.itChoose([], 'brm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.itChoose({}, 'brm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid items: non-object or no params', function () {
      const expected = {
        error: '"from_items" entries must be objects with params array'
      };
      let res = catirtlib.itChoose([[1,2,3]], 'brm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.itChoose([{}], 'brm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));

    });

    it('invalid items: BRM bad params length', function () {
      const expected = {
        error: '"from_items" params must have length 3 for brm model'
      };
      let res = catirtlib.itChoose([{params:[1, 2, 3, 4]}], 'brm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.itChoose([{params:[1, 2]}], 'brm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.itChoose([{params:[]}], 'brm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));
    });

    it('invalid items: GRM bad params length', function () {
      const expected = {
        error: '"from_items" params must have length greater than 1 for grm model'
      };
      let res = catirtlib.itChoose([{params:[]}], 'grm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));

      res = catirtlib.itChoose([{params:[1]}], 'grm', 'UW-FI', 'theta', {cat_theta: 0.0});
      assert.strictEqual(format(res), format(expected));
    });
  });

  describe('termGLR_one:', function () {
    it('termGLR_one(params, uresp[0], "grm", options)', function () {
      const expected = 1;
      const res = catirtlib.termGLR_one(itemparams, uresp_grm[0], 'grm', {categories:[0,1,2], delta:0.5, alpha:0.1, beta:0.1});
      assert.strictEqual(format(res), format(expected));
    });

    it('termGLR_one(params, uresp[1], "grm", options)', function () {
      const expected = null;
      const res = catirtlib.termGLR_one(itemparams, uresp_grm[1], 'grm', {categories:[0,1,2], delta:0.5, alpha:0.1, beta:0.1});
      assert.strictEqual(format(res), format(expected));
    });

    it('termGLR_one(params, uresp[0], "brm", options)', function () {
      const expected = null;
      const res = catirtlib.termGLR_one(itemparams, uresp[0], 'brm', {categories:[0,1], bounds:[0], delta:0.5, alpha:0.1, beta:0.1});
      assert.strictEqual(format(res), format(expected));
    });

    it('termGLR_one(params, uresp[1], "brm", options)', function () {
      const expected = 0;
      const res = catirtlib.termGLR_one(itemparams, uresp[1], 'brm', {categories:[0,1], bounds:[0], delta:0.5, alpha:0.1, beta:0.1});
      assert.strictEqual(format(res), format(expected));
    });
  });
});
