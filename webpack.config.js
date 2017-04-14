const path = require('path');
const PROJECT_ROOT = __dirname;
const SOURCE_DIR = path.resolve(PROJECT_ROOT, 'src');

module.exports = {
  entry: path.resolve(SOURCE_DIR, 'index.jsx'),
  output: {
    path: PROJECT_ROOT,
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: SOURCE_DIR,
        loader: 'babel-loader'
      },
      {
        test: /\.sass$/,
        include: SOURCE_DIR,
        loaders: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(png|otf)$/,
        loader: 'file-loader?name=[path][name].[ext]'
      },
    ]
  }
};