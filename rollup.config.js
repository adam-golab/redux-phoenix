import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

const pkg = require('./package.json');
const external = Object.keys(pkg.dependencies);

export default {
  entry: 'src/reduxPhoenix.js',
  plugins: [
    babel(babelrc()),
  ],
  external: external,
  exports: 'named',
  globals: {
    lodash: '_',
    moment: 'moment',
  },
  targets: [
    {
      dest: pkg.main,
      format: 'umd',
      moduleName: 'reduxPhoenix',
      sourceMap: true,
    },
    {
      dest: pkg.module,
      format: 'es',
      sourceMap: true,
    },
  ],
};
