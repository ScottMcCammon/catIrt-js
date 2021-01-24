#!/usr/bin/env node
'use strict';
const catirt_load = require('../dist/catirt');
const itembank = require('../data/mocca-items.json');

// responses of simulees at various true thetas
const simulees = [
  { id: 1,  true_theta1:-2, true_theta2:-2, responses:[1,0,0,2,1,1,0,0,0,0,1,0,1,1,0,0,0,1,1,1,0,0,0,2,0,2,1,0,1,1,0,0,2,0,0,1,1,0,1,1] },
  { id: 2,  true_theta1:-2, true_theta2:-1, responses:[1,0,1,2,0,0,0,0,2,0,0,2,2,1,0,1,2,0,2,2,0,0,1,0,0,2,0,0,2,2,2,0,1,0,2,0,0,2,1,1] },
  { id: 3,  true_theta1:-2, true_theta2: 0, responses:[0,2,2,0,2,1,2,0,1,0,1,1,2,0,1,2,2,2,2,1,2,1,2,0,0,0,1,0,2,0,0,0,2,2,1,2,1,0,2,0] },
  { id: 4,  true_theta1:-2, true_theta2: 1, responses:[1,2,0,1,0,1,2,2,0,2,1,2,2,1,1,2,1,2,2,1,2,0,2,2,2,2,2,1,1,2,2,2,2,2,2,0,0,0,1,2] },
  { id: 5,  true_theta1:-2, true_theta2: 2, responses:[2,2,2,1,1,2,1,2,2,2,2,1,1,2,1,1,2,2,1,2,2,0,2,2,2,1,1,2,1,1,2,2,2,2,2,1,2,2,1,2] },
  { id: 6,  true_theta1:-1, true_theta2:-2, responses:[2,0,0,1,1,1,0,0,0,1,0,1,0,0,1,1,1,0,0,1,1,1,0,0,0,2,1,1,2,2,0,2,1,0,0,1,1,0,2,0] },
  { id: 7,  true_theta1:-1, true_theta2:-1, responses:[1,0,1,2,0,1,1,0,0,1,2,1,0,1,1,0,2,1,1,0,1,1,1,0,1,2,0,0,0,2,0,2,0,0,0,2,0,2,1,2] },
  { id: 8,  true_theta1:-1, true_theta2: 0, responses:[1,0,2,1,1,2,1,1,2,1,2,2,1,0,2,1,2,1,1,1,0,2,1,1,1,2,1,1,0,2,0,2,2,1,1,0,2,2,0,2] },
  { id: 9,  true_theta1:-1, true_theta2: 1, responses:[2,1,2,1,1,1,2,1,1,2,1,1,1,2,2,1,1,2,1,0,2,0,2,1,2,2,1,1,2,1,2,2,1,1,2,1,0,1,2,1] },
  { id: 10, true_theta1:-1, true_theta2: 2, responses:[1,1,2,2,2,1,2,1,2,1,2,1,1,2,1,2,1,2,1,1,1,2,1,1,2,2,1,1,2,0,2,2,2,2,0,1,1,2,1,2] },
  { id: 11, true_theta1: 0, true_theta2:-2, responses:[1,1,0,1,1,1,0,1,1,0,0,1,1,1,1,1,1,0,1,0,1,0,1,1,1,0,2,1,0,1,1,2,1,0,1,1,1,1,0,2] },
  { id: 12, true_theta1: 0, true_theta2:-1, responses:[1,1,0,1,1,1,0,1,1,0,1,1,1,1,1,2,1,0,1,1,0,1,1,0,1,1,1,2,1,1,1,1,0,1,1,2,1,0,0,0] },
  { id: 13, true_theta1: 0, true_theta2: 0, responses:[1,1,1,1,1,1,2,0,1,0,0,1,1,2,1,1,0,1,1,1,2,1,1,2,1,1,2,1,1,1,1,2,1,1,1,2,0,2,2,1] },
  { id: 14, true_theta1: 0, true_theta2: 1, responses:[1,1,0,1,1,1,2,2,1,1,1,1,2,1,1,1,1,1,1,2,1,2,1,0,1,1,2,1,1,2,0,2,2,1,0,1,1,1,2,2] },
  { id: 15, true_theta1: 0, true_theta2: 2, responses:[1,2,1,1,1,1,2,1,1,0,2,1,1,2,1,1,1,1,2,1,2,2,1,1,1,1,2,2,1,1,1,1,2,1,1,1,1,1,2,1] },
  { id: 16, true_theta1: 1, true_theta2:-2, responses:[1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1] },
  { id: 17, true_theta1: 1, true_theta2:-1, responses:[1,1,1,1,1,1,1,1,1,2,1,1,1,0,1,1,1,1,1,1,2,2,0,0,1,1,1,0,1,1,1,1,0,1,2,0,1,1,1,2] },
  { id: 18, true_theta1: 1, true_theta2: 0, responses:[1,1,1,1,2,1,1,0,1,1,2,1,2,1,0,1,1,1,1,1,2,1,2,1,1,1,2,1,2,1,1,1,2,1,2,1,0,2,1,1] },
  { id: 19, true_theta1: 1, true_theta2: 1, responses:[1,1,1,1,1,1,2,1,1,1,1,1,0,1,2,2,1,1,1,1,1,2,0,1,1,1,1,2,1,1,2,1,2,1,0,1,1,1,1,1] },
  { id: 20, true_theta1: 1, true_theta2: 2, responses:[1,1,1,1,1,1,1,1,2,1,1,1,1,1,2,2,1,1,1,1,1,1,1,2,2,1,2,1,1,0,1,1,1,2,2,0,2,1,2,1] },
  { id: 21, true_theta1: 2, true_theta2:-2, responses:[1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1] },
  { id: 22, true_theta1: 2, true_theta2:-1, responses:[1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1] },
  { id: 23, true_theta1: 2, true_theta2: 0, responses:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1] },
  { id: 24, true_theta1: 2, true_theta2: 1, responses:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1] },
  { id: 25, true_theta1: 2, true_theta2: 2, responses:[1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1] },
];

