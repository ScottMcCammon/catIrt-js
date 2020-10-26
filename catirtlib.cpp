#include <Eigen/Core>
#include <emscripten/bind.h>
#include <cfloat>
#include <cmath>

enum class LderType {
    MLE,
    WLE
};

enum class FIType {
    EXPECTED,
    OBSERVED
};

enum class ModelType {
    BRM,
    GRM
};

using namespace emscripten;
using namespace Eigen;

using Vector = std::vector<double>;

/**
 * Generate the BRM item probability matrix for person(s) with given ability estimates
 *
 * Port of: p.brm.R
 *
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x 3 matrix)
 *
 * @return person/item probability matrix (N x M) for N people and M items
 */
const ArrayXXd p_brm(const Ref<const ArrayXd>& theta, const Ref<const ArrayX3d>& params)
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

/**
 * Generate the item GRM probability matrix for person(s) with given ability estimates
 *
 * Port of: p.grm.R
 *
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x K matrix) where K is number of categories
 *
 * @return person/item probability matrix ((N*K) x M) for N people, K categories, and M items
 */
const ArrayXXd p_grm(const Ref<const ArrayXd>& theta, const Ref<const ArrayXXd>& params)
{
  int n_ppl, n_it, n_cat;   // for person, item, and category counts
  int i, j, k;              // for the loop iteration
  double p_exp;             // for the exponent of the dimension probability
  double p;                 // for the GRM probability of correct
  ArrayXXd P;               // for the probability results

  // get dimensions of theta and params
  n_ppl = theta.rows();
  n_it  = params.rows();
  n_cat = params.cols();

  // resize results
  P.resize(n_ppl * n_cat, n_it);

  // calculate probability of within categories
  // Note (IMPORTANT) - it fills in by COLUMNS, just like the default in R:
  for ( i = 0; i < n_ppl; i++ ) {
    for ( j = 0; j < n_it; j++ ) {
      P((i * n_cat + 0), j) = 1;

      for ( k = 0; k < n_cat - 1; k++ ) {
        p_exp = exp( -params(j, 0) * (theta(i) - params(j, k + 1)) );
        p     = 1 / ( 1 + p_exp );

        P((i * n_cat + k + 1), j) = p;
        P((i * n_cat + k), j)    -= p;
      }
    }
  }

  return P;
}

/**
 * Derivative of the BRM item probability matrix for person(s) with given ability estimates
 *
 * Port of: pder1.brm.R
 *
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x 3 matrix)
 *
 * @return person/item derivative probability matrix (N x M) for N people and M items
 */
const ArrayXXd pder1_brm(const Ref<const ArrayXd>& theta, const Ref<const ArrayX3d>& params)
{
  int n_ppl, n_it;   // for person and item counts
  int i, j;          // for the loop iteration
  double p_exp;      // for the exponent of the dimension probability
  double p;          // for the 2PL probability of correct
  ArrayXXd Pd1;      // for probability derivative results

  // get dimensions of theta and params
  n_ppl = theta.rows();
  n_it  = params.rows();

  // resize results
  Pd1.resize(n_ppl, n_it);

  // calculate derivative of probability of within categories
  // Note (IMPORTANT) - it fills in by COLUMNS, just like the default in R:
  for ( i = 0; i < n_ppl; i++ ) {
    for ( j = 0; j < n_it; j++ ) {
      // calculating the derivative of the probability of response for one person
      p_exp = exp( -params(j, 0) * ( theta(i) - params(j, 1) ) );
      p     = 1 / ( 1 + p_exp );

      Pd1(i, j) = ( 1 - params(j, 2) ) * params(j, 0) * p * ( 1 - p );
    }
  }

  return Pd1;
}

/**
 * Derivative of the GRM item probability matrix for person(s) with given ability estimates
 *
 * Port of: pder1.grm.R
 *
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x K matrix) where K is number of categories
 *
 * @return person/item derivative probability matrix ((N*K) x M) for N people, K categories, and M items
 */
const ArrayXXd pder1_grm(const Ref<const ArrayXd>& theta, const Ref<const ArrayXXd>& params)
{
  int n_ppl, n_it, n_cat;   // for person, item, and category counts
  int i, j, k;              // for the loop iteration
  double p_exp;             // for the exponent of the dimension probability
  double p, p_der1;         // for the GRM probability of correct
  ArrayXXd Pd1;             // for probability derivative results

  // get dimensions of theta and params
  n_ppl = theta.rows();
  n_it  = params.rows();
  n_cat = params.cols();

  // resize results
  Pd1.resize((n_ppl * n_cat), n_it);

  // calculate derivative of probability of within categories
  // Note (IMPORTANT) - it fills in by COLUMNS, just like the default in R:
  for ( i = 0; i < n_ppl; i++ ) {
    for ( j = 0; j < n_it; j++ ) {
      Pd1((i * n_cat + 0), j) = 0;

      for ( k = 0; k < n_cat - 1; k++ ) {
        p_exp  = exp( -params(j, 0) * (theta(i) - params(j, k + 1)) );
        p      = 1 / ( 1 + p_exp );
        p_der1 = params(j, 0) * p * ( 1 - p );

        Pd1((i * n_cat + k + 1), j) = p_der1;
        Pd1((i * n_cat + k), j)    -= p_der1;
      }
    }
  }

  return Pd1;
}

