import WidgetKit
import SwiftUI

// MARK: - Widget Entry
struct FinanceEntry: TimelineEntry {
    let date: Date
    let todaySpending: Double
    let monthlySpending: Double
    let monthlyBudget: Double
}

// MARK: - Widget Provider
struct FinanceProvider: TimelineProvider {
    func placeholder(in context: Context) -> FinanceEntry {
        FinanceEntry(date: Date(), todaySpending: 45.50, monthlySpending: 1234.00, monthlyBudget: 3000.00)
    }

    func getSnapshot(in context: Context, completion: @escaping (FinanceEntry) -> ()) {
        let entry = FinanceEntry(date: Date(), todaySpending: 45.50, monthlySpending: 1234.00, monthlyBudget: 3000.00)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Load data from shared UserDefaults (App Group)
        let sharedDefaults = UserDefaults(suiteName: "group.com.financetracker.app")
        
        let todaySpending = sharedDefaults?.double(forKey: "todaySpending") ?? 0.0
        let monthlySpending = sharedDefaults?.double(forKey: "monthlySpending") ?? 0.0
        let monthlyBudget = sharedDefaults?.double(forKey: "monthlyBudget") ?? 3000.0
        
        let entry = FinanceEntry(
            date: Date(),
            todaySpending: todaySpending,
            monthlySpending: monthlySpending,
            monthlyBudget: monthlyBudget
        )
        
        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
}

// MARK: - Widget View
struct FinanceWidgetEntryView : View {
    var entry: FinanceProvider.Entry
    @Environment(\.widgetFamily) var family
    
    // App theme colors
    let backgroundColor = Color(red: 18/255, green: 18/255, blue: 18/255)
    let cardBackground = Color(red: 42/255, green: 42/255, blue: 42/255)
    let primaryColor = Color(red: 191/255, green: 255/255, blue: 10/255)
    let accentColor = Color(red: 255/255, green: 107/255, blue: 44/255)
    let textColor = Color(red: 230/255, green: 230/255, blue: 230/255)
    let textSecondary = Color(red: 170/255, green: 170/255, blue: 170/255)
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
    
    // MARK: - Small Widget (2x2)
    func SmallWidgetView(entry: FinanceEntry) -> some View {
        ZStack {
            backgroundColor
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "chart.bar.fill")
                        .foregroundColor(primaryColor)
                        .font(.system(size: 16))
                    Text("Today")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(textColor)
                    Spacer()
                }
                
                Text("$\(entry.todaySpending, specifier: "%.2f")")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(textColor)
                
                Spacer()
                
