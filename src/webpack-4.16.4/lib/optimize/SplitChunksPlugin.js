/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const crypto = require("crypto");
const SortableSet = require("../util/SortableSet");
const GraphHelpers = require("../GraphHelpers");
const { isSubset } = require("../util/SetHelpers");
const deterministicGrouping = require("../util/deterministicGrouping");
const contextify = require("../util/identifier").contextify;

/** @typedef {import("../Compiler")} Compiler */
/** @typedef {import("../Chunk")} Chunk */
/** @typedef {import("../Module")} Module */
/** @typedef {import("../util/deterministicGrouping").Options<Module>} DeterministicGroupingOptionsForModule */
/** @typedef {import("../util/deterministicGrouping").GroupedItems<Module>} DeterministicGroupingGroupedItemsForModule */

const deterministicGroupingForModules = /** @type {function(DeterministicGroupingOptionsForModule): DeterministicGroupingGroupedItemsForModule[]} */ (deterministicGrouping);

const hashFilename = name => {
	return crypto
		.createHash("md4")
		.update(name)
		.digest("hex")
		.slice(0, 8);
};

const sortByIdentifier = (a, b) => {
	if (a.identifier() > b.identifier()) return 1;
	if (a.identifier() < b.identifier()) return -1;
	return 0;
};

/**
 * 计算请求数
 * @param {Chunk} chunk 
 * @returns {Number}
 */
const getRequests = chunk => {
	let requests = 0;
	for (const chunkGroup of chunk.groupsIterable) {
		requests = Math.max(requests, chunkGroup.chunks.length);
	}
	return requests;
};

const getModulesSize = modules => {
	let sum = 0;
	for (const m of modules) {
		sum += m.size();
	}
	return sum;
};

/**
 * @template T
 * @param {Set<T>} a set
 * @param {Set<T>} b other set
 * @returns {boolean} true if at least one item of a is in b
 */
const isOverlap = (a, b) => {
	for (const item of a) {
		if (b.has(item)) return true;
	}
	return false;
};

/**
 * 比较Entry
 * @param {ChunkInfo} a
 * @param {ChunkInfo} b
 * @returns {Number}
 */
const compareEntries = (a, b) => {
	// 1. by priority
	const diffPriority = a.cacheGroup.priority - b.cacheGroup.priority;
	if (diffPriority) return diffPriority;
	
	// 2. by number of chunks
	const diffCount = a.chunks.size - b.chunks.size;
	if (diffCount) return diffCount;
	
	// 3. by size reduction
	const aSizeReduce = a.size * (a.chunks.size - 1);
	const bSizeReduce = b.size * (b.chunks.size - 1);
	const diffSizeReduce = aSizeReduce - bSizeReduce;
	if (diffSizeReduce) return diffSizeReduce;
	
	// 4. by number of modules (to be able to compare by identifier)
	const modulesA = a.modules;
	const modulesB = b.modules;
	const diff = modulesA.size - modulesB.size;
	if (diff) return diff;
	
	// 5. by module identifiers
	modulesA.sort();
	modulesB.sort();
	const aI = modulesA[Symbol.iterator]();
	const bI = modulesB[Symbol.iterator]();
	
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const aItem = aI.next();
		const bItem = bI.next();
		if (aItem.done) return 0;
		const aModuleIdentifier = aItem.value.identifier();
		const bModuleIdentifier = bItem.value.identifier();
		if (aModuleIdentifier > bModuleIdentifier) return -1;
		if (aModuleIdentifier < bModuleIdentifier) return 1;
	}
};

/**
 * filter initial chunk 
 * @param {*} chunk 
 * @returns {Boolean}
 */
const INITIAL_CHUNK_FILTER = chunk => chunk.canBeInitial();

/**
 * filter async chunk
 * @param {Chunk} chunk 
 * @returns {Boolean}
 */
const ASYNC_CHUNK_FILTER = chunk => !chunk.canBeInitial();

/**
 * all
 * @param {Chunk} chunk 
 * @returns {Boolean} 
 */
const ALL_CHUNK_FILTER = chunk => true;