/**
 * 2nd derivative of the BRM item probability matrix for person(s) with given ability estimates
 *
 * Port of: pder2.brm.R
 *
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x 3 matrix)
 *
 * @return person/item 2nd derivative probability matrix (N x M) for N people and M items
 */
const ArrayXXd pder2_brm(const Ref<const ArrayXd>& theta, const Ref<const ArrayX3d>& params)
{
  int n_ppl, n_it;   // for person and item counts
  int i, j;          // for the loop iteration
  double p_exp;      // for the exponent of the dimension probability
  double p;          // for the 2PL probability of correct
  double p_der1;     // for the 1st derivative probability correct
  ArrayXXd Pd2;      // for probability derivative results

  // get dimensions of theta and params
  n_ppl = theta.rows();
  n_it  = params.rows();

  // allocate memory for results
  Pd2.resize(n_ppl, n_it);

  // calculate 2nd derivative of probability of within categories
  // Note (IMPORTANT) - it fills in by COLUMNS, just like the default in R:
  for ( i = 0; i < n_ppl; i++ ) {
    for ( j = 0; j < n_it; j++ ) {
      // calculating the 2nd derivative of the probability of response for one person
      p_exp  = exp( params(j, 0) * ( theta(i) - params(j, 1) ) );
      p      = p_exp / ( 1 + p_exp );
      p_der1 = ( 1 - params(j, 2) ) * params(j, 0) * p * ( 1 - p );

      Pd2(i, j) = params(j, 0) * ( 1 - p_exp ) * ( 1 - p ) * p_der1;
    }
  }

  return Pd2;
}

/**
 * 2nd derivative of the GRM item probability matrix for person(s) with given ability estimates
 *
 * Port of: pder2.grm.R
 *
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x K matrix) where K is number of categories
 *
 * @return person/item 2nd derivative probability matrix ((N*K) x M) for N people, K categories, and M items
 */
const ArrayXXd pder2_grm(const Ref<const ArrayXd>& theta, const Ref<const ArrayXXd>& params)
{
  int n_ppl, n_it, n_cat;   // for person, item, and category counts
  int i, j, k;              // for the loop iteration
  double p_exp;             // for the exponent of the dimension probability
  double p, p_der1, p_der2; // for the GRM probability of correct
  ArrayXXd Pd2;             // for probability derivative results

  // get dimensions of theta and params
  n_ppl = theta.rows();
  n_it  = params.rows();
  n_cat = params.cols();

  // resize results
  Pd2.resize((n_ppl * n_cat), n_it);

  // calculate 2nd derivative of probability of within categories
  // Note (IMPORTANT) - it fills in by COLUMNS, just like the default in R:
  for ( i = 0; i < n_ppl; i++ ) {
    for ( j = 0; j < n_it; j++ ) {
      Pd2((i * n_cat + 0), j) = 0;

      for ( k = 0; k < n_cat - 1; k++ ) {
        p_exp  = exp( params(j, 0) * (theta(i) - params(j, k + 1)) );
        p      = p_exp / ( 1 + p_exp );
        p_der1 = params(j, 0) * p * ( 1 - p );
        p_der2 = params(j, 0) * (1 - p_exp) * (1 - p) * p_der1;

        Pd2((i * n_cat + k + 1), j) = p_der2;
        Pd2((i * n_cat + k), j)    -= p_der2;
      }
    }
  }

  return Pd2;
}

/**
 * Derivative of log-likelihoods of reponses to items at given ability estimates
 *
 * Port of: lder1.brm.R
 *
 * @param u           Item responses (N people x M responses)
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x 3 matrix)
 * @param ltype       LderType::WLE (weighted likelihood) or LderType::MLE (maximum likelihood)
 *
 * @return derivative of log-likelihood for each person - vector (N x 1)
 */
