const fs = require("fs");
const path = require("path");

const statSync = fs.statSync;
const readdirSync = fs.readdirSync;
const writeFileSync = fs.writeFileSync;
const existsSync = fs.existsSync;

//First of all we have to find the applications root directory
let root = __dirname.split("node_modules")[0];
console.log("info", "Found root directory: ", root);

/**
 * Scans a directory for lazuli modules and adds their default values from
 * config-sample to the config object if the key isn't present yet
 * @param  {Object} config The config object
 * @param  {String} folder The folder to scan
 * @return {Promise}       A promise to check for the success
 */
const scanDirectorySync = (config, folder) => {
	folder = path.join(folder, "node_modules");
	if (!existsSync(folder)) {
		return;
	}

	console.log("info", "scanning", folder, "...");

	const files = readdirSync(folder);
	let defaultOptions = {};

	files
		.filter(file => {
			if (file.startsWith("lazuli-")) {
				if (
					existsSync(path.join(folder, file)) &&
					statSync(path.join(folder, file)).isDirectory()
				) {
					//valid lazuli module
					return true;
				}
			}

			return false;
		})
		.map(module => {
			if (
				existsSync(path.join(folder, module, "config-sample.json")) &&
				statSync(path.join(folder, module, "config-sample.json")).isFile()
			) {
				console.log("info", "Found config-sample.json for", module);
				return require(path.join(folder, module, "config-sample.json"));
			} else {
				return null;
			}
		})
		.filter(options => options)
		.forEach(options => {
			for (let key in options) {
				if (!options.hasOwnProperty(key)) {
					continue;
				}

				if (key in defaultOptions) {
					console.log(
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

		if (!config.hasOwnProperty(key)) {
			console.log(
				"info",
				"Option key " +
					key +
					" wasn't defined in the global config. Using default option " +
					defaultOptions[key]
			);
			config[key] = defaultOptions[key];
		}
	}

	return config;
};

let config;

if (existsSync(path.join(root, "config.json"))) {
	console.log("info", "importing config.json ...");
	config = require(path.join(root, "config.json"));
} else if (existsSync(path.join(root, "config-sample.json"))) {
	console.log("info", "importing config-sample.json ...");
	config = require(path.join(root, "config-sample.json"));
} else {
	console.log("info", "no config found!");
	config = {};
}

Object.assign(config, { APP_ROOT: root });

scanDirectorySync(config, root);
scanDirectorySync(config, path.resolve(__dirname, ".."));

writeFileSync(
	path.join(root, "config.json"),
	JSON.stringify(config, null, 4),
	"utf8"
);

console.log(
	"info",
	"Successfully loaded",
	Object.keys(config).length,
	"lazuli options and wrote configuration to " + path.join(root, "config.json")
);

/**
 * The combined config object
 * @type {Object}
 */
module.exports = config;
