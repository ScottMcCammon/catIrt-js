## [MatrixFromArray](../src/additions.js#L3)

Convert a 2D array to a Matrix object on the webasm shared buffer 





|Parameter Name|Description|
|-----|-----|
|arr|2D JavaScript array containing numeric or NaN values |


**Returned Value:** Matrix object - caller frees via obj.delete() 








## [MatrixToArray](../src/additions.js#L29)

Convert a Matrix object to a 2D JavaScript array 





|Parameter Name|Description|
|-----|-----|
|m|Matrix object on the webasm shared buffer |


**Returned Value:** array 








## [VectorToArray](../src/additions.js#L47)

Convert a Vector object to a JavaScript array 





|Parameter Name|Description|
|-----|-----|
|v|Vector object on the webasm shared buffer |


**Returned Value:** array 








## [wleEst_brm_one](../src/additions.js#L62)

Compute an ability estimate using the binary response model 





|Parameter Name|Description|
|-----|-----|
|resp|Array of N response values (1=correct, 0=incorrect)|
|params|2D array (Nx3) of item parameters|
|range|Array (2-tuple) range to limit computed theta within |


**Returned Value:** object with "theta", "info", and "sem" properties. Or a single "error" property 








## [wleEst_grm_one](../src/additions.js#L134)

Compute an ability estimate using a graded response model of M categories 





|Parameter Name|Description|
|-----|-----|
|resp|Array of N response values ranging from (1 to M)|
|params|2D array (NxM) of item parameters|
|range|Array (2-tuple) range to limit computed theta within. [-4.5, 4.5] by default |


**Returned Value:** object with "theta", "info", and "sem" properties. Or a single "error" property 








## [FI_brm_expected_one](../src/additions.js#L188)

Compute expected Fisher Information values for a set of items using the binary response model 





|Parameter Name|Description|
|-----|-----|
|params|2D array (Nx3) of item parameters|
|theta|a single ability estimate |


**Returned Value:** object with "item", "test", and "sem" properties. Or a single "error" property 








## [FI_brm_expected_one_modified](../src/additions.js#L234)

Compute expected Fisher Information (modified unweighted) values for a set of items using the binary response model 





|Parameter Name|Description|
|-----|-----|
|params2|2D array (Nx3) of phase2 item parameters|
|theta2|a single phase2 ability estimate|
|params1|2D array (Nx3) of phase1 item parameters|
|theta1|a single phase1 ability estimate |


**Returned Value:** object with "item", "test", and "sem" properties. Or a single "error" property 








## [FI_grm_expected_one](../src/additions.js#L294)

Compute expected Fisher Information values for a set of items using a graded response model of M categories 





|Parameter Name|Description|
|-----|-----|
|params|2D array (NxM) of item parameters|
|theta|a single ability estimate |


**Returned Value:** object with "item", "test", and "sem" properties. Or a single "error" property 








## [termGLR_one](../src/additions.js#L340)

Attempt to classify responses to a BRM model of 2 categories, or a GRM model of N categories using the generalized likelihood ratio 

options defaults: 
{ 
range: [-4.5, 4.5], // range of theta values to analyze 
bounds: [-1, 1], // likelihood boundaries for GRM (size N-1) (default [0] for BRM) 
categories: [0, 1, 2], // category labels that will be returned (size N) (BRM only considers first 2 categories) 
delta: 0.1, // defines size of indifference region 
alpha: 0.05, // controls upper and lower likelihood threshold 
beta: 0.05 // controls upper and lower likelihood threshold 
} 





|Parameter Name|Description|
|-----|-----|
|params|2D array (NxM) of item parameters|
|resp|Array of N response values ranging from (1 to M)|
|model|'brm' or 'grm'|
|options|Options object (see description above) |


**Returned Value:** options.category value OR NULL if unable to classify 








## [itChoose](../src/additions.js#L544)

Choose optimal item(s) for test administration 

options defaults: 
{ 
numb: 1, // number of items to randomly select from top N 
n_select: 1, // top N items to consider 
cat_theta: null // estimated ability of respondant 
} 





|Parameter Name|Description|
|-----|-----|
|from_items|Array of item objects to choose from (with id and params properties)|
|model|'brm' or 'grm'|
|select|Item information function type. Currently only 'UW-FI' is supported|
|at|Item selection parameter. Currently only 'theta' is supported. |


**Returned Value:** Object with 'items' array or 'error' string 








## [getAnswers](../src/additions.js#L749)

Extract answers (i.e. finite values) from an array of responses 





|Parameter Name|Description|
|-----|-----|
|resp|Array NaN, Infinity, or numeric response values |


