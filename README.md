# catIrt-js

![Node.js CI](https://github.com/uomccammon/catIrt-js/workflows/Node.js%20CI/badge.svg)

### A JavaScript / WebAssembly port of the [catIrt](https://github.com/swnydick/catIrt) R package

This project focuses on the functions necessary to build a performant CAT system deployable within a NodeJS environment. There are currently no plans to port the high-level simulation functions in the R package. The intent is to use R for prototyping a new CAT model, and then this library to create the final system for web application delivery.

## Install
```
npm install catirt
```

## Usage Example
```
const catirt_load = require('catirt');

catirt_load().then(function(catirt) {
  // the item bank data structure expected by itChoose()
  const items = [
    {id: 'item1', params: [1.55,-1.88,0.12]},
    {id: 'item2', params: [1.9,-0.1,0.12]},
    {id: 'item3', params: [2.06,0.41,0.12]},
    {id: 'item4', params: [3.02,-0.38,0.12]},
    {id: 'item5', params: [1.48,0.72,0.12]}
  ];

  // the simplest response data structure: one entry for each item
  const resp = [NaN, NaN, 1, NaN, NaN];

  // estimate ability from a single set of responses using the binary response model
  let answers = catirt.getAnswers(resp);
  let params = catirt.getAnsweredItems(items, resp).map(item => item.params);
  let est = catirt.wleEst_brm_one(answers, params);

  // inspect result
  if (est.error) {
    console.log(`Error: ${est.error}`);
  } else {
    console.log(`Estimated theta: ${est.theta}`);
    console.log(`Information: ${est.info}`);
    console.log(`SEM: ${est.sem}`);
  }

  // choose the best item to administer next
  let from_items = catirt.getUnansweredItems(items, resp);
  let chosen = catirt.itChoose(from_items, 'brm', 'UW-FI', 'theta', {cat_theta: est.theta});

  // inspect result
  if (chosen.error) {
    console.log(`Error: ${chosen.error}`);
  } else {
    console.log(`Next item: ${JSON.stringify(chosen.items[0])}`);
  }
});
```

## Development
1. Requires [nodeJS 10 or greater](https://nodejs.org/) - v14 recommended
2. Requires [emscripten 2.0.6 or greater](https://emscripten.org/docs/getting_started/downloads.html)
3. Requires [Eigen 3.3.8 or greater](https://gitlab.com/libeigen/eigen/-/releases) - download and extract to `eigen/`
4. Requires nodejs packages for testing: `npm install`

## Building
Run: `npm run build`

This will generate `dist/catirt.wasm` and `dist/catirt.js`

## Testing
Unit tests: `npm test`

Performance test: `node ./test/manual-performance-test.js`

## Documentation
Generate via: `npm run docs`

View results in [docs/README.md](./docs/README.md)
