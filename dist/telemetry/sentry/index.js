"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sentry = exports.DEFAULT_SENTRY_CONFIG = exports.closeSentry = exports.getSentry = exports.initSentry = void 0;
var init_js_1 = require("./init.js");
Object.defineProperty(exports, "initSentry", { enumerable: true, get: function () { return init_js_1.initSentry; } });
Object.defineProperty(exports, "getSentry", { enumerable: true, get: function () { return init_js_1.getSentry; } });
Object.defineProperty(exports, "closeSentry", { enumerable: true, get: function () { return init_js_1.closeSentry; } });
var config_js_1 = require("./config.js");
Object.defineProperty(exports, "DEFAULT_SENTRY_CONFIG", { enumerable: true, get: function () { return config_js_1.DEFAULT_SENTRY_CONFIG; } });
// Re-export Sentry SDK for manual usage
const init_js_2 = require("./init.js");
const { Sentry } = (0, init_js_2.getSentry)();
exports.Sentry = Sentry;
//# sourceMappingURL=index.js.map