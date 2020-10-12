'use strict';
const mathjs = require('mathjs');
const math = mathjs.create(mathjs.all);
const assert = require('assert').strict;
const {ccallArrays, cwrapArrays} = require('wasm-arrays');
global.Module = {};

// helper function for converting values to a fixed precision string for simple comparison
function format(a, precision=7) {
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
  describe('pbrm()', function () {
    it('two people, five items', function () {
      // expected values from R equivalent: `catIrt::p.brm(theta, params)`
      const expected = [
        [0.7454547, 0.1714823, 0.2016578, 0.1452349, 0.1621502],
        [0.9936800, 0.9945256, 0.9424697, 0.8787063, 0.7380471]
      ];

      const flatres = ccallArrays('js_pbrm', 'array', ['array', 'array'], [theta, flatparams], {heapIn: 'HEAPF64', heapOut: 'HEAPF64', returnArraySize: theta.length * nitems});
      assert.equal(theta.length * itemparams.length, flatres.length);

      let res = [];
      for (let i = 0; i < theta.length; i++) {
        res.push([]);
        for (let j = 0; j < itemparams.length; j++) {
          res[i].push(flatres[i*itemparams.length + j]);
        }
      }
      Module._free(flatres);

      assert.deepStrictEqual(format(expected), format(res));
    });
  });

  describe('pder1brm()', function () {
    it('two people, five items', function () {
      // expected values from R equivalent: `catIrt::pder1.brm(theta, params)`
      const expected = [
        [0.280420646, 0.14638078, 0.1407530, 0.05049314, 0.05939428],
        [0.009725599, 0.01642982, 0.1021615, 0.21542517, 0.27228506]
      ];

      const flatres = ccallArrays('js_pder1brm', 'array', ['array', 'array'], [theta, flatparams], {heapIn: 'HEAPF64', heapOut: 'HEAPF64', returnArraySize: theta.length * nitems});
      assert.equal(theta.length * itemparams.length, flatres.length);

      let res = [];
      for (let i = 0; i < theta.length; i++) {
        res.push([]);
        for (let j = 0; j < itemparams.length; j++) {
          res[i].push(flatres[i*itemparams.length + j]);
        }
      }
      Module._free(flatres);

      assert.deepStrictEqual(format(expected), format(res));
    });
  });

  describe('pder2brm()', function () {
    it('two people, five items', function () {
      // expected values from R equivalent: `catIrt::pder2.brm(theta, params)`
      const expected = [
        [-0.18320057,  0.39034545,  0.2177993,  0.09805036,  0.07948274],
        [-0.01485815, -0.04900072, -0.1687273, -0.32144128, -0.16306764]
      ];

      const flatres = ccallArrays('js_pder2brm', 'array', ['array', 'array'], [theta, flatparams], {heapIn: 'HEAPF64', heapOut: 'HEAPF64', returnArraySize: theta.length * nitems});
      assert.equal(theta.length * itemparams.length, flatres.length);

      let res = [];
      for (let i = 0; i < theta.length; i++) {
        res.push([]);
        for (let j = 0; j < itemparams.length; j++) {
          res[i].push(flatres[i*itemparams.length + j]);
        }
      }
      Module._free(flatres);

      assert.deepStrictEqual(format(expected), format(res));
    });
  });

  describe('lder1brm:', function () {
    it('lder1brm(u, theta, params, "MLE")', function () {
      // expected values from R equivalent: `catIrt::lder1.brm(u, theta, params, type='MLE')`
      const expected = [1.797812, -5.838820];

      const flatresult = ccallArrays('js_lder1brm', 'array', ['array', 'array', 'array', 'number'], [flaturesp, theta, flatparams, 0], {heapIn: 'HEAPF64', heapOut: 'HEAPF64', returnArraySize: theta.length});
      assert.equal(expected.length, flatresult.length);

      let res = [];
      for (let i = 0; i < theta.length; i++) {
        res.push(flatresult[i]);
      }
      Module._free(flatresult);

      assert.deepStrictEqual(format(expected), format(res));
    });

    it('lder1brm(u, theta, params, "WLE")', function () {
      // expected values from R equivalent: `catIrt::lder1.brm(u, theta, params, type='WLE')`
      const expected = [2.067604, -6.474561];

      const flatresult = ccallArrays('js_lder1brm', 'array', ['array', 'array', 'array', 'number'], [flaturesp, theta, flatparams, 1], {heapIn: 'HEAPF64', heapOut: 'HEAPF64', returnArraySize: theta.length});
      assert.equal(expected.length, flatresult.length);

      let res = [];
      for (let i = 0; i < theta.length; i++) {
        res.push(flatresult[i]);
      }
      Module._free(flatresult);

      assert.deepStrictEqual(format(expected), format(res));
    });
  });
});
