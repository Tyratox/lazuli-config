const path = require("path");

const root = __dirname.split("node_modules")[0];

/**
 * The global lazuli configuration file
 * @type {Object}
 */
const config = require(path.join(root, "config.json"));

export default config;
