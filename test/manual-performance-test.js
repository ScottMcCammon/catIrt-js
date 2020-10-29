#!/usr/bin/env node
const createCatIrtLib = require('../dist/catirtlib');
const itembank = require('../data/mocca-items.json');
const respbank = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3];

createCatIrtLib().then(function(catirtlib) {
  let maxHeap = 0;
  let i = 1;
  let n, resp, useditems, fromitems, res, sel, u, endTime;
  const begTime = new Date();

  while (true) {
    // create 1-40 random responses and items
    respbank.shuffle();
    itembank.shuffle();
    n = Math.max(1, Math.floor(Math.random() * 40));
    resp = respbank.filter((_, i) => i < n);
    useditems = itembank.filter((_, i) => (i < n));
    fromitems = itembank.filter((_, i) => (i >= n));

    // theta1 scoring
    res = catirtlib.wleEst_brm_one(resp.map(r => (r===2 ? 1 : 0)), useditems.map(it => it.p1params));

    // phase1 item selection
    if (n <= 20) {
      sel = catirtlib.itChoose(fromitems.map(it => ({id:it.id, params:it.p1params})), 'brm', 'UW-FI', 'theta', {cat_theta: res.theta});
    }

    // theta2 scoring
    res = catirtlib.wleEst_grm_one(resp, useditems.map(it => it.p2params));

    // phase2 item selection
    if (n > 20) {
      sel = catirtlib.itChoose(fromitems.map(it => ({id:it.id, params:it.p2params})), 'grm', 'UW-FI', 'theta', {cat_theta: res.theta});
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
