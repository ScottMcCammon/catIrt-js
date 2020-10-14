#include <Eigen/Core>
#include <emscripten/emscripten.h>
#include <emscripten/bind.h>

enum class LderType {
    MLE,
    WLE
};

enum class FIType {
    EXPECTED,
    OBSERVED
};

using namespace emscripten;

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
 * Derivative of the item probability matrix for person(s) with given ability estimates
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
 * 2nd derivative of the item probability matrix for person(s) with given ability estimates
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
const ArrayXd lder1_brm( const Ref<const ArrayXXd>& u, const Ref<const ArrayXd>& theta, const Ref<const ArrayX3d>& params, LderType ltype )
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
      H.block(0, j, N, 1) /= (2 * I);
    }

    lder1 += H;
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
 * Fisher Information of items for given ability estimates and optional responses (for OBSERVED info)
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

/*******************************************
 *
 * Begin JavaScript Bridge
 *
 *******************************************/

#ifdef __cplusplus
extern "C" {
#endif

double* EMSCRIPTEN_KEEPALIVE js_p_brm(double *theta, int thetaSize, double *params, int paramsSize)
{
  Map<const ArrayXd> thetaMap(theta, thetaSize);
  Map<const Array<double, Dynamic, 3, RowMajor> > paramsMap(params, paramsSize/3, 3);
  ArrayXXd p = p_brm(thetaMap, paramsMap);
  double *res = (double *)calloc(p.size(), sizeof(double));
  int i = 0;

  for (int m = 0; m < p.rows(); m++) {
    for (int n = 0; n < p.cols(); n++) {
      res[i++] = p(m, n);
    }
  }
  return res;
}

double* EMSCRIPTEN_KEEPALIVE js_pder1_brm(double *theta, int thetaSize, double *params, int paramsSize)
{
  Map<const ArrayXd> thetaMap(theta, thetaSize);
  Map<const Array<double, Dynamic, 3, RowMajor> > paramsMap(params, paramsSize/3, 3);
  ArrayXXd p = pder1_brm(thetaMap, paramsMap);
  double *res = (double *)calloc(p.size(), sizeof(double));
  int i = 0;

  for (int m = 0; m < p.rows(); m++) {
    for (int n = 0; n < p.cols(); n++) {
      res[i++] = p(m, n);
    }
  }
  return res;
}

double* EMSCRIPTEN_KEEPALIVE js_pder2_brm(double *theta, int thetaSize, double *params, int paramsSize)
{
  Map<const ArrayXd> thetaMap(theta, thetaSize);
  Map<const Array<double, Dynamic, 3, RowMajor> > paramsMap(params, paramsSize/3, 3);
  ArrayXXd p = pder2_brm(thetaMap, paramsMap);
  double *res = (double *)calloc(p.size(), sizeof(double));
  int i = 0;

  for (int m = 0; m < p.rows(); m++) {
    for (int n = 0; n < p.cols(); n++) {
      res[i++] = p(m, n);
    }
  }
  return res;
}

double* EMSCRIPTEN_KEEPALIVE js_lder1_brm(double *u, int uSize, double *theta, int thetaSize, double *params, int paramsSize, int useWLE)
{
  Map<const ArrayXd> thetaMap(theta, thetaSize);
  Map<const Array<double, Dynamic, 3, RowMajor> > paramsMap(params, paramsSize/3, 3);
  Map<const Array<double, Dynamic, Dynamic, RowMajor> > uMap(u, thetaSize, uSize / thetaSize);
  ArrayXd l = lder1_brm(uMap, thetaMap, paramsMap, (useWLE ? LderType::WLE : LderType::MLE));
  double *res = (double *)calloc(l.size(), sizeof(double));
  int i = 0;

  for (int m = 0; m < l.rows(); m++) {
    res[i++] = l(m, 0);
  }
  return res;
}

double* EMSCRIPTEN_KEEPALIVE js_lder2_brm(double *u, int uSize, double *theta, int thetaSize, double *params, int paramsSize)
{
  Map<const ArrayXd> thetaMap(theta, thetaSize);
  Map<const Array<double, Dynamic, 3, RowMajor> > paramsMap(params, paramsSize/3, 3);
  Map<const Array<double, Dynamic, Dynamic, RowMajor> > uMap(u, thetaSize, uSize / thetaSize);
  ArrayXXd l = lder2_brm(uMap, thetaMap, paramsMap);
  double *res = (double *)calloc(l.size(), sizeof(double));
  int i = 0;

  for (int m = 0; m < l.rows(); m++) {
    for (int n = 0; n < l.cols(); n++) {
      res[i++] = l(m, n);
    }
  }
  return res;
}

#ifdef __cplusplus
}
#endif

// wrapper class for Eigen::Array to JS binding
class JSMatrix {
    using Mat = Eigen::Array<double, Dynamic, Dynamic>;
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

// wraps FI_Result Array properties into JSMatrix
struct JSFI_Result
{
    JSMatrix item;
    JSMatrix test;
    JSMatrix sem;
    FIType type;

    JSFI_Result() {}

    JSFI_Result(const FI_Result &r)
    {
        item = JSMatrix(r.item);
        test = JSMatrix(r.test);
        sem = JSMatrix(r.sem);
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

EMSCRIPTEN_BINDINGS(Module)
{
    register_vector<double>("Vector");
    register_vector<std::vector<double>>("Vector2d");

    enum_<FIType>("FIType")
        .value("EXPECTED", FIType::EXPECTED)
        .value("OBSERVED", FIType::OBSERVED)
        ;

    value_object<JSFI_Result>("FI_Result")
        .field("item", &JSFI_Result::item)
        .field("test", &JSFI_Result::test)
        .field("sem", &JSFI_Result::sem)
        .field("type", &JSFI_Result::type)
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

    function("FI_brm", &embind_FI_brm, allow_raw_pointers());
}

/*******************************************
 *
 * End JavaScript Bridge
 *
 *******************************************/