const ArrayXd lder1_brm( const Ref<const ArrayXXd>& u, const Ref<const ArrayXd>& theta, const Ref<const ArrayXXd>& params, LderType ltype )
{
  // u is the response, theta is ability, and params are the parameters.
  int N = theta.rows();
  int M = params.rows();

  // Calculating the probability of response:
  ArrayXXd p = p_brm(theta, params);
  ArrayXXd q = (1 - p);
  ArrayXXd pq = (p * q);

  // Calculating the first and second derivatives:
  ArrayXXd pder1 = pder1_brm(theta, params);
  ArrayXXd pder2 = pder2_brm(theta, params);

  // Calculating lder1 for normal/Warm:
  ArrayXXd lder1 = ( u - p ) * pder1 / pq;

  // Apply Warm correction:
  if ( ltype == LderType::WLE ) {
    ArrayXd I = ( pder1.square() / pq ).rowwise().sum();
    ArrayXXd H = ( pder1 * pder2 ) / pq;

    // R equivalent: H = (H / ( 2 * I ))
    for (int j = 0; j < M; j++) {
      H.col(j) /= (2 * I);
    }

    lder1 += H;
  }

  // Return Vector of logLik's
  return lder1.rowwise().sum();
}

/**
 * Select item/category likelihoods
 *
 * Port of: sel.prm in ExtractOperators.R
 *
 * @param p ((M*K) x J) likelihood values for all categories / various thetas
 * @param u Item responses (N people x J responses)
 * @param K number of categories
 *
 * @return (T x J) matrix - item likelihoods where T = {N, for N>1; M, for N=1}
 */
const ArrayXXd sel_prm( const Ref<const ArrayXXd>& p, const Ref<const ArrayXXd>& u, int K ) {
  int N = u.rows();
  int J = p.cols();
  int M, T;
  int i, cat;
  ArrayXXd lik;

  if (K < 2) {
    throw "sel_prm invalid value for K";
  }

  M = p.rows() / K;
  T = (N == 1 ? M : N);
  lik.resize(M, J);

  if ((N == 0) || (J == 0) || (M == 0)) {
    throw "sel_prm 0-value for N, J, or M";
  }

  if ((u.cols() != p.cols()) || (p.rows() % K > 0) || (p.rows() % N > 0)) {
    throw "sel_prm dimension mismatch between p, u, and K";
  }

  for (int t = 0; t < T; t++) {   // t: row index of result, start of block row in value matrix p
    i = t % N;                    // i: row index into response matrix u
    for (int j = 0; j < J; j++) { // j: col (item) index
      if (isnan(u(i, j))) {
        cat = -1;
      } else {
        cat = static_cast<int>(u(i, j));
      }
      if (cat > 0 && cat <= K) {
        lik(t, j) = p.block(t * K, 0, K, J)(cat - 1, j);
      } else {
        lik(t, j) = nan("");
      }
    }
  }
  return lik;
}

/**
 * Derivative of log-likelihoods of reponses to items at given ability estimates
 *
 * Port of: lder1.grm.R
 *
 * @param u           Item responses (N people x M responses)
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x K matrix) where K is number of categories
 * @param ltype       LderType::WLE (weighted likelihood) or LderType::MLE (maximum likelihood)
 *
 * @return derivative of log-likelihood for each person - vector (N x 1)
 */
const ArrayXd lder1_grm( const Ref<const ArrayXXd>& u, const Ref<const ArrayXd>& theta, const Ref<const ArrayXXd>& params, LderType ltype )
{
  // u is the response, theta is ability, and params are the parameters.
  int N = theta.rows();
  int J = params.rows();
  int K = params.cols();

  // Calculating the probability of response:
  ArrayXXd p = p_grm(theta, params);

  // Calculating the first and second derivatives:
  ArrayXXd pder1 = pder1_grm(theta, params);
  ArrayXXd pder2 = pder2_grm(theta, params);

  // Calculating lder1 for normal/Warm:
  ArrayXXd lder1 = sel_prm(pder1 / p, u, K);

  // Apply Warm correction:
  if ( ltype == LderType::WLE ) {
    ArrayXXd Itmp = pder1.square() / p;
    ArrayXXd Htmp = ( pder1 * pder2 ) / p;
    ArrayXd I(N);
    ArrayXd H(N);

    // sum all values for each person
    for (int i = 0; i < N; i++) {
        I(i) = Itmp.block(i * K, 0, K, J).sum();
        H(i) = Htmp.block(i * K, 0, K, J).sum();
    }

    lder1.colwise() += (H / (2 * I) / J);
  }

  // Return Vector of logLik's
  return lder1.rowwise().sum();
}

/**
 * 2nd derivative of log-likelihoods of reponses to items at given ability estimates
 *
 * Port of: lder2.brm.R
 *
 * @param u           Item responses (N people x M responses)
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x 3 matrix)
 *
 * @return 2nd derivative of log-likelihood for each person - vector (N x M)
 */
const ArrayXXd lder2_brm( const Ref<const ArrayXXd>& u, const Ref<const ArrayXd>& theta, const Ref<const ArrayX3d>& params )
{
  // Calculating the probability of response:
  ArrayXXd p = p_brm(theta, params);
  ArrayXXd q = (1 - p);

  // Calculating the first and second derivatives:
  ArrayXXd pder1 = pder1_brm(theta, params);
  ArrayXXd pder2 = pder2_brm(theta, params);

  // Calculating two parts of second derivative:
  ArrayXXd lder2_1 = ( -pder1.square() / p.square() ) + ( pder2 / p );
  ArrayXXd lder2_2 = ( pder1.square() / q.square() ) + ( pder2 / q );

  return ((u * lder2_1) - ((1 - u) * lder2_2));
}