module.exports = class SplitChunksPlugin {
	constructor(options) {
		this.options = SplitChunksPlugin.normalizeOptions(options);
	}

	/**
	 * 格式化选项
	 * @param {Object} options 
	 * @returns {Object}
	 */
	static normalizeOptions(options = {}) {
		return {
			chunksFilter: SplitChunksPlugin.normalizeChunksFilter(
				options.chunks || "all"
			),
			minSize: options.minSize || 0,
			maxSize: options.maxSize || 0,
			minChunks: options.minChunks || 1,
			maxAsyncRequests: options.maxAsyncRequests || 1,
			maxInitialRequests: options.maxInitialRequests || 1,
			hidePathInfo: options.hidePathInfo || false,
			filename: options.filename || undefined,
			getCacheGroups: SplitChunksPlugin.normalizeCacheGroups({
				cacheGroups: options.cacheGroups,
				name: options.name,
				automaticNameDelimiter: options.automaticNameDelimiter
			}),
			automaticNameDelimiter: options.automaticNameDelimiter,
			fallbackCacheGroup: SplitChunksPlugin.normalizeFallbackCacheGroup(
				options.fallbackCacheGroup || {},
				options
			)
		};
	}

	/**
	 * 获得 getName
	 * @param {Object} args 参数
	 * @param {String} args.name chunk name
	 * @param {String} args.automaticNameDelimiter 连接符
	 * @param {String} args.automaticNamePrefix 前缀
	 * @returns {Function} 返回getName
	 */
	static normalizeName({ name, automaticNameDelimiter, automaticNamePrefix }) {
		if (name === true) {
			/** @type {WeakMap<Chunk[], Record<string, string>>} */
			const cache = new WeakMap();

			const fn = (module, chunks, cacheGroup) => {
				let cacheEntry = cache.get(chunks);
				
				// set/get cache
				if (cacheEntry === undefined) {
					cacheEntry = {};
					cache.set(chunks, cacheEntry);
				} else if (cacheGroup in cacheEntry) {
					return cacheEntry[cacheGroup];
				}

				// 
				const names = chunks.map(c => c.name);
				if (!names.every(Boolean)) {
					cacheEntry[cacheGroup] = undefined;
					return;
				}

				// 排序
				names.sort();


				// 前缀
				const prefix =
					typeof automaticNamePrefix === "string"
						? automaticNamePrefix
						: cacheGroup;
				const namePrefix = prefix ? prefix + automaticNameDelimiter : "";

				let name = namePrefix + names.join(automaticNameDelimiter);

				// Filenames and paths can't be too long otherwise an
				// ENAMETOOLONG error is raised. If the generated name if too
				// long, it is truncated and a hash is appended. The limit has
				// been set to 100 to prevent `[name].[chunkhash].[ext]` from
				// generating a 256+ character string.
				if (name.length > 100) {
					name =
						name.slice(0, 100) + automaticNameDelimiter + hashFilename(name);
				}
				cacheEntry[cacheGroup] = name;

				return name;
			};
			return fn;
		}
		
		if (typeof name === "string") {
			const fn = () => {
				return name;
			};
			return fn;
		}
		if (typeof name === "function") return name;
	}

	/**
	 * 获得 chunks filter
	 * @param {String|Function} chunks 
	 * @returns {Function} 返回chunks filter
	 */
	static normalizeChunksFilter(chunks) {
		if (chunks === "initial") {
			return INITIAL_CHUNK_FILTER;
		}
		if (chunks === "async") {
			return ASYNC_CHUNK_FILTER;
		}
		if (chunks === "all") {
			return ALL_CHUNK_FILTER;
		}
		if (typeof chunks === "function") return chunks;
	}

	/**
	 * 
	 * @param {*} param0 
	 * @param {*} param1 
	 * @returns {Object}
	 */
	static normalizeFallbackCacheGroup(
		{
			minSize = undefined,
			maxSize = undefined,
			automaticNameDelimiter = undefined
		},
		{
			minSize: defaultMinSize = undefined,
			maxSize: defaultMaxSize = undefined,
			automaticNameDelimiter: defaultAutomaticNameDelimiter = undefined
		}
	) {
		return {
			minSize: typeof minSize === "number" ? minSize : defaultMinSize || 0,
			maxSize: typeof maxSize === "number" ? maxSize : defaultMaxSize || 0,
			automaticNameDelimiter:
				automaticNameDelimiter || defaultAutomaticNameDelimiter || "~"
		};
	}

	/**
	 * 标准化 cacheGroups 选项
	 * @param {Object} options 选项
	 * @param {Object} cacheGroups
	 * @param {String} name chunk name
	 * @param {String} automaticNameDelimiter name delimiter
	 * @returns {Function} 返回一个用于创建normalize CacheGroups 的函数
	 */
	static normalizeCacheGroups({ cacheGroups, name, automaticNameDelimiter }) {
		if (typeof cacheGroups === "function") {
			// TODO webpack 5 remove this
			if (cacheGroups.length !== 1) {
				return module => cacheGroups(module, module.getChunks());
			}
			return cacheGroups;
		}
		if (cacheGroups && typeof cacheGroups === "object") {
			const fn = module => {
				let results;
				for (const key of Object.keys(cacheGroups)) {
					let option = cacheGroups[key];
					if (option === false) continue;
					if (option instanceof RegExp || typeof option === "string") {
						option = {
							test: option
						};
					}
					if (typeof option === "function") {
						let result = option(module);
						if (result) {
							if (results === undefined) results = [];
							for (const r of Array.isArray(result) ? result : [result]) {
								const result = Object.assign({ key }, r);
								if (result.name) result.getName = () => result.name;
								if (result.chunks) {
									result.chunksFilter = SplitChunksPlugin.normalizeChunksFilter(
										result.chunks
									);
								}
								results.push(result);
							}
						}
					} else if (SplitChunksPlugin.checkTest(option.test, module)) {
						if (results === undefined) results = [];
						results.push({
							key: key,
							priority: option.priority,
							getName:
								SplitChunksPlugin.normalizeName({
									name: option.name || name,
									automaticNameDelimiter:
										typeof option.automaticNameDelimiter === "string"
											? option.automaticNameDelimiter
											: automaticNameDelimiter,
									automaticNamePrefix: option.automaticNamePrefix
								}) || (() => {}),
							chunksFilter: SplitChunksPlugin.normalizeChunksFilter(
								option.chunks
							),
							enforce: option.enforce,
							minSize: option.minSize,
							maxSize: option.maxSize,
							minChunks: option.minChunks,
							maxAsyncRequests: option.maxAsyncRequests,
							maxInitialRequests: option.maxInitialRequests,
							filename: option.filename,
							reuseExistingChunk: option.reuseExistingChunk
						});
					}
				}
				return results;
			};
			return fn;
		}
		const fn = () => {};
		return fn;
	}

	/**
	 * 检查module是否匹配
	 * @param {String|RegExp|Function} test 
	 * @param {Module} module 
	 * @returns {Boolean}
	 */
	static checkTest(test, module) {
		if (test === undefined) return true;
		if (typeof test === "function") {
			if (test.length !== 1) {
				return test(module, module.getChunks());
			}
			return test(module);
		}
		if (typeof test === "boolean") return test;
		if (typeof test === "string") {
			if (
				module.nameForCondition &&
				module.nameForCondition().startsWith(test)
			) {
				return true;
			}
			for (const chunk of module.chunksIterable) {
				if (chunk.name && chunk.name.startsWith(test)) {
					return true;
				}
			}
			return false;
		}
		if (test instanceof RegExp) {
			if (module.nameForCondition && test.test(module.nameForCondition())) {
				return true;
			}
			for (const chunk of module.chunksIterable) {
				if (chunk.name && test.test(chunk.name)) {
					return true;
				}
			}
			return false;
		}
		return false;
	}

	/**
	 * apply
	 * @param {Compiler} compiler webpack compiler
	 * @returns {void}
	 */
	apply(compiler) {
		compiler.hooks.thisCompilation.tap("SplitChunksPlugin", compilation => {
			let alreadyOptimized = false;
			
			compilation.hooks.unseal.tap("SplitChunksPlugin", () => {
				alreadyOptimized = false;
			});

			compilation.hooks.optimizeChunksAdvanced.tap(
				"SplitChunksPlugin",
				chunks => {
					if (alreadyOptimized) return;
					alreadyOptimized = true;

					/**
					 * 获得chunks对应的key ( key由index生成 )
					 * @param {Chunk[]} chunks
					 * @returns {String} 返回由chunk index组成的字符串 "1,2,3,..."
					 */
					const getKey = chunks => {
						return Array.from(chunks, c => indexMap.get(c))
							.sort()
							.join();
					};

					/**
					 * 1. 生成 chunk index map
					 * {
					 * 		chunk: 0
					 * 		chunk: 1
					 * }
					 */
					const indexMap = new Map();
					let index = 1;
					for (const chunk of chunks) {
						indexMap.set(chunk, index++);
					}
					
					/** 
					 * vendor-chunk map ( 表示chunk引用module的情况 )
					 * 
					 * @example
					 * 0 chunkA: module1, module2
					 * 1 chunkB: moudle3
					 * 2 chunkC: module1
					 * 
					 * "0,2" - 表示chunkA,chunkC模块了同一模块
					 * vendor-chunk set: 
					 * {
					 * 	"0,2": [chunkA, chunkC]
					 * 	"1": [chunkB]
					 * 	"2": [chunkC]
					 * }
					 * 
					 * @type {Map<string, Set<Chunk>>} 
					 */
					const chunkSetsInGraph = new Map();

					//
					// 2. 遍历 modules - 获得 vendor-chunk map
					//
					for (const module of compilation.modules) {
						const chunksKey = getKey(module.chunksIterable);
						if (!chunkSetsInGraph.has(chunksKey)) {
							chunkSetsInGraph.set(chunksKey, new Set(module.chunksIterable));
						}
					}

					/**
					 * count-chunk set ( 按vendor-chunk的尺寸分组 )
					 * 
					 * @example
					 * 尺寸为1的vendor-chunk
					 * 
					 * chunkSetsByCount = {
					 * 		1: [ [ChunkA], [ChunkB], [ChunkC] ],
					 * 		2: [ [ChunkA, ChunkB], [ChunkB,ChunkC]]
					 * 		.. 
					 * }
					 * 
					 * @type {Map<number, Array<Set<Chunk>>>} 
					 */
					const chunkSetsByCount = new Map();

					//
					// 3. 获得count-chunk set
					//
					for (const chunksSet of chunkSetsInGraph.values()) {
						const count = chunksSet.size;
						let array = chunkSetsByCount.get(count);
						
						if (array === undefined) {
							array = [];
							chunkSetsByCount.set(count, array);
						}
						array.push(chunksSet);
					}

					/**
					 * combinations ( vendor-chunk 以及其他它的 sub chunks )
					 * 
					 * @example
					 * {
					 * 	"0,1,2": [
					 * 		[ChunkA, ChunkB, ChunkC],
					 * 		[ChunkA, ChunkB],
					 * 		[ChunkA],
					 * 		[ChunkB]
					 * 	]
					 * }
					 * 
					 * @type {Map<string, Set<Chunk>[]>}
					 */
					const combinationsCache = new Map(); 

					/**
					 * 获得combinations
					 * 
					 * @example
					 * [
					 * 		[chunkA, chunkB, chunkC]
					 * 		[chunkA, chunkB],
					 * 		[chunkA],
					 * 		[chunkB]
					 * ]
					 *  
					 * @param {String} key vendor-chunk key "1,2"
					 * @returns {Set<Chunk>[]} 
					 */
					const getCombinations = key => {
						// vendor-chunk chunks
						const chunksSet = chunkSetsInGraph.get(key);

						// combinations
						var array = [chunksSet];

						// vendor-chunk 公用模块, 找出vendor-chunk 子片段
						if (chunksSet.size > 1) {
							
							for (const [count, setArray] of chunkSetsByCount) {
								// "equal" is not needed because they would have been merge in the first step
								// 尺寸比vendor-chunk小的
								if (count < chunksSet.size) {
									// 遍历找出vendor-chunk subset
									for (const set of setArray) {
										if (isSubset(chunksSet, set)) {
											array.push(set);
										}
									}
								}
							}
						}

						return array;
					};

					/**
					 * 
					 * @typedef {Object} SelectedChunksResult
					 * @property {Chunk[]} chunks the list of chunks
					 * @property {string} key a key of the list
					 */

					/**
					 * @typedef {function(Chunk): boolean} ChunkFilterFunction
					 */

					/** 
					 * chunks
					 * 	-> filter - {selecgedChunks, key}
					 * 	...
					 * @type {WeakMap<Set<Chunk>, WeakMap<ChunkFilterFunction, SelectedChunksResult>>} 
					 */
					const selectedChunksCacheByChunksSet = new WeakMap();

					/**
					 * 返回选择的chunks的列表和key
					 * get list and key by applying the filter function to the list
					 * It is cached for performance reasons
					 * @param {Set<Chunk>} chunks list of chunks
					 * @param {ChunkFilterFunction} chunkFilter filter function for chunks
					 * @returns {SelectedChunksResult} list and key
					 */
					const getSelectedChunks = (chunks, chunkFilter) => {
						// set/get cache
						let entry = selectedChunksCacheByChunksSet.get(chunks);
						if (entry === undefined) {
							entry = new WeakMap();
							selectedChunksCacheByChunksSet.set(chunks, entry);
						}

						/** @type {SelectedChunksResult} */
						let entry2 = entry.get(chunkFilter);

						if (entry2 === undefined) {
							/** @type {Chunk[]} */
							const selectedChunks = [];

							for (const chunk of chunks) {
								if (chunkFilter(chunk)) selectedChunks.push(chunk);
							}

							entry2 = {
								chunks: selectedChunks,
								key: getKey(selectedChunks)
							};
							entry.set(chunkFilter, entry2);
						}

						// return
						return entry2;
					};

					/**
					 * @typedef {Object} ChunksInfoItem
					 * @property {SortableSet} modules
					 * @property {TODO} cacheGroup
					 * @property {string} name
					 * @property {number} size
					 * @property {Set<Chunk>} chunks
					 * @property {Set<Chunk>} reuseableChunks
					 * @property {Set<string>} chunksKeys
					 */

					// Map a list of chunks to a list of modules
					// For the key the chunk "index" is used, the value is a SortableSet of modules
					
					/** 
					 * 记录最终的split chunk 信息
					 * @type {Map<string, ChunksInfoItem>} 
					 */
					const chunksInfoMap = new Map();

					/**
					 * 创建split-chunk ( 或更新信息 )
					 * @param {TODO} cacheGroup the current cache group
					 * @param {Chunk[]} selectedChunks chunks selected for this module
					 * @param {string} selectedChunksKey a key of selectedChunks
					 * @param {Module} module the current module
					 * @returns {void}
					 */
					const addModuleToChunksInfoMap = (
						cacheGroup,
						selectedChunks,
						selectedChunksKey,
						module
					) => {
						// Break if minimum number of chunks is not reached
						if (selectedChunks.length < cacheGroup.minChunks) return;

						// Determine name for split chunk
						const name = cacheGroup.getName(
							module,
							selectedChunks,
							cacheGroup.key
						);

						// Create key for maps
						// When it has a name we use the name as key
						// Elsewise we create the key from chunks and cache group key
						// This automatically merges equal names
						const key =
							(name && `name:${name}`) ||
							`chunks:${selectedChunksKey} key:${cacheGroup.key}`;

						// Add module to maps
						let info = chunksInfoMap.get(key);

						if (info === undefined) {
							chunksInfoMap.set(
								key,
								(info = {
									/**
									 * 包含的 modules
									 * 
									 */
									modules: new SortableSet(undefined, sortByIdentifier),

									/**
									 * cacheGroup
									 */
									cacheGroup,

									/**
									 * name
									 */
									name,

									/**
									 * the total size of module list
									 */
									size: 0,

									/**
									 * 包含的chunks
									 * 
									 * @example
									 * [
									 * 	"ChunkA","ChunkB", "ChunkC"
									 * ]
									 * 
									 * @type {Set<Chunk>}
									 */
									chunks: new Set(),

									/**
									 * @type {Set<Chunk>}
									 */
									reuseableChunks: new Set(),

									/**
									 * 包含的vendor-chunk key
									 * 
									 * @example
									 * [
									 * 	"1",
									 * 	"2,3",
									 * 	"1,2,3"
									 * ]
									 * 
									 * 
									 * @type {Set<String>}
									 */
									chunksKeys: new Set()
								})
							);
						} else {
							// 根据优先级更新 cacheGroup
							if (info.cacheGroup !== cacheGroup) {
								if (info.cacheGroup.priority < cacheGroup.priority) {
									info.cacheGroup = cacheGroup;
								}
							}
						}

						//
						// 更新 model 信息
						//
						info.modules.add(module);
						info.size += module.size();

						//
						// 更新 chunks 信息
						//
						if (!info.chunksKeys.has(selectedChunksKey)) {
							info.chunksKeys.add(selectedChunksKey);
							for (const chunk of selectedChunks) {
								info.chunks.add(chunk);
							}
						}
					};

					/**
					 * 4. 遍历modules - 获得split-chunk
					 */
					for (const module of compilation.modules) {
						//
						// 4.1 获得module belong to cache group
						//
						let cacheGroups = this.options.getCacheGroups(module);
						if (!Array.isArray(cacheGroups) || cacheGroups.length === 0) {
							continue;
						}

						//
						// 4.2 获得vendor-chunk combination
						//
						const chunksKey = getKey(module.chunksIterable);
						let combs = combinationsCache.get(chunksKey);
						if (combs === undefined) {
							combs = getCombinations(chunksKey);
							combinationsCache.set(chunksKey, combs);
						}

						//
						// 4.3 遍历cacheGroups
						//
						for (const cacheGroupSource of cacheGroups) {
							//
							// 4.3.1 创建Cache Group
							//
							const cacheGroup = {
								key: cacheGroupSource.key,
								priority: cacheGroupSource.priority || 0,
								chunksFilter:
									cacheGroupSource.chunksFilter || this.options.chunksFilter,
								minSize:
									cacheGroupSource.minSize !== undefined
										? cacheGroupSource.minSize
										: cacheGroupSource.enforce
											? 0
											: this.options.minSize,
								maxSize:
									cacheGroupSource.maxSize !== undefined
										? cacheGroupSource.maxSize
										: cacheGroupSource.enforce
											? 0
											: this.options.maxSize,
								minChunks:
									cacheGroupSource.minChunks !== undefined
										? cacheGroupSource.minChunks
										: cacheGroupSource.enforce
											? 1
											: this.options.minChunks,
								maxAsyncRequests:
									cacheGroupSource.maxAsyncRequests !== undefined
										? cacheGroupSource.maxAsyncRequests
										: cacheGroupSource.enforce
											? Infinity
											: this.options.maxAsyncRequests,
								maxInitialRequests:
									cacheGroupSource.maxInitialRequests !== undefined
										? cacheGroupSource.maxInitialRequests
										: cacheGroupSource.enforce
											? Infinity
											: this.options.maxInitialRequests,
								getName:
									cacheGroupSource.getName !== undefined
										? cacheGroupSource.getName
										: this.options.getName,
								filename:
									cacheGroupSource.filename !== undefined
										? cacheGroupSource.filename
										: this.options.filename,
								automaticNameDelimiter:
									cacheGroupSource.automaticNameDelimiter !== undefined
										? cacheGroupSource.automaticNameDelimiter
										: this.options.automaticNameDelimiter,
								reuseExistingChunk: cacheGroupSource.reuseExistingChunk
							};

							//
							// 4.3.2 遍历combinations
							//
							for (const chunkCombination of combs) {
								//
								// 筛选cache group
								//
								if (chunkCombination.size < cacheGroup.minChunks) continue;

								//
								// 获得selected chunk
								//
								const {
									chunks: selectedChunks,		// selected chunks
									key: selectedChunksKey		// selected vendor-chunk key
								} = getSelectedChunks(
									chunkCombination,
									cacheGroup.chunksFilter
								);

								//
								// 创建或更新split-chunk
								//
								addModuleToChunksInfoMap(
									cacheGroup,
									selectedChunks,
									selectedChunksKey,
									module
								);
							}
						}
					}

					/** 
					 * @type {Map<Chunk, {minSize: number, maxSize: number, automaticNameDelimiter: string}>} 
					 * */
					const maxSizeQueueMap = new Map();

					/**
					 * 5. 遍历split-chunk
					 */
					while (chunksInfoMap.size > 0) {
						// Find best matching entry
						let bestEntryKey;
						let bestEntry;

						//
						// 5.1 遍历split-chunk 找出最适合的split-chunk 优先处理
						//
						for (const pair of chunksInfoMap) {
							const key = pair[0];
							const info = pair[1];

							// size >= minSize
							if (info.size >= info.cacheGroup.minSize) {
								if (bestEntry === undefined) {
									bestEntry = info;
									bestEntryKey = key;
								} else if (compareEntries(bestEntry, info) < 0) {
									bestEntry = info;
									bestEntryKey = key;
								}
							}
						}

						// No suitable item left
						if (bestEntry === undefined) break;

						// 删除处理了的split-chunk
						const item = bestEntry;
						chunksInfoMap.delete(bestEntryKey);

						// new chunk name
						let chunkName = item.name;
						
						// Variable for the new chunk (lazy created)
						/** @type {Chunk} */
						let newChunk;

						// 
						// 5.2 When no chunk name, check if we can reuse a chunk instead of creating a new one
						//
						let isReused = false;
						if (item.cacheGroup.reuseExistingChunk) {
							outer: for (const chunk of item.chunks) {
								if (chunk.getNumberOfModules() !== item.modules.size) continue;
								if (chunk.hasEntryModule()) continue;
								for (const module of item.modules) {
									if (!chunk.containsModule(module)) continue outer;
								}
								if (!newChunk || !newChunk.name) {
									newChunk = chunk;
								} else if (
									chunk.name &&
									chunk.name.length < newChunk.name.length
								) {
									newChunk = chunk;
								} else if (
									chunk.name &&
									chunk.name.length === newChunk.name.length &&
									chunk.name < newChunk.name
								) {
									newChunk = chunk;
								}
								chunkName = undefined;
								isReused = true;
							}
						}

						// 跳过自身
						const usedChunks = Array.from(item.chunks).filter(chunk => {
							// skip if we address ourself
							return (
								(!chunkName || chunk.name !== chunkName) && chunk !== newChunk
							);
						});

						// Skip when no chunk selected
						if (usedChunks.length === 0) continue;

						//
						// 5.3 检查maxRequests是否满足条件
						//
						const chunkInLimit = usedChunks.filter(chunk => {
							// respect max requests when not enforced
							const maxRequests = chunk.isOnlyInitial()
								? item.cacheGroup.maxInitialRequests
								: chunk.canBeInitial()
									? Math.min(
											item.cacheGroup.maxInitialRequests,
											item.cacheGroup.maxAsyncRequests
									  )
									: item.cacheGroup.maxAsyncRequests;

							return !isFinite(maxRequests) || getRequests(chunk) < maxRequests;
						});

						if (chunkInLimit.length < usedChunks.length) {
							for (const module of item.modules) {
								addModuleToChunksInfoMap(
									item.cacheGroup,
									chunkInLimit,
									getKey(chunkInLimit),
									module
								);
							}
							continue;
						}

						// Create the new chunk if not reusing one
						if (!isReused) {
							newChunk = compilation.addChunk(chunkName);
						}
						// Walk through all chunks
						for (const chunk of usedChunks) {
							// Add graph connections for splitted chunk
							chunk.split(newChunk);
						}

						// Add a note to the chunk
						newChunk.chunkReason = isReused
							? "reused as split chunk"
							: "split chunk";
						if (item.cacheGroup.key) {
							newChunk.chunkReason += ` (cache group: ${item.cacheGroup.key})`;
						}
						if (chunkName) {
							newChunk.chunkReason += ` (name: ${chunkName})`;
							// If the chosen name is already an entry point we remove the entry point
							const entrypoint = compilation.entrypoints.get(chunkName);
							if (entrypoint) {
								compilation.entrypoints.delete(chunkName);
								entrypoint.remove();
								newChunk.entryModule = undefined;
							}
						}
						if (item.cacheGroup.filename) {
							if (!newChunk.isOnlyInitial()) {
								throw new Error(
									"SplitChunksPlugin: You are trying to set a filename for a chunk which is (also) loaded on demand. " +
										"The runtime can only handle loading of chunks which match the chunkFilename schema. " +
										"Using a custom filename would fail at runtime. " +
										`(cache group: ${item.cacheGroup.key})`
								);
							}
							newChunk.filenameTemplate = item.cacheGroup.filename;
						}
						if (!isReused) {
							// Add all modules to the new chunk
							for (const module of item.modules) {
								if (typeof module.chunkCondition === "function") {
									if (!module.chunkCondition(newChunk)) continue;
								}
								// Add module to new chunk
								GraphHelpers.connectChunkAndModule(newChunk, module);
								// Remove module from used chunks
								for (const chunk of usedChunks) {
									chunk.removeModule(module);
									module.rewriteChunkInReasons(chunk, [newChunk]);
								}
							}
						} else {
							// Remove all modules from used chunks
							for (const module of item.modules) {
								for (const chunk of usedChunks) {
									chunk.removeModule(module);
									module.rewriteChunkInReasons(chunk, [newChunk]);
								}
							}
						}

						if (item.cacheGroup.maxSize > 0) {
							const oldMaxSizeSettings = maxSizeQueueMap.get(newChunk);
							maxSizeQueueMap.set(newChunk, {
								minSize: Math.max(
									oldMaxSizeSettings ? oldMaxSizeSettings.minSize : 0,
									item.cacheGroup.minSize
								),
								maxSize: Math.min(
									oldMaxSizeSettings ? oldMaxSizeSettings.maxSize : Infinity,
									item.cacheGroup.maxSize
								),
								automaticNameDelimiter: item.cacheGroup.automaticNameDelimiter
							});
						}

						// remove all modules from other entries and update size
						for (const [key, info] of chunksInfoMap) {
							if (isOverlap(info.chunks, item.chunks)) {
								const oldSize = info.modules.size;
								for (const module of item.modules) {
									info.modules.delete(module);
								}
								if (info.modules.size === 0) {
									chunksInfoMap.delete(key);
									continue;
								}
								if (info.modules.size !== oldSize) {
									info.size = getModulesSize(info.modules);
									if (info.size < info.cacheGroup.minSize) {
										chunksInfoMap.delete(key);
									}
								}
							}
						}
					}

					// Make sure that maxSize is fulfilled
					for (const chunk of compilation.chunks.slice()) {
						const { minSize, maxSize, automaticNameDelimiter } =
							maxSizeQueueMap.get(chunk) || this.options.fallbackCacheGroup;
						if (!maxSize) continue;
						const results = deterministicGroupingForModules({
							maxSize,
							minSize,
							items: chunk.modulesIterable,
							getKey(module) {
								const ident = contextify(
									compilation.options.context,
									module.identifier()
								);
								const name = module.nameForCondition
									? contextify(
											compilation.options.context,
											module.nameForCondition()
									  )
									: ident.replace(/^.*!|\?[^?!]*$/g, "");
								const fullKey =
									name + automaticNameDelimiter + hashFilename(ident);
								return fullKey.replace(/[\\/?]/g, "_");
							},
							getSize(module) {
								return module.size();
							}
						});
						results.sort((a, b) => {
							if (a.key < b.key) return -1;
							if (a.key > b.key) return 1;
							return 0;
						});
						for (let i = 0; i < results.length; i++) {
							const group = results[i];
							const key = this.options.hidePathInfo
								? hashFilename(group.key)
								: group.key;
							let name = chunk.name
								? chunk.name + automaticNameDelimiter + key
								: null;
							if (name && name.length > 100) {
								name =
									name.slice(0, 100) +
									automaticNameDelimiter +
									hashFilename(name);
							}
							let newPart;
							if (i !== results.length - 1) {
								newPart = compilation.addChunk(name);
								chunk.split(newPart);
								newPart.chunkReason = chunk.chunkReason;
								// Add all modules to the new chunk
								for (const module of group.items) {
									if (typeof module.chunkCondition === "function") {
										if (!module.chunkCondition(newPart)) continue;
									}
									// Add module to new chunk
									GraphHelpers.connectChunkAndModule(newPart, module);
									// Remove module from used chunks
									chunk.removeModule(module);
									module.rewriteChunkInReasons(chunk, [newPart]);
								}
							} else {
								// change the chunk to be a part
								newPart = chunk;
								chunk.name = name;
							}
						}
					}
				}
			);
		});
	}
};
