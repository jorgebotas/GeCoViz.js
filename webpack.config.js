const path = require("path");
const webpack = require('webpack');

module.exports = {
  entry: path.resolve(__dirname, "src/gecoviz.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "gecoviz.js",
    library: "GeCoViz",
    libraryTarget: "umd",
    libraryExport: "default"
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.svg$/,
        use: 'file-loader'
      },
    ],
  },
  plugins: [],
  mode: "development",
}
