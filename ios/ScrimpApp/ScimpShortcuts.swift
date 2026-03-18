import AppIntents

@available(iOS 16.4, *)
struct ScimpShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: LogTransactionIntent(),
      phrases: [
        "Log a transaction in \(.applicationName)",
        "Add expense in \(.applicationName)",
        "Record purchase in \(.applicationName)",
      ],
      shortTitle: "Log Transaction",
      systemImageName: "creditcard"
    )
  }
}
