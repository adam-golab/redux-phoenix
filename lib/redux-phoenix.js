(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('lodash'), require('moment')) :
  typeof define === 'function' && define.amd ? define(['exports', 'lodash', 'moment'], factory) :
  (global = global || self, factory(global['redux-phoenix'] = {}, global._, global.moment));
}(this, function (exports, _, moment) { 'use strict';

  _ = _ && _.hasOwnProperty('default') ? _['default'] : _;
  moment = moment && moment.hasOwnProperty('default') ? moment['default'] : moment;

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

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
   * get number of migrations that have been previously applied
   *
   * @param {array} appliedMigrations names of migrations that has been succesfully applied
   * @param {*} migrationsToApply list of migrations that should be run
   * @return {number} number of migrations that have been previously applied
   */


  function getNumberOfAppliedMigrations(appliedMigrations, migrationsToApply) {
    var _appliedMigrations$re = appliedMigrations.reduce(function (result, migrationName, index) {
      if (result.isDifferent) {
        return result;
      }

      if (migrationsToApply[index] && migrationsToApply[index].name === migrationName) {
        return {
          index: result.index + 1,
          isDifferent: false
        };
      }

      return {
        index: result.index,
        isDifferent: true
      };
    }, {
      index: 0,
      isDifferent: false
    }),
        index = _appliedMigrations$re.index;

    return index;
  }
  /**
   * get functions from migrations list that should be run before rehydrating
   *
   * @param {array} appliedMigrations names of migrations that has been succesfully applied
   * @param {array} migrations list of migrations that should be run on old versions of state
   * @return {array} array of functions from migrations that should be run
   */


  function getMigrationsToRun() {
    var appliedMigrations = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    var migrations = arguments.length > 1 ? arguments[1] : undefined;
    var migrationsToApply = migrations.filter(function (migration) {
      return migration.up && migration.name;
    });
    var numberOfAppliedMigrations = getNumberOfAppliedMigrations(appliedMigrations, migrationsToApply);
    var migrationsToRevert = appliedMigrations.slice(numberOfAppliedMigrations).reverse().map(function (migrationName) {
      return migrations.find(function (_ref) {
        var name = _ref.name;
        return name === migrationName;
      }) || {};
    }).filter(function (migration) {
      return migration.down && migration.name;
    }).map(function (migration) {
      return migration.down;
    });
    var migrationsToRun = migrationsToApply.slice(numberOfAppliedMigrations).map(function (migration) {
      return migration.up;
    });
    return migrationsToRevert.concat(migrationsToRun);
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
    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref2$key = _ref2.key,
        key = _ref2$key === void 0 ? 'redux' : _ref2$key,
        _ref2$whitelist = _ref2.whitelist,
        whitelist = _ref2$whitelist === void 0 ? null : _ref2$whitelist,
        _ref2$blacklist = _ref2.blacklist,
        blacklist = _ref2$blacklist === void 0 ? null : _ref2$blacklist,
        _ref2$storage = _ref2.storage,
        storage = _ref2$storage === void 0 ? window.localStorage : _ref2$storage,
        _ref2$expireDate = _ref2.expireDate,
        expireDate = _ref2$expireDate === void 0 ? null : _ref2$expireDate,
        _ref2$serialize = _ref2.serialize,
        serialize = _ref2$serialize === void 0 ? JSON.stringify : _ref2$serialize,
        _ref2$deserialize = _ref2.deserialize,
        deserialize = _ref2$deserialize === void 0 ? JSON.parse : _ref2$deserialize,
        _ref2$map = _ref2.map,
        map = _ref2$map === void 0 ? {} : _ref2$map,
        _ref2$disabled = _ref2.disabled,
        disabled = _ref2$disabled === void 0 ? false : _ref2$disabled,
        _ref2$throttle = _ref2.throttle,
        throttle = _ref2$throttle === void 0 ? 0 : _ref2$throttle,
        _ref2$migrations = _ref2.migrations,
        migrations = _ref2$migrations === void 0 ? null : _ref2$migrations;

    return Promise.resolve(storage.getItem(key)).then(function (persistedJson) {
      var _moment;

      if (disabled) {
        return store;
      }

      var persistedValue = deserialize(persistedJson);

      var _ref3 = persistedValue || {},
          persistedState = _ref3.persistedState,
          saveDate = _ref3.saveDate,
          appliedMigrations = _ref3.migrations;

      var state = persistedState;

      if (expireDate && (_moment = moment(saveDate)).add.apply(_moment, _toConsumableArray(expireDate)).isBefore(moment())) {
        state = null;
      }

      if (state && migrations) {
        var migrationsToRun = getMigrationsToRun(appliedMigrations, migrations);
        state = migrationsToRun.reduce(function (state, migration) {
          return migration(state);
        }, state);
      }

      var persistedStateToMerge = whitelist ? _.omit(_.pick(state, whitelist), blacklist) : _.omit(state, blacklist);
      store.dispatch({
        type: REHYDRATE,
        payload: persistedStateToMerge
      });

      var saveState = function saveState() {
        var state = transform(map, store.getState());
        var subset = whitelist ? _.omit(_.pick(state, whitelist), blacklist) : _.omit(state, blacklist);
        var appliedMigrations = migrations ? migrations.filter(function (migration) {
          return migration.up && migration.name;
        }).map(function (migration) {
          return migration.name;
        }) : undefined; // eslint-disable-line no-undefined

        storage.setItem(key, serialize({
          persistedState: subset,
          saveDate: moment().valueOf(),
          migrations: appliedMigrations
        }));
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
  exports.autoRehydrate = autoRehydrate;
  exports.default = persistStore;
  exports.getMigrationsToRun = getMigrationsToRun;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=redux-phoenix.js.map
