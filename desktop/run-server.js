const path = require("path");

process.chdir(path.dirname(__dirname));

require(path.join(__dirname, "..", ".next", "standalone", "server.js"));
