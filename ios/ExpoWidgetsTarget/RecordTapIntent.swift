import AppIntents
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
