# Redux Phoenix

Restore redux state from previous sessions like a phoenix from ashes.

`npm i --save redux-phoenix`

[![CircleCI](https://circleci.com/gh/adam-golab/redux-phoenix.svg?style=svg)](https://circleci.com/gh/adam-golab/redux-phoenix)
[![Maintainability](https://api.codeclimate.com/v1/badges/ccd7344d371177735562/maintainability)](https://codeclimate.com/github/adam-golab/redux-phoenix/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/ccd7344d371177735562/test_coverage)](https://codeclimate.com/github/adam-golab/redux-phoenix/test_coverage)

## Basic usage

Basic usage requires adding a enhancer to a redux application:

```javascript
// configureStore.js
import { createStore, compose } from 'redux';
import { autoRehydrate } from 'redux-phoenix';

const store = createStore(reducer, initialState, compose(
  applyMiddleware(...middlewares),
  autoRehydrate,
);
```

And modyfing client entry point:

```javascript
// index.js
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import store from 'configureStore';
import persistStore from 'redux-phoenix';

persistStore(store).then(store => {
  render(
    <Provider store={store}>
      <App />
    </Provider>, document.getElementById('app')
  );
});
```

That's it. Now your redux state will be stored in localstorage.

## API

#### `persistStore(store, [config])`
 - `import persistStore from 'redux-phoenix'`
 - arguments
   - **store**: *redux store* The store to be persisted.
   - **config**: *object*
     - **key**: *string* (default: **redux**) change storage default key.
     - **whitelist**: *Array\<string\>* (default: **null**) keys to persist, `null` means all keys will be persisted.
       It may be nested keys. For example: `whitelist: [reducer.subfield]` persist only
       `{ reducer: { subfield: valueFromState } }` and omit all other keys.
     - **blacklist**: *Array\<string\>* (default: **null**) keys to ignore, `null` means no keys will be omitted.
       It may be nested keys and overwrite whitelisted keys.
     - **storage**: *object* (default: **window.localStorage**) a
       [conforming](https://github.com/adam-golab/redux-phoenix#storage-engines) storage engine.
     - **expireDate**: *[number, string]* (default: **null**) duration validity of the stored state. For example:
       `expireDate: [2, 'hours']` restore state from storage only when it is not older than 2 hours.
     - **serialize**: *function* (default: **JSON.stringify**) a function which takes object with redux state and
       returns string which can be stored into storage.
     - **deserialize**: *function* (default: **JSON.parse**) a function which takes string from storage and returns
       object with redux state.
     - **map**: *object* (default: **{}**) a [mapping transformation](https://github.com/adam-golab/redux-phoenix#transformation) wich will be applied to state before saving.
     - **disabled**: *boolean* (default: **false**) disable persisting state.
     - **throttle**: *number* (default: **0**) number of milisecond to wait between persisting the state, for values greater than 0 it uses [throttled](https://github.com/adam-golab/redux-phoenix#throttle) version.

#### `autoRehydrate`

 - `import { autoRehydrate } from 'redux-phoenix'`
 - This is a store enhancer that will automatically shallow merge the persisted state for each key.

#### `REHYDRATE`

 - `import { REHYDRATE } from 'redux-phoenix'`
 - Action type which will be dispatched on rehydration.

## Storage Engines

 - **localStorage** (default)
 - **sessionStorage**
 - **[localForage](https://github.com/mozilla/localForage)**
 - **[AsyncStorage](http://facebook.github.io/react-native/docs/asyncstorage.html#content)**
 - **custom** any conforming storage api implementing the following methods: `setItem`, `getItem` which returns value or
   a Promise resolved to value.

## Whitelist and blacklist

Whitelisted keys are overwrited by blacklisted keys so is possible to omit some specific keys to not being stored.

For example given following state and configuration:
```javascript
store.getState(); // { foo: { data: 'some data', errors: null,  isLoading: false }, bar: { data: 'some other data } }

persistStore(store, {
  whitelist: ['foo'],
  blacklist: ['foo.isLoading', 'foo.errors'],
});
```
will persist only object `{ foo: { data: 'some data' } }` in storage.

## Transformation

There is also a possibility to transform state before saving it into storage.

Example with transformation with strings
```javascript
store.getState(); // { foo: { lastValidData: 'some data', actualData: 'some data with errors' } }

persistStore(store, {
  map: { 'foo.lastValidData': 'foo.actualData' },
});
```

this will persist object `{ foo: { lastValidData: 'some data', actualData: 'some data' } }` so that restored state will
always have the last valid value in state.

Example with transformation with function
```javascript
store.getState(); // { foo: { lastValidData: 'some data', actualData: 'some data with errors' } }

persistStore(store, {
  map: {
    'foo.actualData': {
      lastValidData: (oldKey, value, state) => ({
        targetKey: 'foo.oldData',
        targetValue: { [oldKey]: value },
        sourceValue: state.foo.lastValidData,
      }),
    },
  },
});
```

this will persist object:
```javascript
{
  foo: {
    lastValidData: 'some data',
    actualData: 'some data',
    oldData: {
      'foo.actualData': 'some data with errors'
    }
  }
}
```

so that is possible to modify state to much complicated form.

## Throttle

When the throttle is defined, the state will not be saved at every action dispatched in the time set. It will take the state after the last action of this period of time.
This can be useful to lower the charge of an external API.

```javascript

persistStore(store, {
    throttle : 1000,
  }
); // The state will be save maximum one time / 1000 ms

```

## Migrations

You can pass migrations that will be run just before rehydrating redux store. This allows to modify the old version of state that could be persisted previously, to the
new version that is used currently. Note when you want to revert the migration that might be applied previously just omit the `up` method in the migration object.

```javascript
const migrations = [
  {
    name: '001-initial-migration',
    up: state => ({ ...state, { newField: 'newFieldValue' } }),
    down: state => state,
  },
  {
    name: '002-missing-migration',
    up: state => ({ ...state, { anotherNewField: 'newValue' } }),
    down: state => _.omit(state, 'anotherNewField'),
  },
];

persistStore(store, { migrations }); // There will be applied missing migrations from 2 passed
```

```javascript
const migrations = [
  {
    name: '001-initial-migration',
    up: state => ({ ...state, { newField: 'newFieldValue' } }),
    down: state => state,
  },
  {
    name: '002-reverted',
    down: state => state,
  },
];

persistStore(store, { migrations }); // There will be applied migration 001 (if not present) and reverted 002 (if present)
```
