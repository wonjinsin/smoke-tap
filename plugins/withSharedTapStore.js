const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const WIDGET_TARGET = 'ExpoWidgetsTarget';
const APP_TARGET = 'SmokeTap';
const APP_GROUP = 'group.com.example.smoketap';

// ── Widget extension ──────────────────────────────────────────────────────────

const SHARED_TAP_STORE_SWIFT = `import Foundation

struct SharedTapStore {
    static let appGroupId = "${APP_GROUP}"
    static let pendingKey = "pendingTaps"
    static let baseKey   = "baseTodayCount"

    static func recordTap() {
        guard let d = UserDefaults(suiteName: appGroupId) else { return }
        d.set(d.integer(forKey: pendingKey) + 1, forKey: pendingKey)
    }
    static func getPendingCount() -> Int {
        UserDefaults(suiteName: appGroupId)?.integer(forKey: pendingKey) ?? 0
    }
    static func getBaseCount() -> Int {
        UserDefaults(suiteName: appGroupId)?.integer(forKey: baseKey) ?? 0
    }
}
`;

const RECORD_TAP_INTENT_SWIFT = `import AppIntents
import WidgetKit

@available(iOS 17.0, *)
struct RecordTapIntent: AppIntent {
    static var title: LocalizedStringResource = "Record Tap"
    static var isDiscoverable: Bool = false

    func perform() async throws -> some IntentResult {
        SharedTapStore.recordTap()
        WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")
        return .result()
    }
}
`;

// Fully native widget — replaces expo-widgets generated SmokeTapWidget.swift
const SMOKE_TAP_WIDGET_SWIFT = `import WidgetKit
import SwiftUI
import AppIntents

struct SmokeTapEntry: TimelineEntry {
    let date: Date
    let count: Int
}

struct SmokeTapProvider: TimelineProvider {
    func placeholder(in context: Context) -> SmokeTapEntry {
        SmokeTapEntry(date: Date(), count: 0)
    }
    func getSnapshot(in context: Context, completion: @escaping (SmokeTapEntry) -> Void) {
        completion(SmokeTapEntry(date: Date(), count: SharedTapStore.getBaseCount() + SharedTapStore.getPendingCount()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<SmokeTapEntry>) -> Void) {
        let entry = SmokeTapEntry(date: Date(), count: SharedTapStore.getBaseCount() + SharedTapStore.getPendingCount())
        completion(Timeline(entries: [entry], policy: .never))
    }
}

private extension Color {
    init(hex: String) {
        var int: UInt64 = 0
        Scanner(string: hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)).scanHexInt64(&int)
        self.init(red: Double((int >> 16) & 0xFF) / 255, green: Double((int >> 8) & 0xFF) / 255, blue: Double(int & 0xFF) / 255)
    }
}

struct SmokeTapWidgetView: View {
    let entry: SmokeTapEntry
    var body: some View {
        VStack(spacing: 4) {
            Text("오늘")
                .font(.system(size: 10, weight: .semibold))
                .foregroundColor(Color(hex: "5c5854"))
            Text("\\(entry.count)")
                .font(.system(size: 44, weight: .bold))
                .foregroundColor(Color(hex: "f0ece6"))
            Text("회")
                .font(.system(size: 11))
                .foregroundColor(Color(hex: "8c8580"))
            if #available(iOS 17.0, *) {
                Button(intent: RecordTapIntent()) {
                    Text("+")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundColor(Color(hex: "121110"))
                        .frame(width: 32, height: 32)
                        .background(Color(hex: "e8991a"))
                        .clipShape(Circle())
                }.buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .containerBackground(Color(hex: "121110"), for: .widget)
    }
}

struct SmokeTapWidget: Widget {
    let name = "SmokeTapWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: name, provider: SmokeTapProvider()) { entry in
            SmokeTapWidgetView(entry: entry)
        }
        .configurationDisplayName("Smoke Tap")
        .description("오늘 흡연 횟수를 기록하세요")
        .supportedFamilies([.systemSmall])
    }
}
`;

