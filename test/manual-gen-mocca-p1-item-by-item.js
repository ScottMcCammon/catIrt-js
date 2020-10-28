#!/usr/bin/env node
'use strict';
const create_catirtlib = require('../dist/catirtlib');
const items = require('../data/mocca-items.json');

// simulated responses for examinees at various true thetas
const examinees = [
  { true_theta:-3,   responses:[0,1,1,0,1,1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,0,0] },
  { true_theta:-2,   responses:[0,1,1,0,1,0,0,0,0,0,1,0,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,1,0,0] },
  { true_theta:-1.5, responses:[0,0,0,1,0,0,0,1,0,1,1,0,0,1,0,0,0,1,0,1,0,1,1,1,0,0,0,1,0,1] },
  { true_theta:-1,   responses:[0,0,1,1,0,0,1,1,0,0,0,1,0,1,0,0,1,1,0,0,0,0,1,0,0,0,0,0,1,1] },
  { true_theta:-0.5, responses:[1,0,0,1,1,1,1,0,1,0] },
  { true_theta:0,    responses:[1,1,1,1,0,1,0,1,0,1,1,1,0] },
  { true_theta:0.5,  responses:[1,1,1,1,0,1,1,0,1,1,0,1,1,0] },
  { true_theta:1,    responses:[1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1] },
  { true_theta:1.5,  responses:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0,1,1,0,1] },
  { true_theta:2,    responses:[1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1] },
  { true_theta:3,    responses:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1] }
];

class MOCCACatP1 {
  // shared item bank for all instances, keyed by item id
  static itembank = new Map();

  // catirt library
  static catirt = null;

  /**
   * Resolves to true when class is ready for use
   */
  static async isReady() {
    if (this.catirt === null) {
      this.catirt = await create_catirtlib();
    }
    else if (typeof this.catirt.then === 'function') {
      await this.catirt;
    }
    return true;
  }

  /**
   * Initialize the item bank
   *
   * @param bank array of item objects, each in the form:
   *    { id: "<unique item ID>",
   *      p1params: [1.23, 0.34, 0.11],
   *      p2params: [0.87, -0.17, 1.62]
   *    }
   */
  static setItemBank(bank) {
    if (this.itembank.size > 0) {
      throw 'Item bank already set';
    }
    bank.forEach(item => {
      this.itembank.set(item.id, item.deepcopy());
    });
  }

  /**
   * Initialize instance state
   *
   * @param bank array of item objects, each in the form:
   */
  constructor() {
    this.responses = [];
    this.status = 'phase1';
    this.theta = 0.0;
    this.sem = NaN;
    this.nextItem = null;
    this.update();
  }

  /**
   * Determine if assessment is done or not
   *
   * @return bool true if done (complete or error)
   */
  isDone() {
    return this.status !== 'phase1';
  }

  /**
   * Add an item response
   *
   * @param resp Response object in the form: { id: "<unique item ID>", value: N }
   */
  addResponse(resp) {
    if (!this.nextItem || this.isDone()) {
      throw 'additional responses not allowed';
    }

    this.responses.push(resp.deepcopy());
    this.update();
  }

  /**
   * Update calculated state: theta, sem, status, nextItem
   */
  update() {
    this.updateTheta();
    this.updateStatus();
    this.updateNextItem();
  }

  /**
   * Update estimated theta from item responses
   */
  updateTheta() {
    const resp = this.responses.map(r => r.value);
    const params = this.responses.map(r => this.constructor.itembank.get(r.id).p1params);
    if (params.length) {
      // limit ability estimate to a smaller range when just 1 item answered
      const range = (params.length === 1 ? [-3.0, 3.0] : [-4.5, 4.5]);

      // calculate theta1/sem
      const est = this.constructor.catirt.wleEst_brm_one(resp, params, range);
      if (est.error) {
        this.status = 'wleEst_brm_one error: ' + est.error;
      }
      else {
        this.theta = est.theta;
        this.sem = est.sem;
      }
    }
    else {
      this.theta = 0.0;
      this.sem = NaN;
    }
  }

  /**
   * Update assessment status
   */
  updateStatus() {
    if (this.status === 'phase1') {
      // phase1 termination rules
      // - terminate if max number of items given (30)
      // - terminate if min number of items given (10) AND theta1 estimate is precise enough (sem <= 0.30)
      if (this.responses.length >= 30 || (this.responses.length >= 10 && this.sem <= 0.30)) {
        this.status = 'done';
      }
    }
  }

  /**
   * Choose next item for administration
   */
  updateNextItem() {
    if (this.status === 'phase1') {
      // items to choose from 
      const seenSet = new Set(this.responses.map(r => r.id));
      const fromItems = [...this.constructor.itembank.keys()]   // array of all item IDs
                          .filter(id => !seenSet.has(id)) // filtered for those not seen
                          .map(id => ({id, params: this.constructor.itembank.get(id)['p1params']})); // transformed to item object with desired params

      // choose the single best item
      const sel = this.constructor.catirt.itChoose(fromItems, 'brm', 'UW-FI', 'theta', {cat_theta: this.theta});

      if (sel.error) {
        this.nextItem = null;
        this.status = 'itChoose error: ' + sel.error;
      }
      else {
        this.nextItem = sel.items[0]['id'];
      }
    }
    else {
      this.nextItem = null;
    }
  }
}

// generate item-by-item data for each examinee
(async () => {
  await MOCCACatP1.isReady();
  MOCCACatP1.setItemBank(items);

  console.log('id_true_theta,item_selected,input_response,output_est_theta,output_sem');

  for (let i = 0; i < examinees.length; i++) {
    const examinee = examinees[i];
    const cat = new MOCCACatP1();

    for (let n = 0; n < examinee.responses.length; n++) {
      const item = cat.nextItem;
      const resp = examinee.responses[n];

      cat.addResponse({ id: item, value: resp });

      console.log(`${examinee.true_theta},${item},${resp},${cat.theta},${cat.sem}`);

      if (cat.isDone()) {
        break;
      }
    }
  }
})();
