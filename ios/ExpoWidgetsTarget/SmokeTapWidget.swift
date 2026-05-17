import WidgetKit
import SwiftUI
import AppIntents

struct SmokeTapEntry: TimelineEntry {
    let date: Date
    let count: Int
    let lastTap: Date?
}

struct SmokeTapProvider: TimelineProvider {
    func placeholder(in context: Context) -> SmokeTapEntry {
        SmokeTapEntry(date: Date(), count: 0, lastTap: nil)
    }
    func getSnapshot(in context: Context, completion: @escaping (SmokeTapEntry) -> Void) {
        completion(SmokeTapEntry(
            date: Date(),
            count: SharedTapStore.getBaseCount() + SharedTapStore.getPendingCount(),
            lastTap: SharedTapStore.getLastTap()
        ))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<SmokeTapEntry>) -> Void) {
        let entry = SmokeTapEntry(
            date: Date(),
            count: SharedTapStore.getBaseCount() + SharedTapStore.getPendingCount(),
            lastTap: SharedTapStore.getLastTap()
        )
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
            Text("\(entry.count)")
                .font(.system(size: 72, weight: .thin))
                .tracking(-2.5)
                .foregroundColor(Color(hex: "1A1815"))
                .padding(.leading, 4)
                .padding(.top, 2)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

            // Elapsed-since, bottom-left
            Group {
                if let last = entry.lastTap {
                    HStack(spacing: 0) {
                        Text(last, style: .relative)
                        Text(" 전")
                    }
                } else {
                    Text("기록 없음")
                }
            }
            .font(.system(size: 11))
            .foregroundColor(Color(hex: "1A1815").opacity(0.4))
            .padding(.leading, 4)
            .padding(.bottom, 4)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)

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