class BaseCAT {
  // catirt library
  static catirt = null;

  // registry of CAT models
  static _cats = {};

  // item bank (Map) for each registered model. Each bank Map is keyed by item id
  static _itembanks = {};

  // add a CAT model class to the registery
  static register() {
    if (!(this.prototype instanceof BaseCAT)) {
      throw 'Cannot register non-subclass of BaseCAT';
    }
    this._cats[this.name] = this;
    this._itembanks[this.name] = new Map();
  }

  // determine if a CAT model class is registered in the registery
  static hasModelClass(model) {
    return this._cats.hasOwnProperty(model);
  }

  // fetch CAT model class from the registry
  static getModelClass(model) {
    return this._cats[model];
  }

  // create an instance of a CAT model, initialized with phase1 and/or phase2 responses
  static newCatModel(model, p1resp=[], p2resp=[]) {
    const clsModel = this.getModelClass(model);
    if (clsModel) {
      return new clsModel(p1resp, p2resp);
    }
    throw `CAT model not found: '${model}'`;
  }

  // clear cached item bank for the calling CAT model class
  static clearItemBank() {
    if (this.hasItemBank) {
      this._itembanks[this.name] = new Map();
    }
  }

  /**
   * Set the item bank cache for the calling CAT model class
   *
   * @param new_bank array of item objects, each in the form:
   *    { id: "<unique item ID>",
   *      p1params: [1.23, 0.34, 0.11],
   *      p2params: [0.87, -0.17, 1.62]
   *    }
   */
  static setItemBank(new_bank) {
    if (!this.hasItemBank) {
      throw `Item bank not registered for CAT model: '${this.name}'`;
    }
    if (this.itemBank.size > 0) {
      throw 'Item bank already set';
    }
    new_bank.forEach(item => {
      this.itemBank.set(item.id, item.deepcopy());
    });
  }

