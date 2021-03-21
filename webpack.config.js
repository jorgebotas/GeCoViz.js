const path = require("path")

module.exports = {
  entry: path.resolve(__dirname, "src/gecoviz.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "gecoviz_bundle.js",
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
    ],
  },
  mode: "development",
}
