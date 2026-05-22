import Foundation
import AppIntents
import UserNotifications

@available(iOS 16.0, *)
enum TransactionTypeAppEnum: String, AppEnum {
  case expense
  case income

  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Transaction Type"

  static var caseDisplayRepresentations: [TransactionTypeAppEnum: DisplayRepresentation] = [
    .expense: "Expense",
    .income: "Income",
  ]
}

@available(iOS 16.0, *)
enum CategoryAppEnum: String, AppEnum {
  case food
  case transport
  case shopping
  case bills
  case entertainment
  case health
  case education
  case salary
  case freelance
  case investment
  case gift
  case other

  static var typeDisplayRepresentation: TypeDisplayRepresentation = "Category"

  static var caseDisplayRepresentations: [CategoryAppEnum: DisplayRepresentation] = [
    .food: "Food & Dining",
    .transport: "Transportation",
    .shopping: "Shopping",
    .bills: "Bills & Utilities",
    .entertainment: "Entertainment",
    .health: "Health & Fitness",
    .education: "Education",
    .salary: "Salary",
    .freelance: "Freelance",
    .investment: "Investment",
    .gift: "Gift",
    .other: "Other",
  ]
}

@available(iOS 16.0, *)
struct LogTransactionIntent: AppIntent {
  static var title: LocalizedStringResource = "Log Transaction"
  static var description = IntentDescription("Log a new transaction in Scrimp")

  @Parameter(title: "Amount")
  var amount: Double

  @Parameter(title: "Merchant / Description", default: "")
  var merchant: String

  @Parameter(title: "Type", default: .expense)
  var transactionType: TransactionTypeAppEnum

  @Parameter(title: "Category", default: .other)
  var category: CategoryAppEnum

  static var parameterSummary: some ParameterSummary {
    Summary("Log \(\.$transactionType) of \(\.$amount) at \(\.$merchant)") {
      \.$category
    }
  }

  private static let appGroupIdentifier = "group.com.scrimp.app"
  private static let pendingKey = "pendingTransactions"

  func perform() async throws -> some IntentResult & ProvidesDialog {
    let debugContent = UNMutableNotificationContent()
    debugContent.title = "Shortcut Triggered"
    debugContent.body = "Amount: \(amount), Merchant: \(merchant)"
    debugContent.sound = .default
    let debugReq = UNNotificationRequest(
      identifier: "debug-\(UUID().uuidString)",
      content: debugContent,
      trigger: nil
    )
    try? await UNUserNotificationCenter.current().add(debugReq)

    guard amount > 0 else {
      let errContent = UNMutableNotificationContent()
      errContent.title = "Transaction Failed"
      errContent.body = "Amount was \(amount). Please check that the Amount variable is mapped in your Shortcuts automation."
      errContent.sound = .default
      let errReq = UNNotificationRequest(
        identifier: "error-\(UUID().uuidString)",
        content: errContent,
        trigger: nil
      )
      try? await UNUserNotificationCenter.current().add(errReq)
      return .result(dialog: "Amount must be positive. Received: \(amount)")
    }

    let now = Date()
    let isoFormatter = ISO8601DateFormatter()
    isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd"

    let id = "\(Int(now.timeIntervalSince1970 * 1000))\(String(Int.random(in: 100000...999999)))"

    let transaction: [String: Any] = [
      "id": id,
      "amount": amount,
      "type": transactionType.rawValue,
      "category": category.rawValue,
      "description": merchant,
      "date": dateFormatter.string(from: now),
      "createdAt": isoFormatter.string(from: now),
    ]

    guard let sharedDefaults = UserDefaults(suiteName: Self.appGroupIdentifier) else {
      return .result(dialog: "Failed to save transaction.")
    }

    var pending: [[String: Any]] = []
    if let data = sharedDefaults.data(forKey: Self.pendingKey),
       let existing = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
      pending = existing
    }

    pending.append(transaction)

    if let jsonData = try? JSONSerialization.data(withJSONObject: pending) {
      sharedDefaults.set(jsonData, forKey: Self.pendingKey)
      sharedDefaults.synchronize()
    }

    let desc = merchant.isEmpty ? "" : " at \(merchant)"
    let amountStr = String(format: "%.2f", amount)

    let content = UNMutableNotificationContent()
    content.title = "Transaction Logged"
    content.body = "$\(amountStr)\(desc) added to Scrimp"
    content.sound = .default

    let request = UNNotificationRequest(
      identifier: "transaction-\(id)",
      content: content,
      trigger: nil
    )
    try? await UNUserNotificationCenter.current().add(request)

    return .result(dialog: "Logged \(transactionType.rawValue) of $\(amountStr)\(desc)")
  }
}
