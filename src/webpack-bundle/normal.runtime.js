//
//
// ------------------------------------------------------------------ webpack bootstrap ( normal )
//
//
/**
 * webpack bootstrap
 *
 * chunk_id   标识Chunk, 通常是对应一个文件
 * module_id  标识Module, 通常是对应一个引用模块
 * @param {Map<moduleId, Module>} modules 已安装的模块列表 ( 已安装的模块 - 可以引用的模块 )
 *
 * @example
 *  i {String} 模块ID
 *  l {Boolean} 是否已经加载
 *  exports {Object} 模块内容
 */
(function(modules) {
	/**
	 * The module cache
	 * @type {Map<moduleId, Module>}
	 */
	var installedModules = {};

	/**
	 * 缓存 loaded chunk
	 * @type {Map<chunkId,chunk_loading_status>}
	 *
	 * @example
	 * key            - chunk id
	 * value
	 *    = [resolve, reject, Promise]        - 正在加载
	 *    = undefined                         - 未加载 ( 可能是因为加载失败 or 根本没有加载过 )
	 *    = null                              - 预加载 ( 预获取 )
	 *    = 0                                 - 已成功加载
	 */
	var installedChunks = {
		'scripts/runtime': 0,
	};

	/**
	 *
	 * @example
	 * deferredModules = [[0, 'scripts/runtime', 'vendor']]
	 *
	 *  0 -
	 *  'scripts/runtime'
	 *  'vendor'
	 *
	 * @type {Tuple[deferredModuleName, ...depChunkIds]}
	 */
	var deferredModules = [];

	/**
	 * 通过JSONP异步加载的回调函数
	 *  1. 实现异步加载Chunk
	 *  2. 安装异步Chunk的模块
	 * @param {Tuple<chunkIds,moreModules,executeModules>} data 加载数据
	 * @param {String[]} chunkIds 当前Chunk 依赖的Chunk ( 加载该文件前, 需要加载的Chunk文件 )
	 * @param {Map<moduleId, Module} moreModules 当前Chunk 包含的模块列表
	 * @param {Array[]} executeModules 依赖当前Chunk的 Chunk List
	 */
	function webpackJsonpCallback(data) {
		var chunkIds = data[0];
		var moreModules = data[1];
		var executeModules = data[2];

		// add "moreModules" to the modules object,
		// then flag all "chunkIds" as loaded and fire callback
		// prettier-ignore
		var 
      moduleId,         // 
			chunkId,          // 
			i = 0,            // 循环计数器
			resolves = []; //

		//
		// 1. 遍历 chunkIds - 检查依赖Chunk的状态, 并作出相应的处理
		//
		for (; i < chunkIds.length; i++) {
			chunkId = chunkIds[i];

			// chunk 正在加载, 获得resolve
			if (installedChunks[chunkId]) {
				resolves.push(installedChunks[chunkId][0]);
			}

			// chunk 其他状态 - 标记为已加载
			installedChunks[chunkId] = 0;
		}

		//
		// 2. 遍历 moreModules - 安装当前chunk包含的模块
		//
		for (moduleId in moreModules) {
			if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
				modules[moduleId] = moreModules[moduleId];
			}
		}

		//
		// 3. chunk安装完毕, 加载chunk的父chunk
		//
		if (parentJsonpFunction) {
			parentJsonpFunction(data);
		}

		//
		// 4. 执行resolve函数
		//
		while (resolves.length) {
			resolves.shift()();
		}

		//
		// 5. 被依赖的Chunk -> DeferredModules
		//
		deferredModules.push.apply(deferredModules, executeModules || []);

		//
		// 6. 检查DeferredModules, 安装就绪的模块
		//
		return checkDeferredModules();
	}

	/**
	 * 检查延后安装的模块 - 当满足条件时, 安装模块
	 */
	function checkDeferredModules() {
		var result;

		//
		// 遍历deferredModules - 检查延迟加载的模块, 当
		//
		for (var i = 0; i < deferredModules.length; i++) {
			var deferredModule = deferredModules[i];
			var fulfilled = true;

			// 遍历deferredModule - 检查依赖的chunk(modules)是否加载
			for (var j = 1; j < deferredModule.length; j++) {
				var depId = deferredModule[j];

				// 依赖的chunk没有加载好, 标记为 fulfilled = false
				if (installedChunks[depId] !== 0) fulfilled = false;
			}

			// fulfilled = true - 安装延迟的模块
			if (fulfilled) {
				deferredModules.splice(i--, 1);
				result = __webpack_require__((__webpack_require__.s = deferredModule[0]));
			}
		}
		return result;
	}

	/**
	 * 根据chunk id, 获得chunk的请求路径
	 *
	 * @example
	 * src = output.publicPath + `${ { chunkId: filename.path}  }` + '.js'
	 *
	 * @param {String|Number} chunkId chunk id
	 * @returns {String}
	 */
	function jsonpScriptSrc(chunkId) {
		return __webpack_require__.p + 'scripts/' + ({ common: 'common' }[chunkId] || chunkId) + '.async.js';
	}

	/**
	 * 安装模块 require(module)
	 * @param {Number|String} moduleId 被安装的模块ID
	 * @returns {Any} 返回module.exports
	 */
	function __webpack_require__(moduleId) {
		//
		// 1. 检查缓存, 如果已缓存(已安装), 直接返回
		//
		if (installedModules[moduleId]) {
			return installedModules[moduleId].exports;
		}

		//
		// 2. 创建新的模块 ( 放入缓存 )
		//
		var module = (installedModules[moduleId] = {
			i: moduleId,
			l: false,
			exports: {},
		});

		//
		// prettier-ignore
		// 3. 执行模块函数
		//
		modules[moduleId].call(
      module.exports,         // @this = module.exports
      module,                 // module
      module.exports,         // module.exports
      __webpack_require__     // __webpack_require__
    );

		//
		// 4. 标记为加载
		//
		module.l = true;

		//
		// 5. 返回module.exports
		//
		return module.exports;
	}

	/**
	 * require.ensure 函数 - 异步加载指定Chunk
   * 
	 * @param {String} chunkId
	 * @returns {Promise[]} 返回Promise
	 */
	__webpack_require__.e = function requireEnsure(chunkId) {
		var promises = [];

		// JSONP chunk loading for javascript
		var installedChunkData = installedChunks[chunkId];

		// not loaded
		if (installedChunkData !== 0) {
			// 0 means "already installed".

			// a Promise means "currently loading".
			if (installedChunkData) {
				promises.push(installedChunkData[2]);
			} else {
				// setup Promise in chunk cache
				var promise = new Promise(function(resolve, reject) {
					installedChunkData = installedChunks[chunkId] = [resolve, reject];
				});

				promises.push((installedChunkData[2] = promise));

				//
				// start chunk loading
				//
				var head = document.getElementsByTagName('head')[0];
				var script = document.createElement('script');
				var onScriptComplete;

				script.charset = 'utf-8';
				script.timeout = 120;

				if (__webpack_require__.nc) {
					script.setAttribute('nonce', __webpack_require__.nc);
        }
        
        // set src
				script.src = jsonpScriptSrc(chunkId);

				onScriptComplete = function(event) {
					// avoid mem leaks in IE.
					script.onerror = script.onload = null;
					clearTimeout(timeout);

					var chunk = installedChunks[chunkId];

					// 文件加载完毕之后(webpackJsonpCallback), 但是chunk 没有加载好, 说明出问题
					if (chunk !== 0) {
						if (chunk) {
							// prettier-ignore
							var errorType = event && (
                event.type === 'load' 
                  ? 'missing' 
                  : event.type
              );

              var realSrc = event && event.target && event.target.src;
              
							var error = new Error(
								'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')'
							);

							error.type = errorType;
              error.request = realSrc;
              
              // reject
							chunk[1](error);
						}

            // 标记为 未加载
						installedChunks[chunkId] = undefined;
					}
				};

        // set timeout timer
				var timeout = setTimeout(function() {
					onScriptComplete({ type: 'timeout', target: script });
				}, 120000);

				script.onerror = script.onload = onScriptComplete;

				head.appendChild(script);
			}
		}

		return Promise.all(promises);
	};

	// expose the modules object (__webpack_modules__)
	__webpack_require__.m = modules;

	// expose the module cache
	__webpack_require__.c = installedModules;

	// define getter function for harmony exports

	/**
	 * 定义 ES模块的 exports.getter
	 * @param {Object} exports
	 * @param {String} name
	 * @param {Function} getter
	 */
	__webpack_require__.d = function(exports, name, getter) {
		if (!__webpack_require__.o(exports, name)) {
			Object.defineProperty(exports, name, { enumerable: true, get: getter });
		}
	};

	/**
	 * 定义 __esModule属性 - 标记是否是ES6 模块
	 * @param {Object} exports
	 */
	__webpack_require__.r = function(exports) {
		if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
		}

		Object.defineProperty(exports, '__esModule', { value: true });
	};

	// create a fake namespace object
	// mode & 1: value is a module id, require it
	// mode & 2: merge all properties of value into the ns
	// mode & 4: return value when already ns object
	// mode & 8|1: behave like require
	__webpack_require__.t = function(value, mode) {
		if (mode & 1) value = __webpack_require__(value);
		if (mode & 8) return value;
		if (mode & 4 && typeof value === 'object' && value && value.__esModule) return value;
		var ns = Object.create(null);
		__webpack_require__.r(ns);
		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
		if (mode & 2 && typeof value != 'string')
			for (var key in value)
				__webpack_require__.d(
					ns,
					key,
					function(key) {
						return value[key];
					}.bind(null, key)
				);
		return ns;
	};

	// getDefaultExport function for compatibility with non-harmony modules
	__webpack_require__.n = function(module) {
		var getter =
			module && module.__esModule
				? function getDefault() {
						return module['default'];
				  }
				: function getModuleExports() {
						return module;
				  };
		__webpack_require__.d(getter, 'a', getter);
		return getter;
	};

	/**
	 * Object.prototype.hasOwnProperty.call(object, property)
	 * @param {Object} object 对象
	 * @param {String} property 属性
	 * @returns {}
	 */
	__webpack_require__.o = function(object, property) {
		return Object.prototype.hasOwnProperty.call(object, property);
	};

	// __webpack_public_path__
	__webpack_require__.p = '';

	// on error function for async loading
	__webpack_require__.oe = function(err) {
		console.error(err);
		throw err;
	};

	//
	// 1. 绑定 window.webpackJsonp
	//
	var jsonpArray = (window['webpackJsonp'] = window['webpackJsonp'] || []);
	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);

	// 使用webpackJsonpCallback替换push
	jsonpArray.push = webpackJsonpCallback;

	// shallow clone
	jsonpArray = jsonpArray.slice();

	// 处理暂存的信息
	for (var i = 0; i < jsonpArray.length; i++) {
		webpackJsonpCallback(jsonpArray[i]);
	}

	//
	// 2. 记录父级 webpackJsonpCallback ( 方便后续回调,通知父级 )
	//
	var parentJsonpFunction = oldJsonpFunction;

	//
	// 3. 检查延迟安装的模块 ( 因为, 依赖chunk没有加载而延迟 )
	//
	checkDeferredModules();
})(
	/************************************************************************/
	[]
);
//# sourceMappingURL=runtime.js.map

