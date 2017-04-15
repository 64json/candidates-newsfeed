const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PROJECT_ROOT = __dirname;
const SOURCE_DIR = path.resolve(PROJECT_ROOT, 'src');
const DEBUG = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: [
    path.resolve(SOURCE_DIR, 'index.jsx'),
  ],
  output: {
    path: PROJECT_ROOT,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: SOURCE_DIR,
        use: 'babel-loader'
      },
      {
        test: /\.sass$/,
        include: SOURCE_DIR,
        use: DEBUG ?
          ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'] :
          ExtractTextPlugin.extract({ use: ['css-loader', 'postcss-loader', 'sass-loader'], fallback: 'style-loader' })
      },
      {
        test: /\.(png|otf)$/,
        use: 'file-loader?name=[path][name].[ext]'
      },
    ]
  },
  plugins: [
    new ExtractTextPlugin('bundle.css'),
    new HtmlWebpackPlugin({
      template: path.resolve(SOURCE_DIR, 'index.html'),
      minify: { collapseWhitespace: false },
    })
  ]
};