  /**
   * Resolves to true when class is ready for use
   */
  static async isReady() {
    if (this.catirt === null) {
      this.catirt = await catirt_load();
    }
    else if (typeof this.catirt.then === 'function') {
      await this.catirt;
    }
    return true;
  }

  /**
   * Constructor
   *
   * @param p1responses array of phase1 response objects
   * @param p2responses array of phase2 response objects
   *
   * Currently response objects expected to be in the form:
   *    { id: "<unique item ID>", value: N }
   *
   *  where N is "1" for an elaborator response, "2" for a correct response, and "3" for a paraphraser response
   */
  constructor(p1responses=[], p2responses=[]) {
    if (p2responses.length && !p1responses.length) {
      throw 'cannot initialize phase2 responses without phase1 responses';
    }
    this._p1resp = p1responses.deepcopy();
    this._p2resp = p2responses.deepcopy();
    this._seenItems = new Set(this._p1resp.concat(this._p2resp).map(r => r.id));
    this._status = 'unknown';
    this._theta = [NaN, NaN];
    this._sem = [NaN, NaN];
    this._nextItem = null;
    this.update();
  }

  /**
   * Determine if assessment is in phase1
   *
   * @return bool true if in phase1
   */
  inPhase1() {
    return this._status === 'phase1';
  }

  /**
   * Determine if assessment is in phase2
   *
   * @return bool true if in phase2
   */
  inPhase2() {
    return this._status === 'phase2';
  }

  /**
   * Determine if assessment is done or not
   *
   * @return bool true if done (complete or error)
   */
  isDone() {
    return (this.status !== 'unknown' && this.status !== 'phase1' && this.status !== 'phase2');
  }

  /**
   * Add an item response with value N=0 for elaborator, N=1 for correct, or N=2 for paraphraser
   *
   * @param resp Response object in the form: { id: "<unique item ID>", value: N }
   */
  addResponse(resp) {
    if (!(this.nextItem && !this.isDone())) {
      throw 'additional responses not allowed';
    }
    if (this._seenItems.has(resp.id)) {
      throw `a response to item ${resp.id} has already been recorded`;
    }
    if (resp.id !== this.nextItem) {
      console.warn('warning: adding response that does not match next item!');
    }

    if (this.inPhase1()) {
      this._p1resp.push(resp.deepcopy());
    }
    else if (this.inPhase2()) {
      this._p2resp.push(resp.deepcopy());
    }
    else {
      throw `unexpected status encountered: ${this.status}`;
    }

    this._seenItems.add(resp.id);
    this.update();
  }

  /**
   * Update calculated state: theta, sem, status, nextItem
   */
  update() {
    this.updateTheta();
    this.updateStatusAndTransition();
    this.chooseNextItem();
  }

  /**
   * Update estimated theta values from item responses
   */
  updateTheta() {
    throw 'Subclasses must override abstract updateTheta()';
  }

  /**
   * Update assessment status and category
   */
  updateStatusAndTransition() {
    throw 'Subclasses must override abstract updateStatusAndTransition()';
  }

  chooseNextItem() {
    throw 'Subclasses must override abstract chooseNextItem()';
  }

  ////////////////////
  //
  // Getters
  //

  get catirt() {
    return this.constructor.catirt;
  }

  // determine if a CAT model class has an item bank available
  static get hasItemBank() {
    return this._itembanks.hasOwnProperty(this.name);
  }

  // get the cached item bank for the calling CAT model class
  static get itemBank() {
    return this._itembanks[this.name];
  }

  // itemBank getter for instances
  get itemBank() {
    return this.constructor.itemBank;
  }

  get lengthPhase1() {
    return this._p1resp.length;
  }

  get lengthPhase2() {
    return this._p2resp.length;
  }

  get lengthTotal() {
    return this._p1resp.length + this._p2resp.length;
  }

  get status() {
    return this._status;
  }

  get phase1Responses() {
    // convert to binary response values
    return this._p1resp.map(r => (r.value === 1 ? 1 : 0));
  }