//
//
// ------------------------------------------------------------------ chunk 0
//
//
(window['webpackJsonp'] = window['webpackJsonp'] || []).push([
	['main'],
	{
		/***/ './index.js':
			/*!******************!*\
    !*** ./index.js ***!
    \******************/
			/*! no exports provided */
			/***/ function(module, __webpack_exports__, __webpack_require__) {
				'use strict';
				__webpack_require__.r(__webpack_exports__);
				/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(
					/*! @babel/runtime/regenerator */ '../../../../../node_modules/@babel/runtime/regenerator/index.js'
				);
				/* harmony import */ var _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/ __webpack_require__.n(
					_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0__
				);
				/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(
					/*! @babel/runtime/helpers/asyncToGenerator */ '../../../../../node_modules/@babel/runtime/helpers/asyncToGenerator.js'
				);
				/* harmony import */ var _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/ __webpack_require__.n(
					_babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1__
				);
				/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(
					/*! react */ '../../../../../node_modules/react/index.js'
				);
				/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/ __webpack_require__.n(
					react__WEBPACK_IMPORTED_MODULE_2__
				);
				/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(
					/*! react-dom */ '../../../../../node_modules/react-dom/index.js'
				);
				/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/ __webpack_require__.n(
					react_dom__WEBPACK_IMPORTED_MODULE_3__
				);

				start();

				function start() {
					return _start.apply(this, arguments);
				}

				function _start() {
					_start = _babel_runtime_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_1___default()(
						/*#__PURE__*/
						_babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.mark(function _callee() {
							var path, PageComponent;
							return _babel_runtime_regenerator__WEBPACK_IMPORTED_MODULE_0___default.a.wrap(
								function _callee$(_context) {
									while (1) {
										switch ((_context.prev = _context.next)) {
											case 0:
												path = location.pathname;

												if (!(path === '' || path === '/')) {
													_context.next = 7;
													break;
												}

												_context.next = 4;
												return Promise.all(
													/*! import() */ [
														__webpack_require__.e('vendor'),
														__webpack_require__.e('common'),
														__webpack_require__.e(0),
													]
												).then(
													__webpack_require__.bind(
														null,
														/*! ./pages/index */ './pages/index.jsx'
													)
												);

											case 4:
												PageComponent = _context.sent.default;
												_context.next = 11;
												break;

											case 7:
												if (!(path === '/list')) {
													_context.next = 11;
													break;
												}

												_context.next = 10;
												return Promise.all(
													/*! import() */ [
														__webpack_require__.e('vendor'),
														__webpack_require__.e('common'),
														__webpack_require__.e(1),
													]
												).then(
													__webpack_require__.bind(
														null,
														/*! ./pages/list */ './pages/list.jsx'
													)
												);

											case 10:
												PageComponent = _context.sent.default;

											case 11:
												console.log(PageComponent);
												react_dom__WEBPACK_IMPORTED_MODULE_3___default.a.render(
													react__WEBPACK_IMPORTED_MODULE_2___default.a.createElement(
														PageComponent,
														null
													),
													document.getElementById('root')
												);

											case 13:
											case 'end':
												return _context.stop();
										}
									}
								},
								_callee,
								this
							);
						})
					);
					return _start.apply(this, arguments);
				}

				/***/
			},

		/***/ 0:
			/*!*********************!*\
    !*** multi ./index ***!
    \*********************/
			/*! no static exports found */
			/***/ function(module, exports, __webpack_require__) {
				module.exports = __webpack_require__(/*! ./index */ './index.js');

				/***/
			},
	},
	[[0, 'scripts/runtime', 'vendor']],
]);
//# sourceMappingURL=main.async.js.map