/**
 * 2nd derivative of log-likelihoods of reponses to items at given ability estimates
 *
 * Port of: lder2.grm.R
 *
 * @param u           Item responses (N people x M responses)
 * @param theta       Ability estimates for N people
 * @param params      Parameters for M items (M x K matrix) where K is number of categories
 *
 * @return 2nd derivative of log-likelihood for each person - vector (N x M)
 */
const ArrayXXd lder2_grm( const Ref<const ArrayXXd>& u, const Ref<const ArrayXd>& theta, const Ref<const ArrayXXd>& params )
{
  int K = params.cols();

  // Calculating the probability of response:
  ArrayXXd p = p_grm(theta, params);

  // Calculating the first and second derivatives:
  ArrayXXd pder1 = pder1_grm(theta, params);
  ArrayXXd pder2 = pder2_grm(theta, params);

  // Calculating two parts of second derivative:
  ArrayXXd lder2 = ( -1 * pder1.square() / p.square() ) + ( pder2 / p );

  return sel_prm(lder2, u, K);
}

struct FI_Result
{
    ArrayXXd item;
    ArrayXd test;
    ArrayXd sem;
    FIType type;

    FI_Result() {}

    FI_Result(FIType type)
    {
        this->type = type;
    }

    FI_Result(const FI_Result &r)
    {
        // allows Eigen optimizations not available with default copy constructor
        item = r.item;
        test = r.test;
        sem = r.sem;
        type = r.type;
    }
};

/**
 * Fisher Information of BRM items for given ability estimates and optional responses (for OBSERVED info)
 *
 * Port of: FI.brm.R
 *
 * @param params      Parameters for M items (M x 3 matrix)
 * @param theta       Ability estimates for N people
 * @param type        FIType::EXPECTED or FIType::OBSERVED
 * @param resp        Item responses (N people x M responses) should be size 0 for FIType::EXPECTED
 *
 * @return FI_Result with item (NxM), test (Nx1), sem (Nx1), and type info
 */
const FI_Result FI_brm( const Ref<const ArrayX3d>& params, const Ref<const ArrayXd>& theta, FIType type, const Ref<const ArrayXXd>& resp )
{
  // check supported types
  if ( type != FIType::OBSERVED && type != FIType::EXPECTED ) {
    throw "FI_brm unexpected type";
  }

  // Make sure that resp is NULL if type is "expected"
  if ( type == FIType::EXPECTED && resp.size() > 0 ) {
    throw "FI_brm type EXPECTED with non-zero responses";
  }

  // Make sure that resp exists if we are calculating "observed" information
  if ( type == FIType::OBSERVED && resp.size() == 0 ) {
    throw "FI_brm need response scalar/vector to calculate observed information";
  }

  ArrayXXd p;
  ArrayXXd q;
  ArrayXXd pder1;
  FI_Result result = FI_Result(type);

  // Expected Fisher Information: p'^2/(p*q)
  if ( type == FIType::EXPECTED ) {
    // Calculating the probability of response:
    p = p_brm(theta, params);
    q = (1 - p);

    // Calculating the first derivative:
    pder1 = pder1_brm(theta, params);

    result.item = pder1.square() / ( p * q );
  }
  // Observed Fisher Information
  else {
    result.item = -1 * lder2_brm(resp, theta, params);
  }

  result.test = result.item.rowwise().sum();
  result.sem = sqrt( 1 / result.test );

  return result;
}

/**
 * Fisher Information of GRM items for given ability estimates and optional responses (for OBSERVED info)
 *
 * Port of: FI.grm.R
 *
 * @param params      Parameters for M items (M x K matrix) where K is number of categories
 * @param theta       Ability estimates for N people
 * @param type        FIType::EXPECTED or FIType::OBSERVED
 * @param resp        Item responses (N people x M responses) should be size 0 for FIType::EXPECTED
 *
 * @return FI_Result with item (NxM), test (Nx1), sem (Nx1), and type info
 */