// ── Main app ──────────────────────────────────────────────────────────────────

const SHARED_TAP_STORE_MAIN_APP_SWIFT = `import Foundation
import WidgetKit

struct SharedTapStoreMainApp {
    static let appGroupId = "${APP_GROUP}"
    static let pendingKey = "pendingTaps"
    static let baseKey   = "baseTodayCount"

    static func getPendingCount() -> Int {
        UserDefaults(suiteName: appGroupId)?.integer(forKey: pendingKey) ?? 0
    }
    static func clearPending() {
        UserDefaults(suiteName: appGroupId)?.set(0, forKey: pendingKey)
    }
    static func setBaseCount(_ count: Int) {
        UserDefaults(suiteName: appGroupId)?.set(count, forKey: baseKey)
        WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")
    }
}
`;

const SHARED_TAP_STORE_MODULE_SWIFT = `internal import ExpoModulesCore

class SharedTapStoreModule: Module {
    func definition() -> ModuleDefinition {
        Name("SharedTapStore")
        AsyncFunction("getPendingCount") { () -> Int in SharedTapStoreMainApp.getPendingCount() }
        AsyncFunction("clearPending")    { () -> Void in SharedTapStoreMainApp.clearPending() }
        AsyncFunction("setBaseCount")    { (count: Int) -> Void in SharedTapStoreMainApp.setBaseCount(count) }
    }
}
`;

// ── Plugin ────────────────────────────────────────────────────────────────────

