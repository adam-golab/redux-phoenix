# Redux Phoenix

Restore redux state from previous sessions like a phoenix from ashes.

`npm i --save redux-phoenix`

[![CircleCI](https://circleci.com/gh/brainhub-adam/redux-phoenix.svg?style=svg)](https://circleci.com/gh/brainhub-adam/redux-phoenix)

## Basic usage

Basic usage requires adding a enhancer to a redux application:

```javascript
// configureStore.js
import { createStore, compose } from 'redux';
import { autoRehydrate } from 'react-phoenix';

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
       [conforming](https://github.com/brainhub-adam/redux-phoenix#storage-engines) storage engine.
     - **expireDate**: *[number, string]* (default: **null**) duration validity of the stored state. For example:
       `expireDate: [2, 'hours']` restore state from storage only when it is not older than 2 hours.
     - **serialize**: *function* (default: **JSON.stringify**) a function which takes object with redux state and
       returns string which can be stored into storage.
     - **deserialize**: *function* (default: **JSON.parse**) a function which takes string from storage and returns
       object with redux state.
     - **map**: *object* (default: **{}**) a [mapping transformation](https://github.com/brainhub-adam/redux-phoenix#transformation) wich will be applied to state before saving.
     - **disabled**: *boolean* (default: **false**) disable persisting state.

#### `autoRehydrate`

 - `import { autoRehydrate } from 'redux-phoenix'`
 - This is a store enhancer that will automatically shallow merge the persisted state for each key.

#### `REHYDRATE`

 - `import { REHYDRATE } from 'redux-phoenix'`
 - Action type which will be dispatched on rehydration.

## Storage Engines

 - **localStorage** (default)
 - **sessionStorage**
 - **[localForage](https://github.com/mozilla/localForage)** (recommended)
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