const FI_Result FI_grm( const Ref<const ArrayXXd>& params, const Ref<const ArrayXd>& theta, FIType type, const Ref<const ArrayXXd>& resp )
{
  // check supported types
  if ( type != FIType::OBSERVED && type != FIType::EXPECTED ) {
    throw "FI_grm unexpected type";
  }

  // Make sure that resp is NULL if type is "expected"
  if ( type == FIType::EXPECTED && resp.size() > 0 ) {
    throw "FI_brm type EXPECTED with non-zero responses";
  }

  // Make sure that resp exists if we are calculating "observed" information
  if ( type == FIType::OBSERVED && resp.size() == 0 ) {
    throw "FI_brm need response scalar/vector to calculate observed information";
  }

  int N = theta.size();  // number of people
  int M = params.rows(); // number of items
  int K = params.cols(); // number of categories
  ArrayXXd p;
  ArrayXXd pder1;
  FI_Result result = FI_Result(type);
  result.item.resize(N, M);

  // Expected Fisher Information: sum[P'^2/P]
  if ( type == FIType::EXPECTED ) {
    // Calculating the probability of response:
    p = p_grm(theta, params);

    // Calculating the first derivative:
    pder1 = pder1_grm(theta, params);

    ArrayXXd tmp = pder1.square() / p;

    // sum columns of each person's block and add as row to result.item
    for (int i = 0; i < N; i++) {
        result.item.row(i) = tmp.block(i * K, 0, K, M).colwise().sum();
    }
  }
  // Observed Fisher Information
  else {
    result.item = -1 * lder2_grm(resp, theta, params);
  }

  result.test = result.item.rowwise().sum();
  result.sem = sqrt( 1 / result.test );

  return result;
}

struct Uniroot_Result
{
    double root;
    double f_root;
    int iter;
    double estim_prec;
};

/**
 * Search the range interval for a root of the specificed lder1 function with respect to theta
 *
 * Combined port of: uniroot and R_zeroin2, Copyright (C) 1999-2016  The R Core Team 
 *   https://github.com/SurajGupta/r-source/blob/a28e609e72ed7c47f6ddfbb86c85279a0750f0b7/src/library/stats/R/nlm.R#L55
 *   https://github.com/SurajGupta/r-source/blob/a28e609e72ed7c47f6ddfbb86c85279a0750f0b7/src/library/stats/src/zeroin.c
 *
 * @param lderFP      Pointer to lder1_brm or lder1_grm functions
 * @param range       Interval to search: should be [-X,+X] for some positive X
 * @param resp        Item responses for a single person (1 x M)
 * @param params      Parameters for M items (M x K matrix)
 * @param type        LderType::WLE (weighted likelihood) or LderType::MLE (maximum likelihood)
 * @param maxit       Maximum number of iterations for search (default: 1000)
 * @param tol         Acceptable tolerance level (default: EPSILON^0.25)
 *
 * @return Uniroot_Result with iter=-1 if a root did not converge within max iterations
 */
Uniroot_Result uniroot_lder1(
    const ArrayXd (*lderFP)(const Ref<const ArrayXXd>&, const Ref<const ArrayXd>&, const Ref<const ArrayXXd>&, LderType),
    const Ref<const RowVector2d>& range,
    const Ref<const ArrayXXd>& resp,
    const Ref<const ArrayXXd>& params,
    LderType type,
    int maxit = 1000,
    double tol = 0.0
)
{
    double lower = range(0); // ax
    double upper = range(1); // bx
    double a, b, c;          // Abscissae, descr. see above
    double fa, fb, fc;       // f(a), f(b), f(c)
    Array<double, 1, 1> tmpTheta;
    Array<double, 1, 1> lderResult;
    Uniroot_Result result{0};

    // NOTE: removed code to extend interval if lower * upper > 0

    // Set default tolerance
    if (tol <= 0) {
        tol = pow(DBL_EPSILON, 0.25);
    }

    // First test if we have found a root at an endpoint
    a = lower;
    b = upper;

    tmpTheta(0) = a;
    lderResult = (*lderFP)(resp, tmpTheta, params, type);
    fa = lderResult(0);
    if (fa == 0.0) {
        result.root = a;
        result.f_root = fa;
        result.iter = 0;
        result.estim_prec = 0.0;
        return result;
    }

    tmpTheta(0) = b;
    lderResult = (*lderFP)(resp, tmpTheta, params, type);
    fb = lderResult(0);
    if (fb ==  0.0) {
        result.root = b;
        result.f_root = fb;
        result.iter = 0;
        result.estim_prec = 0.0;
        return result;
    }

    // Now search the range for a root
    c = a;
    fc = fa;

    for (int it = 0; it < (maxit + 1); it++) {
        double prev_step = b - a; // Distance from the last but one to the last approximation
        double tol_act;           // Actual tolerance

        // Interpolation step is calculated in the form p/q; division operations is delayed until the last moment
        double p;
        double q;

        double new_step; // Step at this iteration

        if (fabs(fc) < fabs(fb)) {
            // Swap data for b to be the best approximation
            a = b;  b = c;  c = a;
            fa=fb;  fb=fc;  fc=fa;
        }
        tol_act = 2 * DBL_EPSILON * fabs(b) + tol / 2;
        new_step = (c - b) / 2;

        if (fabs(new_step) <= tol_act || fb == 0.0) {
            // Acceptable approx. is found
            result.root = b;
            result.f_root = fb;
            result.iter = it;
            result.estim_prec = fabs(c - b);
            return result;
        }

        // Try interpolation
        if (fabs(prev_step) >= tol_act	// If prev_step was large enough
            && fabs(fa) > fabs(fb)) {	// and was in true direction
            double t1,cb,t2;
            cb = c-b;
            if (a == c) {
                // If we have only two distinct points linear interpolation can only be applied
                t1 = fb / fa;
                p = cb * t1;
                q = 1.0 - t1;
            }
            else {
                // Quadric inverse interpolation
                q = fa / fc;  t1 = fb / fc;	 t2 = fb / fa;
                p = t2 * (cb * q * (q - t1) - (b - a) * (t1 - 1.0));
                q = (q - 1.0) * (t1 - 1.0) * (t2 - 1.0);
            }

            // p was calculated with the opposite sign; make p positiv and assign possible minus to q
            if( p > 0.0 ) {
                q = -q;
            } else {
                p = -p;
            }

            if (p < (0.75 * cb * q - fabs(tol_act * q) / 2) // If b+p/q falls in [b,c]
                && p < fabs(prev_step * q / 2)) {	        // and isn't too large
                // it is accepted
                new_step = p/q;
            }
            // Otherwise, if p/q is too large then the bisection procedure can reduce [b,c] range to more extent
        }

        if (fabs(new_step) < tol_act) {
            // Adjust the step to be not less than tolerance
            if (new_step > 0.0) {
                new_step = tol_act;
            } else {
                new_step = -tol_act;
            }
        }

        // Save the previous approx.
        a = b;
        fa = fb;

        // Do step to a new approxim.
        b += new_step;
        tmpTheta(0) = b;
        lderResult = (*lderFP)(resp, tmpTheta, params, type);
        fb = lderResult(0);

        // Adjust c for it to have a sign opposite to that of b
        if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
            c = a;
            fc = fa;
        }
    }

    // failed!
    result.root = b;
    result.f_root = fb;
    result.iter = -1;
    result.estim_prec = fabs(c - b);
    return result;
}

