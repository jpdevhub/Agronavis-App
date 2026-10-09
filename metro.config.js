const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support SVG files
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// The Expo project is the repo root, so keep Metro out of the parts of the repo
// that are not app source. `._*` are AppleDouble sidecars macOS writes on
// non-native volumes.
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList || []),
  /(^|\/)\._.*/,
  /\/backend\/(dist|node_modules|tests)\/.*/,
  /\/supabase\/.*/,
  /\/notebooks\/.*/,
  /\/android\/.*/,
];

module.exports = config;
