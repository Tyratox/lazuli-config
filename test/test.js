import test from "ava";
const fs = require("fs");
const path = require("path");
const util = require("util");

global.APP_ROOT = path.resolve(__dirname, "..");

const unlink = util.promisify(fs.unlink);

const config = require("../src/lazuli-config.js");

test("load empty config", t => {
	t.true(
		config.APP_ROOT.endsWith("lazuli-config"),
		"The APP_ROOT key wasn't set correctly"
	);
	t.deepEqual(
		Object.keys(config),
		["APP_ROOT"],
		"The generated (empty) config isn't empty"
	);
});

test.after.always("remove generated config.json", t => {
	return unlink(path.resolve(__dirname, "..", "config.json"));
});
