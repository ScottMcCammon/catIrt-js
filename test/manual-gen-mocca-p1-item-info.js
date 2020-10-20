#!/usr/bin/env node
const createCatIrtLib = require('../dist/catirtlib');
const items = require('../data/mocca-items.json');
const params = [];
const theta = [];

// extract params
for (let i = 0; i < items.length; i++) {
  params.push(items[i].params);
}

// create theta range
for (let t100 = -500; t100 <= 500; t100 += 5) {
  theta.push(t100 / 100);
}

createCatIrtLib().then(function(catirt) {
  const mParams = catirt.MatrixFromArray(params);
  const mResp = new catirt.Matrix(0, 0);
  const mTheta = catirt.MatrixFromArray([theta]);
  const info = catirt.FI_brm(mParams, mTheta, catirt.FIType.EXPECTED, mResp);

  console.log(`theta,item,info,a,b,c`);
  for (let m = 0; m < info.item.rows(); m++) {
    for (let n = 0; n < info.item.cols(); n++) {
      console.log(`${theta[m]},${items[n]['item']},${info.item.get(m, n)},${params[n][0]},${params[n][1]},${params[n][2]}`);
    }
  }

  mParams.delete();
  mResp.delete();
  mTheta.delete();
  info.item.delete();
  info.test.delete();
  info.sem.delete();
});
