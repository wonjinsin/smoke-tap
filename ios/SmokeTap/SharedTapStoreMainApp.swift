import Foundation
import WidgetKit

struct SharedTapStoreMainApp {
    static let appGroupId = "group.com.example.smoketap"
    static let pendingKey = "pendingTaps"
    static let baseKey   = "baseTodayCount"
    static let lastTapKey = "lastTapTimestamp"

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
    static func setLastTap(_ ts: Double) {
        UserDefaults(suiteName: appGroupId)?.set(ts, forKey: lastTapKey)
        WidgetCenter.shared.reloadTimelines(ofKind: "SmokeTapWidget")
    }
}
