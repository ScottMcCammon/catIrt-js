#include <Eigen/Dense>
#include <emscripten/emscripten.h>

using Eigen::Array;
using Eigen::ArrayXXd;
using Eigen::ArrayXd;
using Eigen::ArrayX3d;
using Eigen::Ref;
using Eigen::Map;
using Eigen::RowMajor;
using Eigen::Dynamic;

/**
 * Generate the item probability matrix for person(s) with given ability estimates
 *
 * @param theta       Ability estimates buffer for N people
 * @param params      Parameters buffer for M items (M x 3 matrix)
 *
 * @return person/item probability matrix (N x M) for N people and M items
 */
ArrayXXd pbrm(const Ref<const ArrayXd>& theta, const Ref<const ArrayX3d>& params)
{
  int n_ppl, n_it;   // for person and item counts
  int i, j;          // for the loop iteration
  double p_exp;      // for the exponent of the dimension probability
  ArrayXXd P;        // for probability results

  // get dimensions of theta and params
  n_ppl = theta.rows();
  n_it  = params.rows();

  // resize results
  P.resize(n_ppl, n_it);

  // calculate probability of within categories
  // Note (IMPORTANT) - it fills in by COLUMNS, just like the default in R:
  for ( i = 0; i < n_ppl; i++ ) {
    for ( j = 0; j < n_it; j++ ) {
      // calculating the probability of response for one person
      p_exp = exp( -params(j, 0) * ( theta(i) - params(j, 1) ) );

      P(i, j) = params(j, 2) + ( 1 - params(j, 2) ) / ( 1 + p_exp );
    }
  }

  return P;
}

/*******************************************
 *
 * Begin JavaScript Bridge
 *
 *******************************************/

#ifdef __cplusplus
extern "C" {
#endif

double* EMSCRIPTEN_KEEPALIVE js_pbrm(double *theta, int thetaSize, double *params, int paramsSize)
{
  Map<const ArrayXd> atheta(theta, thetaSize);
  Map<const Array<double, Dynamic, 3, RowMajor> > aparams(params, paramsSize/3, 3);
  ArrayXXd p = pbrm(atheta, aparams);
  double *res = (double *)malloc(thetaSize * (paramsSize/3) * sizeof(double));
  int i = 0;

  for (int m = 0; m < p.rows(); m++) {
    for (int n = 0; n < p.cols(); n++) {
      res[i++] = p(m, n);
    }
  }
  return res;
}

#ifdef __cplusplus
}
#endif

/*******************************************
 *
 * End JavaScript Bridge
 *
 *******************************************/
