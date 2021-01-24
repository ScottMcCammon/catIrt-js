# catIrt-js ChangeLog

## 2021-01-24: Version 2.2.0

 - port logLik.R to wasm_logLik_brm
 - add support for BRM classification in termGLR_one
 - filter out non-finite responses and linked params in termGLR_one

## 2021-01-13: Version 2.1.0

 - add "UW-FI-Modified" select option to itChoose
 - filter out non-finite responses in wleEst_brm_one

## 2020-11-18: Version 2.0.1

 - add changelog entry for v2.0.0

## 2020-11-18: Version 2.0.0

 - BREAKING CHANGE: all exposed web assembly function names are now prefixed with "wasm\_"
 - all functions in the library are now documented. see [docs/README.md](./docs/README.md)

## 2020-10-29: Version 1.0.0

Initial release
