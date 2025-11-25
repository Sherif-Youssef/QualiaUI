const path = require('path');

module.exports = {
    mode: 'development',
    entry: './serializer/index.js',
    output: {
        path: __dirname,
        filename: 'dom_serializer.bundle.js',
    },
    target: 'web',
    optimization: {
        minimize: true,
    },
    devtool: false,
};