struct Est_Result
{
    ArrayXd theta;
    ArrayXd info;
    ArrayXd sem;

    Est_Result() {}

    Est_Result(const Est_Result &r)
    {
        // allows Eigen optimizations not available with default copy constructor
        theta = r.theta;
        info = r.info;
        sem = r.sem;
    }
};

/**
 * Estimate ability from one or more sets of item responses
 *
 * Port of: wleEst.R
 *
 * @param resp        Item responses (N people x M responses) should be size 0 for FIType::EXPECTED
 * @param params      Parameters for M items (M x K matrix)
 * @param range       Range of abilities to explore (2 x 1)
 * @param type        ModelType::BRM or ModelType::GRM
 *
 * @return Est_Result with theta (Nx1), info (Nx1), and sem (Nx1) info
 */
const Est_Result wleEst( const Ref<const ArrayXXd>& resp, const Ref<const ArrayXXd>& params, const Ref<const RowVector2d>& range, ModelType type )
{
  //
  // Check arguments
  //

  // Make sure all responses are numeric
  if (!resp.isFinite().all()) {
      throw "wleEst infinite or non-numeric responses provided";
  }

  // Make sure all item parameters are numeric
  if (!params.isFinite().all()) {
      throw "wleEst infinite or non-numeric item parameters provided";
  }

  // Make sure dimensions of resp and params are compatible
  if (resp.cols() != params.rows()) {
      throw "wleEst dimension mismatch between responses and parameters";
  }

  // Make sure range is from negative to positive
  if (!(range(0) < 0 && range(1) > 0)) {
      throw "wleEst unsupported range provided";
  }

  ArrayXd est(resp.rows()); // vector of estimates
  ArrayXd d(resp.rows());   // vector of corrections
  Uniroot_Result ur_result;
  FI_Result fi_result;
  Est_Result result;
  const ArrayXd(*lderFunc)(const Ref<const ArrayXXd>&, const Ref<const ArrayXd>&, const Ref<const ArrayXXd>&, LderType);

  if (type == ModelType::GRM) {
      lderFunc = &lder1_grm;
  } else {
      lderFunc = &lder1_brm;
  }

  for (int i = 0; i < resp.rows(); i++) {
      ur_result = uniroot_lder1(lderFunc, range, resp.row(i), params, LderType::WLE);
      est(i) = ur_result.root;
      d(i) = ((*lderFunc)(resp.row(i), est.row(i), params, LderType::WLE) - (*lderFunc)(resp.row(i), est.row(i), params, LderType::MLE))(0);
  }

  // ensure results are capped to range
  est = est.min(range(1)).max(range(0));

  if (type == ModelType::BRM) {
      fi_result = FI_brm(params, est, FIType::OBSERVED, resp);
  } else {
      fi_result = FI_grm(params, est, FIType::OBSERVED, resp);
  }

  result.theta = est;
  result.info = fi_result.test;
  result.sem = ((result.info + d.square()) / result.info.square()).sqrt();

  return result;
}

