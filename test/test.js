'use strict';
const mathjs = require('mathjs');
const math = mathjs.create(mathjs.all);
const assert = require('assert').strict;
const {ccallArrays, cwrapArrays} = require('wasm-arrays');
global.Module = {};

// helper function for converting values to a fixed precision string for simple comparison
function format(a, precision=6) {
  return math.format(a, {precision});
}

describe('catIrt webasm', function () {
  // setup data
  const theta = [-1.3, 1.3];
  const uresp = [
      [1, 1, 1, 0, 0],
      [0, 0, 1, 0, 1]
  ];
  const itemparams = [
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12]
  ];
  const nitems = itemparams.length;
  let flatparams = [];
  for (let i = 0; i < nitems; i++) {
    flatparams = flatparams.concat(itemparams[i]);
  }
  let flaturesp = [];
  for (let i = 0; i < uresp.length; i++) {
    flaturesp = flaturesp.concat(uresp[i]);
  }

  // load wasm (asynchronous)
  before('loading webasm module', function(done) {
    Module = require('../dist/catirtlib');
    Module.onRuntimeInitialized = function() {
      done();
    };
  });

  // define test suite
  describe('p_brm:', function () {
    it('p_brm(theta, params)', function () {
      // expected values from R equivalent: `catIrt::p.brm(theta, params)`
      const expected = [
        [0.7454547, 0.1714823, 0.2016578, 0.1452349, 0.1621502],
        [0.9936800, 0.9945256, 0.9424697, 0.8787063, 0.7380471]
      ];

      const mParams = Module.MatrixFromArray(itemparams);
      const mTheta = Module.MatrixFromArray([theta]);
      const res = Module.p_brm(mTheta, mParams);

      assert.strictEqual(format(Module.MatrixToArray(res)), format(expected));

      // wasm heap cleanup
      mParams.delete();
      mTheta.delete();
      res.delete();
    });
  });

  describe('pder1_brm:', function () {
    it('pder1_brm(theta, params)', function () {
      // expected values from R equivalent: `catIrt::pder1.brm(theta, params)`
      const expected = [
        [0.280420646, 0.14638078, 0.1407530, 0.05049314, 0.05939428],
        [0.009725599, 0.01642982, 0.1021615, 0.21542517, 0.27228506]
      ];

      const mParams = Module.MatrixFromArray(itemparams);
      const mTheta = Module.MatrixFromArray([theta]);
      const res = Module.pder1_brm(mTheta, mParams);

      assert.strictEqual(format(Module.MatrixToArray(res)), format(expected));

      // wasm heap cleanup
      mParams.delete();
      mTheta.delete();
      res.delete();
    });
  });

  describe('pder2_brm:', function () {
    it('pder2_brm(theta, params)', function () {
      // expected values from R equivalent: `catIrt::pder2.brm(theta, params)`
      const expected = [
        [-0.18320057,  0.39034545,  0.2177993,  0.09805036,  0.07948274],
        [-0.01485815, -0.04900072, -0.1687273, -0.32144128, -0.16306764]
      ];

      const mParams = Module.MatrixFromArray(itemparams);
      const mTheta = Module.MatrixFromArray([theta]);
      const res = Module.pder2_brm(mTheta, mParams);

      assert.strictEqual(format(Module.MatrixToArray(res)), format(expected));

      // wasm heap cleanup
      mParams.delete();
      mTheta.delete();
      res.delete();
    });
  });

  describe('lder1_brm:', function () {
    it('lder1_brm(u, theta, params, "MLE")', function () {
      // expected values from R equivalent: `catIrt::lder1.brm(u, theta, params, type='MLE')`
      const expected = [1.797812, -5.838820];

      const mResp = Module.MatrixFromArray(uresp);
      const mParams = Module.MatrixFromArray(itemparams);
      const mTheta = Module.MatrixFromArray([theta]);
      const res = Module.lder1_brm(mResp, mTheta, mParams, Module.LderType.MLE);

      assert.strictEqual(format(Module.VectorToArray(res)), format(expected));

      // wasm heap cleanup
      mResp.delete();
      mParams.delete();
      mTheta.delete();
      res.delete();
    });

    it('lder1_brm(u, theta, params, "WLE")', function () {
      // expected values from R equivalent: `catIrt::lder1.brm(u, theta, params, type='WLE')`
      const expected = [2.067604, -6.474561];

      const mResp = Module.MatrixFromArray(uresp);
      const mParams = Module.MatrixFromArray(itemparams);
      const mTheta = Module.MatrixFromArray([theta]);
      const res = Module.lder1_brm(mResp, mTheta, mParams, Module.LderType.WLE);

      assert.strictEqual(format(Module.VectorToArray(res)), format(expected));

      // wasm heap cleanup
      mResp.delete();
      mParams.delete();
      mTheta.delete();
      res.delete();
    });
  });

  describe('lder2_brm:', function () {
    it('lder2_brm(u, theta, params)', function () {
      // expected values from R equivalent: `catIrt::lder2.brm(u, theta, params)`
      const expected = [
        [-0.38726367,  1.54763399,  0.5928689, -0.1181999, -0.09989038],
        [-0.01713032, -0.05638416, -0.1907768, -0.5042907, -0.35705145]
      ];

      const mResp = Module.MatrixFromArray(uresp);
      const mParams = Module.MatrixFromArray(itemparams);
      const mTheta = Module.MatrixFromArray([theta]);
      const res = Module.lder2_brm(mResp, mTheta, mParams);

      assert.strictEqual(format(Module.MatrixToArray(res)), format(expected));

      // wasm heap cleanup
      mResp.delete();
      mParams.delete();
      mTheta.delete();
      res.delete();
    });
  });

  describe('FI_brm:', function () {
    it('FI_brm(params, theta, "EXPECTED")', function () {
      const expected = {
        type: Module.FIType.EXPECTED,
        item: [
          [0.4144132, 0.15081586, 0.1230584, 0.02053748, 0.02596604],
          [0.0150616, 0.04958082, 0.1924912, 0.43542257, 0.38347792]
        ],
        test: [0.734791, 1.076034],
        sem: [1.1665896, 0.9640221]
      };

      const mParams = Module.MatrixFromArray(itemparams);
      const mTheta = Module.MatrixFromArray([theta]);
      const mResp = new Module.Matrix(0, 0);
      const res = Module.FI_brm(mParams, mTheta, Module.FIType.EXPECTED, mResp);

      assert.strictEqual(res.type, expected.type);
      assert.strictEqual(format(Module.MatrixToArray(res.item)), format(expected.item));
      assert.strictEqual(format(Module.VectorToArray(res.test)), format(expected.test));
      assert.strictEqual(format(Module.VectorToArray(res.sem)), format(expected.sem));

      // wasm heap cleanup
      mParams.delete();
      mTheta.delete();
      mResp.delete();
      res.item.delete();
      res.test.delete();
      res.sem.delete();
    });

    it('FI_brm(params, theta, "OBSERVED", resp)', function () {
      const expected = {
        type: Module.FIType.OBSERVED,
        item: [
          [0.38726367, -1.54763399, -0.5928689, 0.1181999, 0.09989038],
          [0.01713032,  0.05638416,  0.1907768, 0.5042907, 0.35705145]
        ],
        test: [-1.535149, 1.125633],
        sem: [NaN, 0.9425437]
      };

      const mParams = Module.MatrixFromArray(itemparams);
      const mTheta = Module.MatrixFromArray([theta]);
      const mResp = Module.MatrixFromArray(uresp);
      const res = Module.FI_brm(mParams, mTheta, Module.FIType.OBSERVED, mResp);

      assert.strictEqual(res.type, expected.type);
      assert.strictEqual(format(Module.MatrixToArray(res.item)), format(expected.item));
      assert.strictEqual(format(Module.VectorToArray(res.test)), format(expected.test));
      assert.strictEqual(format(Module.VectorToArray(res.sem)), format(expected.sem));

      // wasm heap cleanup
      mParams.delete();
      mTheta.delete();
      mResp.delete();
      res.item.delete();
      res.test.delete();
      res.sem.delete();
    });
  });
});
