const { withXcodeProject, withInfoPlist } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const SWIFT_FILES = [
  "LogTransactionIntent.swift",
  "ScimpShortcuts.swift",
  "TransactionSyncModule.swift",
];

function withAppIntents(config) {
  config = withInfoPlist(config, (config) => {
    return config;
  });

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const targetName = config.modRequest.projectName;
    const mainGroup = project.getFirstProject().firstProject.mainGroup;

    const groupName = "AppIntents";
    let appIntentsGroupId = null;

    const groups = project.hash.project.objects["PBXGroup"];
    for (const key in groups) {
      if (typeof groups[key] === "object" && groups[key].name === groupName) {
        appIntentsGroupId = key;
        break;
      }
    }

    if (!appIntentsGroupId) {
      appIntentsGroupId = project.pbxCreateGroup(groupName, groupName);
      const mainGroupObj = groups[mainGroup];
      if (mainGroupObj && mainGroupObj.children) {
        mainGroupObj.children.push({
          value: appIntentsGroupId,
          comment: groupName,
        });
      }
    }

    const iosSourceDir = path.join(config.modRequest.projectRoot, "ios");
    const iosTargetDir = path.join(
      config.modRequest.platformProjectRoot,
      targetName
    );

    for (const fileName of SWIFT_FILES) {
      const srcFile = path.join(iosSourceDir, fileName);
      const destFile = path.join(iosTargetDir, fileName);

      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
      }

      const existingFile = project.getFirstTarget().firstTarget.buildPhases
        .flatMap((phase) => {
          const sources =
            project.hash.project.objects["PBXSourcesBuildPhase"][phase.value];
          return sources ? sources.files || [] : [];
        })
        .find((f) => {
          const ref =
            project.hash.project.objects["PBXBuildFile"][f.value];
          if (!ref) return false;
          const fileRef =
            project.hash.project.objects["PBXFileReference"][ref.fileRef];
          return fileRef && fileRef.name === fileName;
        });

      if (!existingFile) {
        project.addSourceFile(
          `${targetName}/${fileName}`,
          { target: project.getFirstTarget().uuid },
          appIntentsGroupId
        );
      }
    }

    const buildConfigs =
      project.hash.project.objects["XCBuildConfiguration"];
    for (const key in buildConfigs) {
      const config_obj = buildConfigs[key];
      if (typeof config_obj !== "object" || !config_obj.buildSettings) continue;

      if (
        config_obj.buildSettings.PRODUCT_BUNDLE_IDENTIFIER ||
        config_obj.buildSettings.INFOPLIST_FILE
      ) {
        const deployTarget =
          config_obj.buildSettings.IPHONEOS_DEPLOYMENT_TARGET;
        if (!deployTarget || parseFloat(deployTarget) < 16.0) {
          config_obj.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.0";
        }
      }
    }

    return config;
  });

  return config;
}

module.exports = withAppIntents;