module.exports = function withSharedTapStore(config) {
  // 1. Write main-app Swift files only.
  //    Widget files (SharedTapStore.swift, RecordTapIntent.swift, SmokeTapWidget.swift)
  //    are written by scripts/patch-widget.js AFTER prebuild, because expo-widgets
  //    overwrites ExpoWidgetsTarget/ after this dangerous-mod phase.
  config = withDangerousMod(config, ['ios', async (config) => {
    const iosDir = path.join(config.modRequest.projectRoot, 'ios');
    const appDir = path.join(iosDir, APP_TARGET);

    fs.mkdirSync(appDir, { recursive: true });

    fs.writeFileSync(path.join(appDir, 'SharedTapStoreMainApp.swift'), SHARED_TAP_STORE_MAIN_APP_SWIFT);
    fs.writeFileSync(path.join(appDir, 'SharedTapStoreModule.swift'),  SHARED_TAP_STORE_MODULE_SWIFT);

    return config;
  }]);

  // 2. Register new Swift files in the Xcode project
  config = withXcodeProject(config, (config) => {
    const proj = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosDir = path.join(projectRoot, 'ios');

    // Avoid duplicate entries on repeated prebuild runs
    const alreadyAdded = Object.values(proj.pbxBuildFileSection()).some(
      f => f && f.fileRef_comment === 'SharedTapStore.swift'
    );
    if (alreadyAdded) return config;

    // Find target UUIDs
    let widgetKey, appKey;
    Object.entries(proj.pbxNativeTargetSection()).forEach(([uuid, t]) => {
      if (uuid.endsWith('_comment')) return;
      const name = (t.name || '').replace(/"/g, '');
      if (name === WIDGET_TARGET) widgetKey = uuid;
      if (name === APP_TARGET)    appKey    = uuid;
    });

    // Add a Swift file to the given target by directly editing pbxproj sections
    function addSwiftFile(relPath, targetKey) {
      const absPath = path.join(iosDir, relPath);
      const fileName = path.basename(absPath);
      const fileRefUuid  = proj.generateUuid();
      const buildFileUuid = proj.generateUuid();

      const fileRefs = proj.pbxFileReferenceSection();
      fileRefs[fileRefUuid] = {
        isa: 'PBXFileReference',
        fileEncoding: 4,
        includeInIndex: 0,
        lastKnownFileType: 'sourcecode.swift',
        name: `"${fileName}"`,
        path: `"${absPath}"`,
        sourceTree: '"<group>"',
      };
      fileRefs[`${fileRefUuid}_comment`] = fileName;

      const buildFiles = proj.pbxBuildFileSection();
      buildFiles[buildFileUuid] = {
        isa: 'PBXBuildFile',
        fileRef: fileRefUuid,
        fileRef_comment: fileName,
      };
      buildFiles[`${buildFileUuid}_comment`] = `${fileName} in Sources`;

      const srcPhase = proj.pbxSourcesBuildPhaseObj(targetKey);
      if (srcPhase) {
        srcPhase.files.push({ value: buildFileUuid, comment: `${fileName} in Sources` });
      }
    }

    if (widgetKey) {
      addSwiftFile(`${WIDGET_TARGET}/SharedTapStore.swift`,  widgetKey);
      addSwiftFile(`${WIDGET_TARGET}/RecordTapIntent.swift`, widgetKey);
    }
    if (appKey) {
      addSwiftFile(`${APP_TARGET}/SharedTapStoreMainApp.swift`, appKey);
      addSwiftFile(`${APP_TARGET}/SharedTapStoreModule.swift`,  appKey);
    }

    // Add a Run Script build phase that patches ExpoModulesProvider.swift
    // AFTER expo-modules-autolinking regenerates it (but before compilation).
    if (appKey) {
      const scriptSection = proj.hash.project.objects['PBXShellScriptBuildPhase'] || {};
      const scriptAlreadyAdded = Object.values(scriptSection).some(
        p => p && typeof p === 'object' && (p.name || '').includes('Patch SharedTapStoreModule')
      );
      if (!scriptAlreadyAdded) {
        const scriptUuid = proj.generateUuid();
        // Simple one-liner: call our helper script
        const patchScript = '/usr/local/bin/node "${SRCROOT}/../scripts/patch-expo-modules-provider.js"';

        if (!proj.hash.project.objects['PBXShellScriptBuildPhase']) {
          proj.hash.project.objects['PBXShellScriptBuildPhase'] = {};
        }
        proj.hash.project.objects['PBXShellScriptBuildPhase'][scriptUuid] = {
          isa: 'PBXShellScriptBuildPhase',
          buildActionMask: 2147483647,
          files: '(\n\t\t\t)',
          inputFileListPaths: '(\n\t\t\t)',
          inputPaths: '(\n\t\t\t)',
          name: '"[SharedTapStore] Patch SharedTapStoreModule into ExpoModulesProvider"',
          outputFileListPaths: '(\n\t\t\t)',
          outputPaths: '(\n\t\t\t)',
          runOnlyForDeploymentPostprocessing: 0,
          shellPath: '/bin/sh',
          shellScript: JSON.stringify(patchScript),
          showEnvVarsInLog: 0,
        };
        proj.hash.project.objects['PBXShellScriptBuildPhase'][`${scriptUuid}_comment`] = '[SharedTapStore] Patch SharedTapStoreModule into ExpoModulesProvider';

        // Insert AFTER [Expo] Configure project (which regenerates ExpoModulesProvider.swift),
        // BEFORE Sources (which compiles it). Otherwise Configure project overwrites our patch.
        const target = proj.pbxNativeTargetSection()[appKey];
        if (target && target.buildPhases) {
          let insertIdx = -1;
          for (let i = 0; i < target.buildPhases.length; i++) {
            const phaseComment = target.buildPhases[i].comment || '';
            if (phaseComment === '[Expo] Configure project') { insertIdx = i + 1; break; }
          }
          if (insertIdx === -1) {
            insertIdx = target.buildPhases.length;
            for (let i = 0; i < target.buildPhases.length; i++) {
              const phaseComment = target.buildPhases[i].comment || '';
              if (phaseComment === 'Sources') { insertIdx = i; break; }
            }
          }
          target.buildPhases.splice(insertIdx, 0, {
            value: scriptUuid,
            comment: '[SharedTapStore] Patch SharedTapStoreModule into ExpoModulesProvider',
          });
        }
      }
    }

    return config;
  });

  return config;
};
