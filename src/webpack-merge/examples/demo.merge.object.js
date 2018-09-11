const merge = require('webpack-merge')
const base = {
  entry: 'main',
  output: { filename: 'dist/' },
  rules:
    {
      use: 'css-loader',
      options: {
        path: {
          indexPath: 'index',
          b: 2
        }
      }
    }

}
const dev = {
  output: { filename: 'dev.dist', path: '..' },
  rules: {
    use: 'style-loader',
    options: {
      path: {
        indexPath: 'index'
      }
    }
  }
}
const other = { devServer: { a: 1 } }

console.log(JSON.stringify(merge(base, dev, other), null, 2))