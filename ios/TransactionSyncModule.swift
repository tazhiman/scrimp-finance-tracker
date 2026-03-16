import Foundation

@objc(TransactionSyncModule)
class TransactionSyncModule: NSObject {

  private let appGroupIdentifier = "group.com.financetracker.app"
  private let pendingKey = "pendingTransactions"

  @objc
  func getPendingTransactions(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
      resolve("[]")
      return
    }

    guard let data = sharedDefaults.data(forKey: pendingKey),
          let jsonString = String(data: data, encoding: .utf8) else {
      resolve("[]")
      return
    }

    resolve(jsonString)
  }

  @objc
  func clearPendingTransactions(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
      resolve(true)
      return
    }

    sharedDefaults.removeObject(forKey: pendingKey)
    sharedDefaults.synchronize()
    resolve(true)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
