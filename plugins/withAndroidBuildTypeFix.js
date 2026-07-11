const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: withAndroidBuildTypeFix
 *
 * Problem:
 *   AGP 8.x (used on EAS Build servers) requires every android library sub-project
 *   to declare at least one build variant (debug/release). Many older React Native
 *   libraries (react-native-webrtc, incall-manager, get-random-values, async-storage,
 *   safe-area-context, screens, svg) do not declare buildTypes in their
 *   android/build.gradle, causing the build to fail with:
 *     "No matching variant of project :X was found. ... No variants exist."
 *
 * Fix:
 *   Uses gradle.afterProject { } which fires after EACH project is evaluated —
 *   unlike subprojects { afterEvaluate { } } which throws
 *   "Cannot run afterEvaluate when project is already evaluated" on Gradle 8.x.
 *
 * Why a config plugin:
 *   EAS Build runs expo prebuild on the cloud server before every Gradle build,
 *   regenerating android/ from scratch. This plugin hooks into prebuild and
 *   re-applies the fix every time automatically.
 */
const withAndroidBuildTypeFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    // Guard: don't add the block twice
    if (contents.includes('gradle.afterProject')) {
      return config;
    }

    const fixBlock = `
// Fix: AGP 8.x buildTypes injection
// AGP 8.x requires every com.android.library subproject to declare at least
// one build variant. Older RN libraries (webrtc, incall-manager, screens, etc.)
// omit buildTypes entirely, causing "No variants exist" resolution failures.
// Uses gradle.afterProject which fires after each project is evaluated — safe on Gradle 8.x.
gradle.afterProject { project ->
    if (project.plugins.hasPlugin("com.android.library")) {
        if (!project.android.buildTypes.findByName("release")) {
            project.android.buildTypes {
                release {
                    minifyEnabled false
                }
            }
        }
        if (!project.android.buildTypes.findByName("debug")) {
            project.android.buildTypes {
                debug {
                    minifyEnabled false
                }
            }
        }
    }
}
`;

    config.modResults.contents = contents + fixBlock;
    return config;
  });
};

module.exports = withAndroidBuildTypeFix;

