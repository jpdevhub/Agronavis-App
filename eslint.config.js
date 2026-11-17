// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Biome formats; ESLint is here for the Expo and React rules Biome has
    // no equivalent for. `._*` are AppleDouble sidecars the OS writes on
    // non-native volumes. `packages/` lints itself through its own workspace
    // script; the rest is not source.
    ignores: [
      'dist/*',
      '.expo/*',
      '**/._*',
      'packages/**',
      'android/**',
      'ios/**',
      'scripts/**',
      'docs/**',
      'notebooks/**',
    ],
  },
]);