/*******************************************
 *
 * Begin JavaScript Bridge
 *
 *******************************************/

const Vector VectorFromMatrix( const Ref<const ArrayXXd>& m )
{
    assert((m.rows() <= 1 || m.cols() <= 1) && "Matrix must be 0 or 1 dimensional");
    Vector res;
    for (int i = 0; i < m.rows(); i++) {
        for (int j = 0; j < m.cols(); j++) {
            res.push_back(m(i, j));
        }
    }
    return res;
}

// wrapper class for Eigen::Array to JS binding
class JSMatrix {
    using Mat = Array<double, Dynamic, Dynamic>;
    using Vector = std::vector<double>;
    using Vector2d = std::vector<std::vector<double>>;

public:
    Mat data;

    JSMatrix()
    {
        data = Mat();
    }

    JSMatrix(int m, int n)
    {
        data = Mat::Zero(m, n);
    }

    JSMatrix(const Mat &_data) : data(_data)
    {
    }

    JSMatrix(const JSMatrix &B) : data(B.copy())
    {
    }

    Mat copy() const
    {
        return data;
    }

    const Mat &toEigen() const
    {
        return data;
    }

    int rows() const
    {
        return (int)data.rows();
    }

    int cols() const
    {
        return (int)data.cols();
    }

    double get(int i, int j) const
    {
        return data(i, j);
    }

    void set(int i, int j, const double &s)
    {
        data(i, j) = s;
    }

    static JSMatrix fromVector(const Vector2d &v)
    {
        const size_t m = v.size();
        const size_t n = m > 0 ? v[0].size() : 0;
        Mat mat(m, n);
        for (size_t i = 0; i < m; i++) {
            assert(v[i].size() == n && "All the rows must have the same size");
            for (size_t j = 0; j < n; j++) {
                mat(i, j) = v[i][j];
            }
        }
        return mat;
    }
};

const JSMatrix embind_p_brm(const JSMatrix *theta, const JSMatrix *params)
{
  return JSMatrix(p_brm(theta->toEigen(), params->toEigen()));
}

const JSMatrix embind_p_grm(const JSMatrix *theta, const JSMatrix *params)
{
  return JSMatrix(p_grm(theta->toEigen(), params->toEigen()));
}

const JSMatrix embind_pder1_brm(const JSMatrix *theta, const JSMatrix *params)
{
  return JSMatrix(pder1_brm(theta->toEigen(), params->toEigen()));
}

const JSMatrix embind_pder1_grm(const JSMatrix *theta, const JSMatrix *params)
{
  return JSMatrix(pder1_grm(theta->toEigen(), params->toEigen()));
}

const JSMatrix embind_pder2_brm(const JSMatrix *theta, const JSMatrix *params)
{
  return JSMatrix(pder2_brm(theta->toEigen(), params->toEigen()));
}

const JSMatrix embind_pder2_grm(const JSMatrix *theta, const JSMatrix *params)
{
  return JSMatrix(pder2_grm(theta->toEigen(), params->toEigen()));
}

const Vector embind_lder1_brm(const JSMatrix *u, const JSMatrix *theta, const JSMatrix *params, LderType type)
{
  return VectorFromMatrix(lder1_brm(u->toEigen(), theta->toEigen(), params->toEigen(), type));
}

const Vector embind_lder1_grm(const JSMatrix *u, const JSMatrix *theta, const JSMatrix *params, LderType type)
{
  return VectorFromMatrix(lder1_grm(u->toEigen(), theta->toEigen(), params->toEigen(), type));
}

const JSMatrix embind_sel_prm(const JSMatrix *p, const JSMatrix *u, int K)
{
  return JSMatrix(sel_prm(p->toEigen(), u->toEigen(), K));
}

const JSMatrix embind_lder2_brm(const JSMatrix *u, const JSMatrix *theta, const JSMatrix *params)
{
  return JSMatrix(lder2_brm(u->toEigen(), theta->toEigen(), params->toEigen()));
}

const JSMatrix embind_lder2_grm(const JSMatrix *u, const JSMatrix *theta, const JSMatrix *params)
{
  return JSMatrix(lder2_grm(u->toEigen(), theta->toEigen(), params->toEigen()));
}

// wraps FI_Result Array properties into JSMatrix
struct JSFI_Result
{
    JSMatrix item;
    Vector test;
    Vector sem;
    FIType type;

    JSFI_Result() {}

    JSFI_Result(const FI_Result &r)
    {
        item = JSMatrix(r.item);
        test = VectorFromMatrix(r.test);
        sem = VectorFromMatrix(r.sem);
        type = r.type;
    }