  get phase2Responses() {
    // use responses from both phase1 and phase2, converting for BRM
    return this._p1resp.concat(this._p2resp).map(r => {
      if (r.value == 0) {
        return 0;
      }
      if (r.value == 2) {
        return 1;
      }
      return NaN;
    });
  }

  get phase1Params() {
    return this._p1resp.map(r => this.constructor.itemBank.get(r.id).p1params);
  }

  get phase2Params() {
    // use responses from both phase1 and phase2
    return this._p1resp.concat(this._p2resp).map(r => this.constructor.itemBank.get(r.id).p2params);
  }

  get theta() {
    return this._theta;
  }

  get sem() {
    return this._sem;
  }

  get category() {
    return this._category;
  }

  get nextItem() {
    return this._nextItem;
  }
}

class Pilot1 extends BaseCAT {
  static constants = {
    PHASE1_LENGTH:     25,
    PHASE2_LENGTH:     15,
    THETA_LIMIT_RANGE: [-4.5, 4.5],
    TERM_GLR_OPTIONS:  {
      range:      [-4.5, 4.5],
      bounds:     [0],
      categories: [0, 2],
      delta:      0.5,
      alpha:      0.1,
      beta:       0.1,
    },
  };

  get constants() {
    return this.constructor.constants;
  }

  /**
   * Update estimated theta values from item responses
   */
  updateTheta() {
    const c = this.constants; // to improve readability

    // update theta1 using responses and params from just phase1
    if (this.lengthPhase1) {
      const est = this.catirt.wleEst_brm_one(this.phase1Responses, this.phase1Params, c.THETA_LIMIT_RANGE);

      if (!!est && est.error) {
        this._theta[0] = NaN;
        this._sem[0] = NaN;
        this._status += ': wleEst_brm_one error: ' + est.error;
      }
      else {
        this._theta[0] = est.theta;
        this._sem[0] = est.sem;
      }
    }
    // no responses applicable to theta1
    else {
      this._theta[0] = 0.0;
      this._sem[0] = NaN;
    }

    // update theta2 using responses from both phase1 and phase2
    if (this.lengthTotal) {
      const est = this.catirt.wleEst_brm_one(this.phase2Responses, this.phase2Params, c.THETA_LIMIT_RANGE);

      if (!!est && est.error) {
        this._theta[1] = NaN;
        this._sem[1] = NaN;
        this._status += ': wleEst_brm_one error: ' + est.error;
      }
      else {
        this._theta[1] = est.theta;
        this._sem[1] = est.sem;
      }

      // phase2 classification
      let category = 'ID';
      if (Number.isFinite(this._theta[1])) {
        const ctg = this.catirt.termGLR_one(this.phase2Params, this.phase2Responses, 'brm', c.TERM_GLR_OPTIONS);
        if (!!ctg && ctg.error) {
          category = ctg.error;
        }
        else if (ctg !== null) {
          category = ctg;
        }
      }
      this._category = category;
    }
    // no responses applicable to theta2
    else {
      this._theta[1] = 0.0;
      this._sem[1] = NaN;
      this._category = 'ID';
    }
  }

  /**
   * Update assessment status and category
   */
  updateStatusAndTransition() {
    const c = this.constants; // to improve readability

    if (this.status === 'unknown') {
      this._status = 'phase1';
    }

    if (this.status === 'phase1') {
      // Phase1 termination rules:
      // - terminate when fixed number of items given
      let transition = false;
      if (this.lengthPhase1 >= c.PHASE1_LENGTH) {
        transition = true;
      }

      // Phase1 transition rules:
      // - always transition to phase2
      if (transition) {
        this._status = 'phase2';
      }
    }

    if (this.status === 'phase2') {
      // Phase2 termination rules:
      // - terminate fixed number of items given
      let transition = false;
      if (this.lengthPhase2 >= c.PHASE2_LENGTH) {
          transition = true;
      }

      // Phase2 transition rules:
      // - always transition to done
      if (transition) {
        this._status = 'done';
      }
    }
  }

