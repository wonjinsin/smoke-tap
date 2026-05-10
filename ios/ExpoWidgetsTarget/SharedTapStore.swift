import Foundation

struct SharedTapStore {
    static let appGroupId = "group.com.example.smoketap"
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
