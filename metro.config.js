// Load environment variables
require('dotenv').config();

// Polyfill for Node.js < 20
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function() {
    return this.slice().reverse();
  };
}

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// pdfjs-dist ships a Node-only `require("canvas")` path (NodeCanvasFactory) that Metro
// tries to resolve at bundle time. We only use pdfjs in the browser (DOM canvas), so the
// native `canvas` module is never executed — stub it to an empty module to unblock bundling.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'canvas') {
    return { type: 'empty' };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
