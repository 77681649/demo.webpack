/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const JsonpMainTemplatePlugin = require("./JsonpMainTemplatePlugin");
const JsonpChunkTemplatePlugin = require("./JsonpChunkTemplatePlugin");
const JsonpHotUpdateChunkTemplatePlugin = require("./JsonpHotUpdateChunkTemplatePlugin");

/**
 * 加载异步模块模板的插件
 * 
 * @class JsonpTemplatePlugin
 */
class JsonpTemplatePlugin {
  apply(compiler) {
    compiler.plugin("this-compilation", (compilation) => {
      compilation.mainTemplate.apply(new JsonpMainTemplatePlugin());
      compilation.chunkTemplate.apply(new JsonpChunkTemplatePlugin());
      compilation.hotUpdateChunkTemplate.apply(new JsonpHotUpdateChunkTemplatePlugin());
    });
  }
}

module.exports = JsonpTemplatePlugin;