const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Builds native libraries for arm64-v8a only.
 *
 * LiteRT-LM ships a large .so per ABI. A universal APK carried all four
 * (arm64-v8a, armeabi-v7a, x86, x86_64) and came to 105 MB, three quarters of
 * which no real phone uses — x86 is emulator-only and 32-bit ARM has not
 * shipped on a new Android phone for years.
 */
const withAbiFilter = (config, { architectures = 'arm64-v8a' } = {}) =>
  withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';
    const existing = cfg.modResults.find(
      (item) => item.type === 'property' && item.key === key,
    );
    if (existing) existing.value = architectures;
    else cfg.modResults.push({ type: 'property', key, value: architectures });
    return cfg;
  });

module.exports = withAbiFilter;
