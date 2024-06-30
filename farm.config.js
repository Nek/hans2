module.exports = {
  compilation: {
    input: {
      index: './src/js/app.js'
    },
    output: {
      path: './dist',
      publicPath: '/'
    }
  },
  server: {
    port: 3000
  }
};