**Returned Value:** array Array of just the finite response values 








## [getAnsweredItems](../src/additions.js#L763)

Filter array of items for those that have been answered 





|Parameter Name|Description|
|-----|-----|
|items|Array of N items|
|resp|Array of N response values |


**Returned Value:** array Array of items which have been answered (a finite response value is present) 








## [getUnansweredItems](../src/additions.js#L778)

Filter array of items for those that have not been answered 





|Parameter Name|Description|
|-----|-----|
|items|Array of N items|
|resp|Array of N response values |


**Returned Value:** array Array of items which have not been answered (no finite response value present) 








## [wasm_p_brm](../src/catirt.cpp#L1094)

**Type:** `const` `JSMatrix`

Generate the BRM item probability matrix for person(s) with given ability estimates 





|Parameter Name|Description|
|-----|-----|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x 3 matrix) |


**Returned Value:** person/item probability matrix (N x M) for N people and M items 








## [wasm_p_grm](../src/catirt.cpp#L1107)

**Type:** `const` `JSMatrix`

Generate the item GRM probability matrix for person(s) with given ability estimates 





|Parameter Name|Description|
|-----|-----|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x K matrix) where K is number of categories |


**Returned Value:** person/item probability matrix ((NK) x M) for N people, K categories, and M items 








## [wasm_pder1_brm](../src/catirt.cpp#L1120)

**Type:** `const` `JSMatrix`

Derivative of the BRM item probability matrix for person(s) with given ability estimates 





|Parameter Name|Description|
|-----|-----|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x 3 matrix) |


**Returned Value:** person/item derivative probability matrix (N x M) for N people and M items 








## [wasm_pder1_grm](../src/catirt.cpp#L1133)

**Type:** `const` `JSMatrix`

Derivative of the GRM item probability matrix for person(s) with given ability estimates 





|Parameter Name|Description|
|-----|-----|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x K matrix) where K is number of categories |


**Returned Value:** person/item derivative probability matrix ((NK) x M) for N people, K categories, and M items 








## [wasm_pder2_brm](../src/catirt.cpp#L1146)

**Type:** `const` `JSMatrix`

2nd derivative of the BRM item probability matrix for person(s) with given ability estimates 





|Parameter Name|Description|
|-----|-----|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x 3 matrix) |


**Returned Value:** person/item 2nd derivative probability matrix (N x M) for N people and M items 








## [wasm_pder2_grm](../src/catirt.cpp#L1159)

**Type:** `const` `JSMatrix`

2nd derivative of the GRM item probability matrix for person(s) with given ability estimates 





|Parameter Name|Description|
|-----|-----|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x K matrix) where K is number of categories |


**Returned Value:** person/item 2nd derivative probability matrix ((NK) x M) for N people, K categories, and M items 








## [wasm_lder1_brm](../src/catirt.cpp#L1172)

**Type:** `const` `Vector`

Derivative of log-likelihoods of reponses to items at given ability estimates 





|Parameter Name|Description|
|-----|-----|
|u|Item responses (N people x M responses)|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x 3 matrix)|
|type|LderType.WLE (weighted likelihood) or LderType.MLE (maximum likelihood) |


**Returned Value:** derivative of log-likelihood for each person - vector (N x 1) 








## [wasm_lder1_grm](../src/catirt.cpp#L1187)

**Type:** `const` `Vector`

Derivative of log-likelihoods of reponses to items at given ability estimates 





|Parameter Name|Description|
|-----|-----|
|u|Item responses (N people x M responses)|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x K matrix) where K is number of categories|
|type|LderType.WLE (weighted likelihood) or LderType.MLE (maximum likelihood) |


**Returned Value:** derivative of log-likelihood for each person/category - vector (N x 1) 








## [wasm_logLik_brm](../src/catirt.cpp#L1202)

**Type:** `const` `Vector`

BRM model log-likelihoods of reponses to items at given ability estimates 

Port of: lokLik.brm.R 





|Parameter Name|Description|
|-----|-----|
|u|Item responses (N people x M responses)|
|theta|Ability estimates for N people (or T thetas if N is 1)|
|params|Parameters for M items (M x 3 matrix)|
|type|LogLikType.MLE or LogLikType.BME (not yet supported) |


**Returned Value:** log-likelihood for each person - vector (N x 1), or for each theta - vector (T x 1) 








## [wasm_logLik_grm](../src/catirt.cpp#L1219)

**Type:** `const` `Vector`

GRM model log-likelihoods of reponses to items at given ability estimates 





