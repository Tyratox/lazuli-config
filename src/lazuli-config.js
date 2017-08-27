const logger = require("lazuli-logger");

const util = require("util");
const fs = require("fs");
const path = require("path");

const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);

//First of all we have to find the applications root directory
let root = __dirname.split("node_modules")[0];
logger.log("info", "Found root directory: ", root);

let config;

stat(path.join(root, "config.json"))
	.then(stats => {
		if (stats.isFile()) {
			config = require(path.join(root, "config.json"));
		} else {
			config = require(path.join(root, "config-sample.json"));
		}

		logger.log("info", "Loaded root config");

		logger.log(
			"info",
			"Searching ",
			path.join(root, "node_modules"),
			" for lazuli modules.."
		);

		return readdir(path.join(root, "node_modules"));
	})
	.then(files => {
		return Promise.all(
			files.map(file => {
				if (file.startsWith("lazuli-")) {
					return stat(path.join(root, file)).then(() => {
						stats => {
							if (stats.isDirectory()) {
								//valid lazuli module
								return Promise.resolve(file);
							}
						};
					});
				} else {
					return Promise.resolve(null);
				}
			})
		);
	})
	.then(moduleArray => {
		return Promise.all(
			moduleArray.filter(module => module).map(module => {
				return stat(path.join(root, file, "config-sample.json")).then(stats => {
					if (stats.isFile()) {
						logger.log("info", "Found config-sample.json for ", file);
						return Promise.resolve(
							require(path.join(root, file, "config-sample.json"))
						);
					} else {
						return Promise.resolve(null);
					}
				});
			})
		);
	})
	.then(optionsArray => {
		let defaultOptions = {};

		optionsArray.filter(options => options).forEach(options => {
			for (let key in options) {
				if (!options.hasOwnProperty(key)) {
					continue;
				}

				if (key in defaultOptions) {
					logger.log(
						"warning",
						"Option key " +
							key +
							" is defined in multiple config-sample.json files! Overriding " +
							key +
							": " +
							defaultOptions[key] +
							" to " +
							key +
							": " +
							options[key]
					);
				}

				defaultOptions[key] = options[key];
			}
		});

		for (let key in defaultOptions) {
			if (!defaultOptions.hasOwnProperty(key)) {
				continue;
			}

			if (!key in config) {
				logger.log(
					"info",
					"Option key " +
						key +
						" wasn't defined in the global config. Using default option " +
						defaultOptions[key]
				);
				config[key] = defaultOptions[key];
			}
		}

		return writeFile(
			path.join(root, "config.json"),
			JSON.stringify(config),
			"utf8"
		);
	})
	.then(() => {
		logger.log(
			"info",
			"Successfully loaded all lazuli options and wrote configuration to " +
				path.join(root, "config.json")
		);
	})
	.catch(err => {
		throw err;
		process.exit(1);
	});

module.exports = config;
