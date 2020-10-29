# catIrt
### A JavaScript / WebAssembly port of the [catIrt](https://github.com/swnydick/catIrt) R package

This project focuses on the functions necessary to build a performant CAT system deployable witin a NodeJS environment and thus does not currently have plans to port the simulation functonality of the R package. The intent is to use R for prototyping a new CAT system, and then this library to create the final model for web application delivery.

## Requirements and Setup for Development
1. Requires [nodeJS 12 or greater](https://nodejs.org/)
2. Requires [emscripten 2.0.6 or greater](https://emscripten.org/docs/getting_started/downloads.html)
3. Requires [Eigen 3.3.8 or greater](https://gitlab.com/libeigen/eigen/-/releases) - download and extract to `eigen/`
4. Requires a few nodejs packages: `npm install`

## Building
Run: `npm run build`
This will generate `dist/catirt.wasm` and `dist/catirt.js`

## Testing
Run: `npm test`

## Usage
```
const catirt_load = require('catirt');

catirt_load().then(function(catirt) {
  const resp = [NaN, NaN, 1, NaN, NaN];
  const items = [
    {id: 'item1', params: [1.55,-1.88,0.12]},
    {id: 'item2', params: [1.9,-0.1,0.12]},
    {id: 'item3', params: [2.06,0.41,0.12]},
    {id: 'item4', params: [3.02,-0.38,0.12]},
    {id: 'item5', params: [1.48,0.72,0.12]}
  ];

  // estimate ability from a single set of responses using binary response model
  let params = catirt.getAnsweredItems(items, resp).map(item => item.params);
  let est = catirt.wleEst_brm_one(catirt.getAnswers(resp), params, [-4.5, 4.5]);

  if (est.error) {
    console.log(`Error: ${est.error}`);
  } else {
    console.log(`Estimated theta: ${est.theta}`);
    console.log(`Information: ${est.info}`);
    console.log(`SEM: ${est.sem}`);
  }

  // choose best item to administer next
  let chosen = catirt.itChoose(catirt.getUnansweredItems(items, resp), 'brm', 'UW-FI', 'theta', {cat_theta: est.theta});

  if (chosen.error) {
    console.log(`Error: ${chosen.error}`);
  } else {
    console.log(`Next item: ${JSON.stringify(chosen.items[0])}`);
  }
});
```