                Link(destination: URL(string: "financetracker://add")!) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.black)
                            .font(.system(size: 12))
                        Text("Add Expense")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.black)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(primaryColor)
                    .cornerRadius(8)
                }
            }
            .padding(14)
        }
    }
    
    // MARK: - Medium Widget (4x2)
    func MediumWidgetView(entry: FinanceEntry) -> some View {
        ZStack {
            backgroundColor
            
            VStack(spacing: 12) {
                // Header
                HStack {
                    Image(systemName: "chart.bar.fill")
                        .foregroundColor(primaryColor)
                        .font(.system(size: 16))
                    Text("Finance Tracker")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(textColor)
                    Spacer()
                }
                
                // Stats
                HStack(spacing: 12) {
                    // Today's spending
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Today")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(textSecondary)
                        Text("$\(entry.todaySpending, specifier: "%.2f")")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(textColor)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(cardBackground)
                    .cornerRadius(10)
                    
                    // Monthly progress
                    VStack(alignment: .leading, spacing: 4) {
                        Text("This Month")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(textSecondary)
                        Text("$\(entry.monthlySpending, specifier: "%.0f")")
                            .font(.system(size: 20, weight: .bold))
                            .foregroundColor(textColor)
                        
                        // Progress bar
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(height: 4)
                                    .cornerRadius(2)
                                
                                Rectangle()
                                    .fill(progressColor(entry: entry))
                                    .frame(width: min(progressWidth(entry: entry, geometry: geometry), geometry.size.width), height: 4)
                                    .cornerRadius(2)
                            }
                        }
                        .frame(height: 4)
                        
                        Text("of $\(entry.monthlyBudget, specifier: "%.0f")")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(textSecondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(cardBackground)
                    .cornerRadius(10)
                }
                
                // Quick actions
                HStack(spacing: 8) {
                    Link(destination: URL(string: "financetracker://add")!) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.black)
                                .font(.system(size: 12))
                            Text("Add Expense")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.black)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(primaryColor)
                        .cornerRadius(8)
                    }
                    
                    Link(destination: URL(string: "financetracker://")!) {
                        HStack {
                            Image(systemName: "arrow.right.circle.fill")
                                .foregroundColor(textColor)
                                .font(.system(size: 12))
                            Text("Open App")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(textColor)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(cardBackground)
                        .cornerRadius(8)
                    }
                }
            }
            .padding(14)
        }
    }
    
    // MARK: - Large Widget (4x4)
    func LargeWidgetView(entry: FinanceEntry) -> some View {
        ZStack {
            backgroundColor
            
            VStack(spacing: 12) {
                // Header
                HStack {
                    Image(systemName: "chart.bar.fill")
                        .foregroundColor(primaryColor)
                        .font(.system(size: 18))
                    Text("Finance Tracker")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(textColor)
                    Spacer()
                    Text(entry.date, style: .time)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(textSecondary)
                }
                
                // Today's spending (large)
                VStack(alignment: .leading, spacing: 6) {
                    Text("Today's Spending")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(textSecondary)
                    Text("$\(entry.todaySpending, specifier: "%.2f")")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(textColor)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .background(cardBackground)
                .cornerRadius(12)
                
                // Monthly progress
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Monthly Budget")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(textColor)
                        Spacer()
                        Text("\(Int(progressPercentage(entry: entry)))%")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(progressColor(entry: entry))
                    }
                    
                    Text("$\(entry.monthlySpending, specifier: "%.0f") of $\(entry.monthlyBudget, specifier: "%.0f")")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(textColor)
                    
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(height: 8)
                                .cornerRadius(4)
                            
                            Rectangle()
                                .fill(progressColor(entry: entry))
                                .frame(width: min(progressWidth(entry: entry, geometry: geometry), geometry.size.width), height: 8)
                                .cornerRadius(4)
                        }
                    }
                    .frame(height: 8)
                    
                    Text("$\(entry.monthlyBudget - entry.monthlySpending, specifier: "%.0f") remaining")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(textSecondary)
                }
                .padding(14)
                .background(cardBackground)
                .cornerRadius(12)
                
                Spacer()
                
                // Quick actions
                VStack(spacing: 8) {
                    Link(destination: URL(string: "financetracker://add")!) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                                .foregroundColor(.black)
                                .font(.system(size: 14))
                            Text("Add Expense")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.black)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(primaryColor)
                        .cornerRadius(10)
                    }
                    
                    HStack(spacing: 8) {
                        Link(destination: URL(string: "financetracker://transactions")!) {
                            HStack {
                                Image(systemName: "list.bullet")
                                    .foregroundColor(textColor)
                                    .font(.system(size: 12))
                                Text("View")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(textColor)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(cardBackground)
                            .cornerRadius(8)
                        }
                        
                        Link(destination: URL(string: "financetracker://goals")!) {
                            HStack {
                                Image(systemName: "target")
                                    .foregroundColor(textColor)
                                    .font(.system(size: 12))
                                Text("Goals")
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundColor(textColor)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(cardBackground)
                            .cornerRadius(8)
                        }
                    }
                }
            }
            .padding(14)
        }
    }
    
    // MARK: - Helper Functions
    func progressPercentage(entry: FinanceEntry) -> Double {
        guard entry.monthlyBudget > 0 else { return 0 }
        return min((entry.monthlySpending / entry.monthlyBudget) * 100, 100)
    }
    
    func progressWidth(entry: FinanceEntry, geometry: GeometryProxy) -> CGFloat {
        let percentage = progressPercentage(entry: entry) / 100
        return geometry.size.width * CGFloat(percentage)
    }
    
    func progressColor(entry: FinanceEntry) -> Color {
        let percentage = progressPercentage(entry: entry)
        if percentage >= 90 {
            return Color.red
        } else if percentage >= 75 {
            return accentColor
        } else {
            return primaryColor
        }
    }
}

// MARK: - Widget Configuration
@main
struct FinanceWidget: Widget {
    let kind: String = "FinanceWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FinanceProvider()) { entry in
            FinanceWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Finance Tracker")
        .description("Track your daily and monthly spending at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Preview
struct FinanceWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            FinanceWidgetEntryView(entry: FinanceEntry(date: Date(), todaySpending: 125.50, monthlySpending: 2450.00, monthlyBudget: 3000.00))
                .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            FinanceWidgetEntryView(entry: FinanceEntry(date: Date(), todaySpending: 125.50, monthlySpending: 2450.00, monthlyBudget: 3000.00))
                .previewContext(WidgetPreviewContext(family: .systemMedium))
            
            FinanceWidgetEntryView(entry: FinanceEntry(date: Date(), todaySpending: 125.50, monthlySpending: 2450.00, monthlyBudget: 3000.00))
                .previewContext(WidgetPreviewContext(family: .systemLarge))
        }
    }
}
