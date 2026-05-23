/**
 * Comprehensive monorepo fix for ALL native modules hoisted to root node_modules.
 *
 * ROOT CAUSE:
 *   npm workspaces hoists native modules AND react-native to root node_modules.
 *   Native packages' build.gradle files use relative paths or pass incorrect
 *   paths to CMake that only work in a flat (non-monorepo) node_modules layout.
 *
 * STRATEGY: Create symlinks from expected sibling paths → actual react-native paths.
 *   This is more robust than copying individual files because:
 *   - Symlinks give access to ALL files in those directories (cmake-utils, etc.)
 *   - No need to know which specific files each package needs
 *   - No file duplication
 *
 * SYMLINKS CREATED (in root node_modules):
 *   ReactAndroid/ → react-native/ReactAndroid/
 *     Fixes: react-native-gesture-handler (ReactAndroid/gradle.properties)
 *            react-native-worklets (ReactAndroid/cmake-utils/folly-flags.cmake)
 *            react-native-reanimated (ReactAndroid/cmake-utils/*)
 *
 *   ReactCommon/ → react-native/ReactCommon/
 *     Fixes: react-native-worklets (ReactCommon/cmake-utils/react-native-flags.cmake)
 *            react-native-reanimated (ReactCommon/cmake-utils/*)
 *
 *   gradle/ → react-native/gradle/
 *     Fixes: react-native-svg (gradle/libs.versions.toml)
 *
 * EXT PROPERTIES SET (for @react-native-picker/picker and similar):
 *   REACT_NATIVE_DIR = react-native directory
 *   REACT_NATIVE_NODE_MODULES_DIR = node_modules directory
 */
const { withProjectBuildGradle } = require("@expo/config-plugins");

const withMonorepoFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes("_MONOREPO_FIX_")) {
      return config;
    }

    const injection = `
// _MONOREPO_FIX_ ──────────────────────────────────────────────────────────────
// Fixes native modules that break when npm workspaces hoists them to root.
// Creates symlinks so all packages find react-native's subdirectories.

def _rnDir = null
def _rnCandidates = [
    new File(rootDir, "../node_modules/react-native"),        // non-hoisted
    new File(rootDir, "../../../node_modules/react-native"),  // hoisted to monorepo root
]
for (def _c : _rnCandidates) {
    if (_c.exists() && new File(_c, "ReactAndroid/gradle.properties").exists()) {
        _rnDir = _c
        break
    }
}

if (_rnDir != null) {
    def _nodeModulesDir = _rnDir.parentFile
    logger.lifecycle("[MonorepoFix] react-native at: " + _rnDir.canonicalPath)

    // ── Ext properties (for @react-native-picker/picker etc.) ──────────────
    ext.REACT_NATIVE_DIR = _rnDir
    ext.REACT_NATIVE_NODE_MODULES_DIR = _nodeModulesDir
    subprojects {
        project.ext.REACT_NATIVE_DIR = _rnDir
        project.ext.REACT_NATIVE_NODE_MODULES_DIR = _nodeModulesDir
    }

    // ── Symlinks ───────────────────────────────────────────────────────────
    // Create sibling symlinks so packages can find react-native's directories
    // regardless of how they construct paths internally or pass args to CMake.
    //
    //   node_modules/ReactAndroid/ → react-native/ReactAndroid/
    //   node_modules/ReactCommon/  → react-native/ReactCommon/
    //   node_modules/gradle/       → react-native/gradle/
    //
    def _symlinkDirs = ["ReactAndroid", "ReactCommon", "gradle"]
    for (def _dirname : _symlinkDirs) {
        def _source = new File(_rnDir, _dirname)
        def _link   = new File(_nodeModulesDir, _dirname)
        if (_source.exists()) {
            if (!_link.exists()) {
                try {
                    java.nio.file.Files.createSymbolicLink(
                        _link.toPath(),
                        _source.toPath()
                    )
                    logger.lifecycle("[MonorepoFix] Symlinked: node_modules/" + _dirname + " -> react-native/" + _dirname)
                } catch (Exception _e) {
                    // Symlink failed — fall back to copying key files
                    logger.warn("[MonorepoFix] Symlink failed for " + _dirname + ": " + _e.message + " — falling back to file copy")
                    _link.mkdirs()
                    ant.copy(todir: _link.absolutePath, overwrite: false) {
                        fileset(dir: _source.absolutePath)
                    }
                }
            } else {
                logger.lifecycle("[MonorepoFix] Already exists: node_modules/" + _dirname)
            }
        } else {
            logger.warn("[MonorepoFix] Source not found: react-native/" + _dirname)
        }
    }

} else {
    logger.warn("[MonorepoFix] WARNING: react-native not found in any candidate path!")
}
// ─────────────────────────────────────────────────────────────────────────────
`;

    config.modResults.contents = contents + injection;
    return config;
  });
};

module.exports = withMonorepoFix;
