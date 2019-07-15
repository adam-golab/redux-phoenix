import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

const pkg = require('./package.json');

const external = Object.keys(pkg.dependencies);

export default {
  input: 'src/reduxPhoenix.js',
  plugins: [
    babel(babelrc({
      addModuleOptions: false,
      addExternalHelpersPlugin: false,
      exclude: /node_modules/,
      runtimeHelpers: false,
    })),
  ],
  external,
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'redux-phoenix',
      sourcemap: true,
      exports: 'named',
      globals: {
        debug: 'debug',
        lodash: '_',
        moment: 'moment',
      },
    },
  ],
};
