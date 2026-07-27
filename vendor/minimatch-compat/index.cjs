"use strict";

const nativeMinimatch = require("minimatch-native");

// Keep the callable CommonJS/default-export shape used by older ESLint
// plugins while exposing the fixed minimatch 10 API for newer consumers.
const exported = nativeMinimatch.minimatch;
Object.assign(exported, nativeMinimatch);
exported.default = exported;

module.exports = exported;
