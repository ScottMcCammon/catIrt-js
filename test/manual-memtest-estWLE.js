#!/usr/bin/env node
'use strict';
const createCatIrtLib = require('../dist/catirtlib');
let catirtlib = {};

createCatIrtLib().then(function(Module) {
  catirtlib = Module;
  const range = [-4.5, 4.5];
  const theta = [-1.3, 1.3];
  const uresp = [1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0]; 
  const itemparams = [
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12],
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12],
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12],
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12],
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12],
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12],
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12],
      [1.55,-1.88,0.12],
      [3.02,-0.38,0.12],
      [1.9,-0.1,0.12],
      [2.06,0.41,0.12],
      [1.48,0.72,0.12],
  ];

  let i = 1;
  let maxHeap = 0;
  let u;
  while (true) {
    let mResp = catirtlib.MatrixFromArray([uresp]);
    let mParams = catirtlib.MatrixFromArray(itemparams);
    let mRange = catirtlib.MatrixFromArray([range]);
    let res = catirtlib.wleEst(mResp, mParams, mRange, catirtlib.ModelType.BRM);

    // wasm heap cleanup
    mResp.delete();
    mParams.delete();
    mRange.delete();
    res.theta.delete();
    res.info.delete();
    res.sem.delete();
    /*
    */// comment out any of the above deletes to create a memory leak

    // inspect heap
    if ((i % 10000) === 0) {
      u = process.memoryUsage();
      if (u.heapUsed > maxHeap) {
        maxHeap = u.heapUsed;
      }
      console.log(`iteration ${i}: maxHeap: ${Math.floor(maxHeap/1024)}K total: ${Math.floor(u.heapTotal/1024)}K used: ${Math.floor(u.heapUsed/1024)}K`);
    }

    i++;
  }
});
