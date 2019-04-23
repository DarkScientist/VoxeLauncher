import Vue from 'vue';
import Vuex from 'vuex';
import fs from 'fs-extra';
import storeTemplate from '../../src/universal/store';

Vue.config.devtools = false;
Vue.config.productionTip = false;

// require all test files (files that ends with .spec.js)
const testsContext = require.context('./specs', true, /\.spec\.js$/);
testsContext.keys().forEach(testsContext);

// require all src files except main.js for coverage.
// you can also change this to match only the subset of files that
// you want coverage for.
// const srcContext = require.context('../../src/universal', true, /^\.js$/);
// srcContext.keys().forEach(srcContext);

fs.emptyDirSync('temp');

beforeEach(function () {
    this.store = undefined;
    const template = { ...storeTemplate, state: { root: 'temp' } };
    this.store = new Vuex.Store(template);
});