    JSFI_Result(const JSFI_Result &r)
    {
        item = r.item;
        test = r.test;
        sem = r.sem;
        type = r.type;
    }
};

JSFI_Result embind_FI_brm(const JSMatrix *params, const JSMatrix *theta, FIType type, const JSMatrix *resp)
{
  return JSFI_Result(FI_brm(params->toEigen(), theta->toEigen(), type, resp->toEigen()));
}

JSFI_Result embind_FI_grm(const JSMatrix *params, const JSMatrix *theta, FIType type, const JSMatrix *resp)
{
  return JSFI_Result(FI_grm(params->toEigen(), theta->toEigen(), type, resp->toEigen()));
}

Uniroot_Result embind_uniroot_lder1(const JSMatrix *range, const JSMatrix *resp, const JSMatrix *params, LderType type, ModelType model)
{
    const ArrayXd (*lderFP)(const Ref<const ArrayXXd>&, const Ref<const ArrayXd>&, const Ref<const ArrayXXd>&, LderType);

    if (model == ModelType::BRM) {
        lderFP = &lder1_brm;
    } else {
        lderFP = &lder1_grm;
    }

    return uniroot_lder1(lderFP, RowVector2d(range->toEigen()), resp->toEigen(), params->toEigen(), type);
}

// wraps Est_Result Array properties into Vectors
struct JSEst_Result
{
    Vector theta;
    Vector info;
    Vector sem;

    JSEst_Result() {}

    JSEst_Result(const Est_Result &r)
    {
        theta = VectorFromMatrix(r.theta);
        info = VectorFromMatrix(r.info);
        sem = VectorFromMatrix(r.sem);
    }
};

JSEst_Result embind_wleEst(const JSMatrix *resp, const JSMatrix *params, const JSMatrix *range, ModelType type)
{
  return JSEst_Result(wleEst(resp->toEigen(), params->toEigen(), range->toEigen(), type));
}

EMSCRIPTEN_BINDINGS(Module)
{
    register_vector<double>("Vector");
    register_vector<std::vector<double>>("Vector2d");

    enum_<LderType>("LderType")
        .value("MLE", LderType::MLE)
        .value("WLE", LderType::WLE)
        ;

    enum_<FIType>("FIType")
        .value("EXPECTED", FIType::EXPECTED)
        .value("OBSERVED", FIType::OBSERVED)
        ;

    enum_<ModelType>("ModelType")
        .value("BRM", ModelType::BRM)
        .value("GRM", ModelType::GRM)
        ;

    value_object<JSFI_Result>("FI_Result")
        .field("item", &JSFI_Result::item)
        .field("test", &JSFI_Result::test)
        .field("sem", &JSFI_Result::sem)
        .field("type", &JSFI_Result::type)
        ;

    value_object<Uniroot_Result>("Uniroot_Result")
        .field("root", &Uniroot_Result::root)
        .field("f_root", &Uniroot_Result::f_root)
        .field("iter", &Uniroot_Result::iter)
        .field("estim_prec", &Uniroot_Result::estim_prec)
        ;

    value_object<JSEst_Result>("Est_Result")
        .field("theta", &JSEst_Result::theta)
        .field("info", &JSEst_Result::info)
        .field("sem", &JSEst_Result::sem)
        ;

    class_<JSMatrix>("Matrix")
        .constructor<int, int>()
        .constructor<const JSMatrix&>()
        .class_function("fromVector", &JSMatrix::fromVector)
        .function("rows", &JSMatrix::rows)
        .function("cols", &JSMatrix::cols)
        .function("get", &JSMatrix::get)
        .function("set", &JSMatrix::set)
        ;

    function("p_brm", &embind_p_brm, allow_raw_pointers());
    function("p_grm", &embind_p_grm, allow_raw_pointers());
    function("pder1_brm", &embind_pder1_brm, allow_raw_pointers());
    function("pder1_grm", &embind_pder1_grm, allow_raw_pointers());
    function("pder2_brm", &embind_pder2_brm, allow_raw_pointers());
    function("pder2_grm", &embind_pder2_grm, allow_raw_pointers());
    function("lder1_brm", &embind_lder1_brm, allow_raw_pointers());
    function("sel_prm", &embind_sel_prm, allow_raw_pointers());
    function("lder1_grm", &embind_lder1_grm, allow_raw_pointers());
    function("lder2_brm", &embind_lder2_brm, allow_raw_pointers());
    function("lder2_grm", &embind_lder2_grm, allow_raw_pointers());
    function("FI_brm", &embind_FI_brm, allow_raw_pointers());
    function("FI_grm", &embind_FI_grm, allow_raw_pointers());
    function("uniroot_lder1", &embind_uniroot_lder1, allow_raw_pointers());
    function("wleEst", &embind_wleEst, allow_raw_pointers());
}

/*******************************************
 *
 * End JavaScript Bridge
 *
 *******************************************/