  chooseNextItem() {
    if (!this.isDone()) {
      // selection parameters that vary between phase1 and phase2
      const paramsType = (this.inPhase1() ? 'p1params' : 'p2params');
      const infoType = (this.inPhase1() ? 'UW-FI' : 'UW-FI-Modified');
      const cat_theta = (this.inPhase1() ? this.theta[0] : this.theta[1]);

      // items to choose from
      const fromItems = [...this.itemBank.keys()]                 // array of all item IDs
                          .filter(id => !this._seenItems.has(id)) // filtered for those not seen
                          .map(id => ({id, params: this.itemBank.get(id)[paramsType]})); // transformed to item object with desired params

      // phase1 info needed for phase2 item selection
      const phase1_est_theta = this.theta[0];
      const phase1_params = (this.inPhase1() ? null : fromItems.map(it => this.itemBank.get(it.id).p1params));

      // choose the single best item
      const sel = this.catirt.itChoose(fromItems, 'brm', infoType, 'theta', {cat_theta, phase1_est_theta, phase1_params});

      if (!!sel && sel.error) {
        this._nextItem = null;
        this._status += ': itChoose error: ' + sel.error;
      }
      else if (!sel.items.length) {
        this._nextItem = null;
        this._status += ': no item returned by itChoose';
      }
      else if (!this.itemBank.has( sel.items[0]['id'] )) {
        this._nextItem = null;
        this._status += ': invalid item returned by itChoose';
      }
      else {
        this._nextItem = sel.items[0]['id'];
      }
    }
    else {
      this._nextItem = null;
    }
  }
}
Pilot1.register();

// generate item-by-item data for each simulee
(async () => {
  // initialize CAT model
  await BaseCAT.isReady();
  Pilot1.setItemBank(itembank);

  if (process.argv.length != 3 || !['--classify', '--item-by-item'].includes(process.argv[2])) {
    console.warn(`usage: node ${process.argv[1]} [--classify | --item-by-item]`);
    process.exit(1);
  }
  const item_by_item = process.argv[2] === '--classify' ? false : true;

  // output header
  if (item_by_item) {
    console.log('id,theta1,theta2,item_selected,input_response,input_response2,output_est_theta2,output_sem');
  }
  else {
    console.log('id,theta1,theta2,output_est_theta2,output_sem,output_classification');
  }

  // translation map from "input_response2" to "input_response"
  const respmap = {
    0: 0,
    1: 'NA',
    2: 1,
  };

  // start a new CAT instance foreach simulee
  for (let i = 0; i < simulees.length; i++) {
    const simulee = simulees[i];
    const cat = BaseCAT.newCatModel('Pilot1');

    // add each response to the CAT instance and output an line
    for (let n = 0; n < simulee.responses.length; n++) {
      const item = cat.nextItem;
      const resp2 = simulee.responses[n];
      const resp = respmap[resp2];

      try {
        cat.addResponse({ id: item, value: resp2 });
      }
      catch (e) {
        // should never get here
        console.warn(`Exception caught: ${e}`);
        process.exit(1);
      }

      if (item_by_item) {
        console.log(`${simulee.id},${simulee.true_theta1},${simulee.true_theta2},${item},${resp},${resp2},${cat.theta[1]},${cat.sem[1]}`);
      }

      if (cat.isDone()) {
        if ((n + 1) < simulee.responses.length) {
          // should never get here
          console.warn(`DONE after only ${n+1} responses for simulee(${simulee.id}). status: ${cat.status}`);
        }
        if (!item_by_item) {
          console.log(`${simulee.id},${simulee.true_theta1},${simulee.true_theta2},${cat.theta[1]},${cat.sem[1]},${cat.category}`);
        }
        break;
      }
    }
    if (!cat.isDone()) {
      // should never get here
      console.warn(`NOT DONE after processing all responses for simulee(${simulees[i].id})`);
    }
  }
})();
