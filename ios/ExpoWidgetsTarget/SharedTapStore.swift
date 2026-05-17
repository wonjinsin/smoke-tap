import Foundation

struct SharedTapStore {
    static let appGroupId = "group.com.example.smoketap"
    static let pendingKey = "pendingTaps"
    static let baseKey   = "baseTodayCount"
    static let lastTapKey = "lastTapTimestamp"

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
    static func setLastTap(_ ts: Double) {
        UserDefaults(suiteName: appGroupId)?.set(ts, forKey: lastTapKey)
    }
    static func getLastTap() -> Date? {
        let ts = UserDefaults(suiteName: appGroupId)?.double(forKey: lastTapKey) ?? 0
        return ts > 0 ? Date(timeIntervalSince1970: ts) : nil
    }
}
