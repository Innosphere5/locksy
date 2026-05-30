const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase resolution fixes
config.resolver.sourceExts.push('mjs');

module.exports = config;
