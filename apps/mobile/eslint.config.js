// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // `._*` are AppleDouble sidecars the OS writes on non-native volumes.
    ignores: ['dist/*', '.expo/*', '**/._*'],
  },
]);
