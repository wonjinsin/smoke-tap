internal import ExpoModulesCore

class SharedTapStoreModule: Module {
    func definition() -> ModuleDefinition {
        Name("SharedTapStore")
        AsyncFunction("getPendingCount") { () -> Int in SharedTapStoreMainApp.getPendingCount() }
        AsyncFunction("clearPending")    { () -> Void in SharedTapStoreMainApp.clearPending() }
        AsyncFunction("setBaseCount")    { (count: Int) -> Void in SharedTapStoreMainApp.setBaseCount(count) }
    }
}
