// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // `._*` are AppleDouble sidecars the OS writes on non-native volumes.
    // backend/ and packages/ have their own configs and are linted by their
    // own workspace scripts; everything else here is not source.
    ignores: [
      'dist/*',
      '.expo/*',
      '**/._*',
      'backend/**',
      'packages/**',
      'android/**',
      'ios/**',
      'supabase/**',
      'scripts/**',
      'docs/**',
      'notebooks/**',
    ],
  },
]);
