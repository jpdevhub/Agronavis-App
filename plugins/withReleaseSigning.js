const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Signs release builds with a real keystore.
 *
 * Expo's template points the release build type at the shared debug key, and an
 * APK signed with that can neither be updated in place nor shipped to Play.
 * No-ops unless the four ANDROID_* variables are set, so local prebuilds and
 * EAS are untouched.
 */
const KEYSTORE_ENV = [
  'ANDROID_KEYSTORE_FILE',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD',
];

/** Exported so the transform can be exercised without running a prebuild. */
function injectReleaseSigning(gradle) {
    if (gradle.includes('_AGRONAVIS_RELEASE_SIGNING_')) return gradle;

    const release = `
        // _AGRONAVIS_RELEASE_SIGNING_
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_FILE"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }`;

    gradle = gradle.replace(
      /(signingConfigs\s*\{)/,
      (match) => `${match}${release}`,
    );

    // Only the release build type moves; debug keeps the debug key.
    gradle = gradle.replace(
      /(release\s*\{\s*(?:\/\/[^\n]*\n\s*)*)signingConfig signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release',
    );

    if (!gradle.includes('signingConfig signingConfigs.release')) {
      throw new Error(
        'withReleaseSigning: could not find the release build type in app/build.gradle. ' +
          'The Expo template has changed — update this plugin.',
      );
    }

    return gradle;
}

const withReleaseSigning = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (KEYSTORE_ENV.some((key) => !process.env[key])) return cfg;
    cfg.modResults.contents = injectReleaseSigning(cfg.modResults.contents);
    return cfg;
  });

module.exports = withReleaseSigning;
module.exports.injectReleaseSigning = injectReleaseSigning;
