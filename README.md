## Requirements and Setup
1. Requires [nodeJS 12 or greater](https://nodejs.org/)
2. Requires [emscripten 2.0.6 or greater](https://emscripten.org/docs/getting_started/downloads.html)
3. Run: `npm install`
4. Download [Eigen 3.3.8 or greater](https://gitlab.com/libeigen/eigen/-/releases) and extract to `dist/eigen/`

## Building
Run: `npm run build`
This will generate `dist/catirtlib.wasm` and `dist/catirtlib.js`

## Testing
Run: `npm test`

## Usage
```
const create_catirtlib = require('catirtlib');

create_catirtlib().then(function(catirt) {
  const resp = [1, 0, 1, 1, 0];
  const params = [
    [1.55,-1.88,0.12],
    [3.02,-0.38,0.12],
    [1.9,-0.1,0.12],
    [2.06,0.41,0.12],
    [1.48,0.72,0.12]
  ];

  // estimate ability from a single set of responses using binary response model
  est = catirt.wleEst_brm_one(resp, params, [-4.5, 4.5]);

  if (est.error) {
    console.log(`Error: ${est.error}`);
  } else {
    console.log(`Estimated theta: ${est.theta}`);
    console.log(`Information: ${est.info}`);
    console.log(`SEM: ${est.sem}`);
  }
});
```
