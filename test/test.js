import test from "ava";
const fs = require("fs");
const path = require("path");
const util = require("util");

const unlink = util.promisify(fs.unlink);

const config = require("../src/lazuli-config.js");

test("load empty config", t => {
	t.deepEqual(config, {});
});

test.after.always("remove generated config.json", t => {
	return unlink(path.resolve(__dirname, "..", "src", "config.json"));
});
