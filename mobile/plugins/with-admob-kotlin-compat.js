const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Expo SDK 54's KSP maxes out at Kotlin 2.2.20, while AdMob 25.4.x
 * ships Kotlin 2.3 metadata. Skip the compiler metadata check so the
 * ads module can compile on the Expo-supported Kotlin line.
 */
module.exports = function withAdmobKotlinCompat(config) {
  return withProjectBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== "groovy") {
      return modConfig;
    }

    const marker = "with-admob-kotlin-compat";
    if (modConfig.modResults.contents.includes(marker)) {
      return modConfig;
    }

    modConfig.modResults.contents += `
// ${marker}
subprojects { subproject ->
  subproject.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      freeCompilerArgs += ["-Xskip-metadata-version-check"]
    }
  }
}
`;

    return modConfig;
  });
};
