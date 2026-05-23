/**
 * Comprehensive monorepo fix for native modules that can't find react-native.
 *
 * Problems fixed:
 *   - @react-native-picker/picker → reads REACT_NATIVE_NODE_MODULES_DIR
 *   - react-native-gesture-handler → reads rootProject.ext.REACT_NATIVE_DIR
 *
 * Root cause: npm workspaces hoists react-native to the monorepo root
 * node_modules. Native modules use relative paths that break when react-native
 * isn't at the same node_modules level as themselves.
 *
 * Strategy:
 *   1. Use pure Groovy (no `node` command) to check both hoisted and
 *      non-hoisted locations for react-native.
 *   2. Set REACT_NATIVE_DIR directly on the ROOT PROJECT's ext so RNGH's
 *      safeExtGet("REACT_NATIVE_DIR") (which calls rootProject.ext.get())
 *      can find it.
 *   3. Also propagate via subprojects{} for other native modules that read
 *      from their own project.ext.
 *
 * Paths (rootDir = apps/mobile/android/):
 *   ../node_modules/react-native      → apps/mobile/node_modules/react-native
 *   ../../../node_modules/react-native → <monorepo-root>/node_modules/react-native (hoisted)
 */
const { withProjectBuildGradle } = require("@expo/config-plugins");

const withReactNativePickerFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes("REACT_NATIVE_DIR")) {
      // Already patched, skip
      return config;
    }

    const injection = `
// ─── Monorepo Fix ────────────────────────────────────────────────────────────
// Resolves react-native location for native modules in a monorepo where npm
// workspaces may hoist react-native to the root node_modules.
// Uses pure Groovy file checks — no dependency on 'node' being in PATH.
def _reactNativeDir = null
def _rnCandidates = [
    new File(rootDir, "../node_modules/react-native"),          // non-hoisted: apps/mobile/node_modules
    new File(rootDir, "../../../node_modules/react-native"),    // hoisted: <monorepo-root>/node_modules
]
for (def candidate : _rnCandidates) {
    if (candidate.exists() && new File(candidate, "ReactAndroid/gradle.properties").exists()) {
        _reactNativeDir = candidate
        break
    }
}
if (_reactNativeDir != null) {
    // Set on ROOT PROJECT ext directly — read by RNGH via rootProject.ext.get("REACT_NATIVE_DIR")
    ext.REACT_NATIVE_DIR = _reactNativeDir
    ext.REACT_NATIVE_NODE_MODULES_DIR = _reactNativeDir.parentFile
    // Also propagate to all subprojects for other native modules
    subprojects {
        ext.REACT_NATIVE_DIR = _reactNativeDir
        ext.REACT_NATIVE_NODE_MODULES_DIR = _reactNativeDir.parentFile
    }
    logger.lifecycle("[MonorepoFix] react-native resolved at: " + _reactNativeDir.absolutePath)
} else {
    logger.warn("[MonorepoFix] WARNING: Could not resolve react-native location!")
}
// ─────────────────────────────────────────────────────────────────────────────
`;

    config.modResults.contents = contents + injection;
    return config;
  });
};

module.exports = withReactNativePickerFix;
