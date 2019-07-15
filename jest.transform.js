module.exports = require('babel-jest').createTransformer({
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: ['last 2 versions'],
      },
    }],
  ],
});
