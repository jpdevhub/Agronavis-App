const { withGradleProperties, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Packages native libraries for arm64-v8a only.
 *
 * LiteRT-LM ships a large .so per ABI. A universal APK carried all four
 * (arm64-v8a, armeabi-v7a, x86, x86_64) and came to 105 MB, three quarters of
 * which no real phone uses — x86 is emulator-only and 32-bit ARM has not
 * shipped on a new Android phone for years.
 *
 * Two settings are needed, and only one of them is obvious:
 *
 *  * `reactNativeArchitectures` tells React Native's own Gradle plugin which
 *    ABIs to *build*. It says nothing about what gets *packaged*.
 *  * `ndk.abiFilters` decides what ends up in the APK, including the prebuilt
 *    .so files inside third-party AARs. Without it the LiteRT runtime's other
 *    three ABIs are still packaged even though nothing can load them.
 */
const ABI = 'arm64-v8a';

const withAbiFilter = (config, { architectures = ABI } = {}) => {
  config = withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';
    const existing = cfg.modResults.find(
      (item) => item.type === 'property' && item.key === key,
    );
    if (existing) existing.value = architectures;
    else cfg.modResults.push({ type: 'property', key, value: architectures });
    return cfg;
  });

  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    if (cfg.modResults.contents.includes('abiFilters')) return cfg;

    const filters = architectures
      .split(',')
      .map((a) => `"${a.trim()}"`)
      .join(', ');

    // Anchored on versionName, which sits inside defaultConfig in every Expo
    // template; appending to the block's end would be ambiguous.
    cfg.modResults.contents = cfg.modResults.contents.replace(
      /(defaultConfig\s*\{[\s\S]*?versionName\s+[^\n]*\n)/,
      `$1        ndk {\n            abiFilters ${filters}\n        }\n`,
    );

    return cfg;
  });
};

module.exports = withAbiFilter;
