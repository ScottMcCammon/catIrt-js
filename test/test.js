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
});
