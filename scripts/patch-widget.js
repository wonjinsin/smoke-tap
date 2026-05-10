#!/usr/bin/env node
/**
 * Post-prebuild patch:
 *  1. Writes native Swift files into ExpoWidgetsTarget (expo-widgets overwrites them).
 *  2. Registers those files in the Xcode project (pbxproj).
 *
 * Run after `expo prebuild`:
 *   node scripts/patch-widget.js
 */

const path = require('path');
const fs   = require('fs');
const xcode = require('xcode');

const ROOT       = path.join(__dirname, '..');
const IOS_DIR    = path.join(ROOT, 'ios');
const WIDGET_DIR = path.join(IOS_DIR, 'ExpoWidgetsTarget');
const PBXPROJ    = path.join(IOS_DIR, 'SmokeTap.xcodeproj', 'project.pbxproj');
const APP_GROUP  = 'group.com.example.smoketap';
const WIDGET_TARGET = 'ExpoWidgetsTarget';

// ─── Swift file content ───────────────────────────────────────────────────────

const SHARED_TAP_STORE = `import Foundation

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

const RECORD_TAP_INTENT = `import AppIntents
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

const SMOKE_TAP_WIDGET = `import WidgetKit
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

private extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(color, for: .widget)
        } else {
            self.background(color)
        }
    }
}

struct SmokeTapWidgetView: View {
    let entry: SmokeTapEntry
    var body: some View {
        ZStack(alignment: .topLeading) {
            // Paper grain — 4×4 dot pattern, ink @ 7% alpha
            Canvas { ctx, size in
                let dot = Color(hex: "1A1815").opacity(0.07)
                var y = 1
                while y < Int(size.height) {
                    var x = 1
                    while x < Int(size.width) {
                        ctx.fill(
                            Path(CGRect(x: CGFloat(x), y: CGFloat(y), width: 1, height: 1)),
                            with: .color(dot)
                        )
                        x += 4
                    }
                    y += 4
                }
            }
            .allowsHitTesting(false)

            // Big number, top-left
            Text("\\(entry.count)")
                .font(.system(size: 72, weight: .thin))
                .tracking(-2.5)
                .foregroundColor(Color(hex: "1A1815"))
                .padding(.leading, 4)
                .padding(.top, 2)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

            // Plus button, bottom-right
            if #available(iOS 17.0, *) {
                Button(intent: RecordTapIntent()) {
                    Text("+")
                        .font(.system(size: 26, weight: .thin))
                        .foregroundColor(Color(hex: "FBF9F4"))
                        .frame(width: 44, height: 44)
                        .background(Color(hex: "1A1815"))
                        .clipShape(Circle())
                        .shadow(color: Color(hex: "1A1815").opacity(0.20), radius: 8, x: 0, y: 2)
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
            }
        }
        .padding(12)
        .widgetBackground(Color(hex: "FBF9F4"))
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

// ─── Step 1: write Swift files ────────────────────────────────────────────────

fs.mkdirSync(WIDGET_DIR, { recursive: true });

const WIDGET_FILES = {
  'SharedTapStore.swift':  SHARED_TAP_STORE,
  'RecordTapIntent.swift': RECORD_TAP_INTENT,
  'SmokeTapWidget.swift':  SMOKE_TAP_WIDGET,
};

for (const [name, content] of Object.entries(WIDGET_FILES)) {
  const dest = path.join(WIDGET_DIR, name);
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`✓ wrote   ${path.relative(ROOT, dest)}`);
}

// ─── Step 2: register files in Xcode project ─────────────────────────────────

const proj = xcode.project(PBXPROJ);
proj.parseSync();

// Check if already registered to avoid duplicates
const alreadyAdded = Object.values(proj.pbxBuildFileSection()).some(
  f => f && f.fileRef_comment === 'SharedTapStore.swift'
);

if (alreadyAdded) {
  console.log('\nXcode: already registered, skipping.');
} else {
  // Find ExpoWidgetsTarget UUID
  let widgetKey;
  Object.entries(proj.pbxNativeTargetSection()).forEach(([uuid, t]) => {
    if (uuid.endsWith('_comment')) return;
    const name = (t.name || '').replace(/"/g, '');
    if (name === WIDGET_TARGET) widgetKey = uuid;
  });

  if (!widgetKey) {
    console.error(`\nERROR: Could not find target "${WIDGET_TARGET}" in pbxproj.`);
    process.exit(1);
  }

  function addSwiftFile(fileName) {
    const absPath = path.join(WIDGET_DIR, fileName);
    const fileRefUuid   = proj.generateUuid();
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

    const srcPhase = proj.pbxSourcesBuildPhaseObj(widgetKey);
    if (srcPhase) {
      srcPhase.files.push({ value: buildFileUuid, comment: `${fileName} in Sources` });
    }

    console.log(`✓ xcode   ${fileName} → ${WIDGET_TARGET}`);
  }

  addSwiftFile('SharedTapStore.swift');
  addSwiftFile('RecordTapIntent.swift');

  fs.writeFileSync(PBXPROJ, proj.writeSync(), 'utf8');
  console.log('✓ saved   project.pbxproj');
}

// ─── Step 3: register SharedTapStoreModule in ExpoModulesProvider ────────────

const EXPO_MODULES_PROVIDER = path.join(
  IOS_DIR,
  'Pods/Target Support Files/Pods-SmokeTap/ExpoModulesProvider.swift'
);

if (fs.existsSync(EXPO_MODULES_PROVIDER)) {
  let src = fs.readFileSync(EXPO_MODULES_PROVIDER, 'utf8');
  if (!src.includes('SharedTapStoreModule')) {
    // Register in getModuleClasses array (same target, no import needed)
    src = src.replace(
      /(\s*\(module: WidgetsModule\.self, name: nil\))/,
      '$1,\n      (module: SharedTapStoreModule.self, name: nil)'
    );
    fs.writeFileSync(EXPO_MODULES_PROVIDER, src, 'utf8');
    console.log('✓ registered SharedTapStoreModule in ExpoModulesProvider.swift');
  } else {
    console.log('✓ ExpoModulesProvider: already registered');
  }
} else {
  console.warn('⚠ ExpoModulesProvider.swift not found, skipping module registration');
}

console.log('\nWidget patch complete.');
