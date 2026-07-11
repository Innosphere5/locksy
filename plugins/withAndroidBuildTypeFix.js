const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: withAndroidBuildTypeFix (Matching Fallbacks)
 *
 * Problem:
 *   AGP 8.x (used on EAS Build servers) requires every android library sub-project
 *   to declare at least one build variant (debug/release). Many older React Native
 *   libraries (webrtc, incall-manager, get-random-values, async-storage,
 *   safe-area-context, screens, svg) do not declare buildTypes in their
 *   android/build.gradle, causing the build to fail with:
 *     "No matching variant of project :X was found. ... No variants exist."
 *
 * Fix:
 *   Instead of modifying the subprojects themselves, we instruct the consumer (:app)
 *   to fallback to 'debug' variants if a dependency does not contain a 'release' variant.
 *   This is standard Gradle behavior and is extremely stable.
 */
const withAndroidMatchingFallbacks = (config) => {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Guard: don't add matchingFallbacks if already present
    if (contents.includes("matchingFallbacks = ['debug']")) {
      return config;
    }

    // Insert matchingFallbacks = ['debug'] inside the release buildType block
    const releaseRegex = /(release\s*\{)/;
    if (releaseRegex.test(contents)) {
      contents = contents.replace(releaseRegex, "$1\n            matchingFallbacks = ['debug']");
    }

    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withAndroidMatchingFallbacks;
