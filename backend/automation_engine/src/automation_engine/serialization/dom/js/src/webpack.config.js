const path = require('path');

module.exports = {
  mode: 'production',
  entry: './serializer/index.js',
  output: {
    path: path.resolve(__dirname),
    filename: '../assets/dom_serializer.bundle.js',
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.js$/,
        type: 'javascript/auto',
      },
    ],
  },
};