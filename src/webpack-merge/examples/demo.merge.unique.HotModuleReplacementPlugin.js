const merge = require('webpack-merge')

class HotModuleReplacementPlugin {
  constructor() {
    this.name = 'HotModuleReplacementPlugin'
  }
}

const base = {
  entry: 'main',
  output: { filename: 'dist/' },
  plugins: [
    new HotModuleReplacementPlugin()
  ]
}
const dev = {
  output: { filename: 'dev.dist', path: '..' },
  plugins: [
    new HotModuleReplacementPlugin()
  ]
}

const customizeArray = merge.unique(
  'plugins',                              // 指定配置项 , 该配置项下的某些值不能重复
  ['HotModuleReplacementPlugin'],        // 指定不能重复的项
  function getter(plugin) {              // 取值器
    return plugin && plugin.constructor && plugin.constructor.name
  }
)


console.log(JSON.stringify(merge({ customizeArray })(base, dev), null, 2))