|Parameter Name|Description|
|-----|-----|
|u|Item responses (N people x M responses)|
|theta|Ability estimates for N people (or T thetas if N is 1)|
|params|Parameters for M items (M x K matrix) where K is number of categories|
|type|LogLikType.MLE or LogLikType.BME (not yet supported) |


**Returned Value:** log-likelihood for each person - vector (N x 1), or for each theta - vector (T x 1) 








## [wasm_sel_prm](../src/catirt.cpp#L1234)

**Type:** `const` `JSMatrix`

Select item/category likelihoods 





|Parameter Name|Description|
|-----|-----|
|p|((MK) x J) likelihood values for all categories / various thetas|
|u|Item responses (N people x J responses)|
|K|number of categories |


**Returned Value:** (T x J) matrix - item likelihoods where T = N>1; M, for N=1 








## [wasm_lder2_brm](../src/catirt.cpp#L1248)

**Type:** `const` `JSMatrix`

2nd derivative of log-likelihoods of reponses to items at given ability estimates 





|Parameter Name|Description|
|-----|-----|
|u|Item responses (N people x M responses)|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x 3 matrix) |


**Returned Value:** 2nd derivative of log-likelihood for each person - vector (N x M) 








## [wasm_lder2_grm](../src/catirt.cpp#L1262)

**Type:** `const` `JSMatrix`

2nd derivative of log-likelihoods of reponses to items at given ability estimates 





|Parameter Name|Description|
|-----|-----|
|u|Item responses (N people x M responses)|
|theta|Ability estimates for N people|
|params|Parameters for M items (M x K matrix) where K is number of categories |


**Returned Value:** 2nd derivative of log-likelihood for each person - vector (N x M) 








## [wasm_FI_brm](../src/catirt.cpp#L1303)

**Type:** `JSFI_Result`

Fisher Information of BRM items for given ability estimates and optional responses (for OBSERVED info) 





|Parameter Name|Description|
|-----|-----|
|params|Parameters for M items (M x 3 matrix)|
|theta|Ability estimates for N people|
|type|FIType.EXPECTED or FIType.OBSERVED|
|resp|Item responses (N people x M responses) should be size 0 for FIType.EXPECTED |


**Returned Value:** FI_Result with item (NxM), test (Nx1), sem (Nx1), and type info 








## [wasm_FI_brm_modified_expected](../src/catirt.cpp#L1318)

**Type:** `JSFI_Result`

Expected Fisher Information (modified unweighted) of BRM items for given phase 1 and phase 2 ability estimates 





|Parameter Name|Description|
|-----|-----|
|p2_params|Phase 2 parameters for M items (M x 3 matrix)|
|p2_theta|Phase 2 ability estimates for N people|
|p1_params|Phase 1 parameters for M items (M x 3 matrix)|
|p1_theta|Phase 1 ability estimates for N people |


**Returned Value:** FI_Result with item (NxM), test (Nx1), sem (Nx1), and type info 








## [wasm_FI_grm](../src/catirt.cpp#L1333)

**Type:** `JSFI_Result`

Fisher Information of GRM items for given ability estimates and optional responses (for OBSERVED info) 





|Parameter Name|Description|
|-----|-----|
|params|Parameters for M items (M x K matrix) where K is number of categories|
|theta|Ability estimates for N people|
|type|FIType.EXPECTED or FIType.OBSERVED|
|resp|Item responses (N people x M responses) should be size 0 for FIType.EXPECTED |


**Returned Value:** FI_Result with item (NxM), test (Nx1), sem (Nx1), and type info 








## [wasm_uniroot_lder1](../src/catirt.cpp#L1348)

**Type:** `Uniroot_Result`

Search the range interval for a root of the specificed BRM or GRM lder1 function with respect to theta 





|Parameter Name|Description|
|-----|-----|
|range|Interval to search: should be [-X,+X] for some positive X|
|resp|Item responses for a single person (1 x M)|
|params|Parameters for M items (M x K matrix)|
|type|LderType.WLE (weighted likelihood) or LderType.MLE (maximum likelihood)|
|model|ModelType.BRM or ModelType.GRM |


**Returned Value:** Uniroot_Result with iter=-1 if a root did not converge within max iterations 








## [wasm_wleEst](../src/catirt.cpp#L1389)

**Type:** `JSEst_Result`

Estimate ability from one or more sets of item responses 





|Parameter Name|Description|
|-----|-----|
|resp|Item responses (N people x M responses) should be size 0 for FIType::EXPECTED|
|params|Parameters for M items (M x K matrix)|
|range|Range of abilities to explore (2 x 1)|
|type|ModelType.BRM or ModelType.GRM |


**Returned Value:** Est_Result with theta (Nx1), info (Nx1), and sem (Nx1) info 








