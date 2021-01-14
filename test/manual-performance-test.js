#!/usr/bin/env node
const catirt_load = require('../dist/catirt');
const itembank = require('../data/mocca-items.json');
const respbank = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3];

function resp2binary(r) {
    return (r === 2 ? 1 : 0);
}

function resp2phase2(r) {
    if (r === 2) {
        return NaN;
    }
    return (r === 1 ? 1 : 0);
}

catirt_load().then(function(catirtlib) {
  let maxHeap = 0;
  let i = 1;
  let n, resp, useditems, fromitems, res1, res2, sel, u, endTime;
  const begTime = new Date();

  while (true) {
    // create 1-40 random responses and items
    respbank.shuffle();
    itembank.shuffle();
    n = Math.max(1, Math.floor(Math.random() * 40));
    resp = respbank.slice(0, n);
    useditems = itembank.slice(0, n);
    fromitems = itembank.slice(n);

    // theta1 scoring (limited to first 25 responses)
    res1 = catirtlib.wleEst_brm_one(resp.slice(0, 25).map(resp2binary), useditems.slice(0, 25).map(it => it.p1params));

    // phase1 item selection
    if (n < 25) {
      sel = catirtlib.itChoose(fromitems.map(it => ({id:it.id, params:it.p1params})), 'brm', 'UW-FI', 'theta', {cat_theta: res1.theta});
    }

    // theta2 scoring
    res2 = catirtlib.wleEst_brm_one(resp.map(resp2phase2), useditems.map(it => it.p2params));

    // phase2 item selection
    if (n >= 25) {
      phase1_params = fromitems.slice(0, 25).map(it => ({id:it.id, params:it.p1params}));
      sel = catirtlib.itChoose(fromitems.map(it => ({id:it.id, params:it.p2params})), 'brm', 'UW-FI-Modified', 'theta', {cat_theta: res2.theta, phase1_params: phase1_params, phase1_est_theta: res1.theta });
    }

    // memory and performance metrics
    if ((i % 10000) === 0) {
      endTime = new Date();
      u = process.memoryUsage();
      if (u.heapUsed > maxHeap) {
        maxHeap = u.heapUsed;
      }
      console.log(`iteration ${i}: maxHeap: ${Math.floor(maxHeap/1024)}K total: ${Math.floor(u.heapTotal/1024)}K used: ${Math.floor(u.heapUsed/1024)}K rate: ${Math.floor(1000*i/(endTime.getTime()-begTime.getTime()))} iter/s`);
    }

    i++;
  }
});
