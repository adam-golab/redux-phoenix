(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('lodash'), require('moment')) :
  typeof define === 'function' && define.amd ? define(['exports', 'lodash', 'moment'], factory) :
  (factory((global['redux-phoenix'] = {}),global._,global.moment));
}(this, (function (exports,_,moment) { 'use strict';

  _ = _ && _.hasOwnProperty('default') ? _['default'] : _;
  moment = moment && moment.hasOwnProperty('default') ? moment['default'] : moment;

  var toConsumableArray = function (arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    } else {
      return Array.from(arr);
    }
  };

  var REHYDRATE = '@@REHYDRATE';

  /**
   * transform state according to passed transformation
   *
   * @param {object} map transformation
   * @param {object} state State from redux
   * @return {object} Transformed state
   */
  function transform(map, state) {
    var result = {};
    _.forEach(map, function (value, key) {
      if (typeof value === 'function') {
        var transformation = value(key, _.get(state, key), state);
        if (transformation.targetKey && _.has(transformation, 'targetValue')) {
          _.set(result, transformation.targetKey, transformation.targetValue);
        }
        if (_.has(transformation, 'sourceValue')) {
          _.set(result, key, transformation.sourceValue);
        }
      } else {
        _.set(result, value, _.get(state, key));
      }
    });
    return _.merge({}, state, result);
  }

  /**
   * Persist store
   *
   * @export
   * @param {object} store Redux Store
   * @param {object} config Configuration object
   * @return {Promise<object>} Persisted Store
   */
  function persistStore(store) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$key = _ref.key,
        key = _ref$key === undefined ? 'redux' : _ref$key,
        _ref$whitelist = _ref.whitelist,
        whitelist = _ref$whitelist === undefined ? null : _ref$whitelist,
        _ref$blacklist = _ref.blacklist,
        blacklist = _ref$blacklist === undefined ? null : _ref$blacklist,
        _ref$storage = _ref.storage,
        storage = _ref$storage === undefined ? window.localStorage : _ref$storage,
        _ref$expireDate = _ref.expireDate,
        expireDate = _ref$expireDate === undefined ? null : _ref$expireDate,
        _ref$serialize = _ref.serialize,
        serialize = _ref$serialize === undefined ? JSON.stringify : _ref$serialize,
        _ref$deserialize = _ref.deserialize,
        deserialize = _ref$deserialize === undefined ? JSON.parse : _ref$deserialize,
        _ref$map = _ref.map,
        map = _ref$map === undefined ? {} : _ref$map,
        _ref$disabled = _ref.disabled,
        disabled = _ref$disabled === undefined ? false : _ref$disabled,
        _ref$throttle = _ref.throttle,
        throttle = _ref$throttle === undefined ? 0 : _ref$throttle;

    return Promise.resolve(storage.getItem(key)).then(function (persistedJson) {
      var _moment;

      if (disabled) {
        return store;
      }
      var persistedValue = deserialize(persistedJson);

      var _ref2 = persistedValue || {},
          persistedState = _ref2.persistedState,
          saveDate = _ref2.saveDate;

      var state = persistedState;
      if (expireDate && (_moment = moment(saveDate)).add.apply(_moment, toConsumableArray(expireDate)).isBefore(moment())) {
        state = {};
      }
      var persistedStateToMerge = whitelist ? _.omit(_.pick(state, whitelist), blacklist) : _.omit(state, blacklist);

      store.dispatch({
        type: REHYDRATE,
        payload: persistedStateToMerge
      });

      var saveState = function saveState() {
        var state = transform(map, store.getState());
        var subset = whitelist ? _.omit(_.pick(state, whitelist), blacklist) : _.omit(state, blacklist);

        storage.setItem(key, serialize({ persistedState: subset, saveDate: moment().valueOf() }));
      };

      var throttledSubscribe = _.throttle(saveState, throttle, {
        trailing: true
      });
      store.subscribe(throttle > 0 ? throttledSubscribe : saveState);
      return store;
    });
  }

  /**
   * Enhancer
   *
   * @export
   * @param {function} next callback
   * @return {function} enhancer
   */
  var autoRehydrate = function autoRehydrate(next) {
    return function (reducer, initialState, enhancer) {
      if (typeof initialState === 'function' && typeof enhancer === 'undefined') {
        enhancer = initialState;
        initialState = undefined; // eslint-disable-line no-undefined
      }
      function rehydrateReducer(state, action) {
        if (action.type === REHYDRATE) {
          return reducer(_.merge({}, state, action.payload), action);
        }
        return reducer(state, action);
      }
      return next(rehydrateReducer, initialState, enhancer);
    };
  };

  exports.REHYDRATE = REHYDRATE;
  exports.default = persistStore;
  exports.autoRehydrate = autoRehydrate;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=redux-phoenix.js.map
