import Foundation
import WidgetKit

@objc(WidgetDataModule)
class WidgetDataModule: NSObject {
  
  private let appGroupIdentifier = "group.com.financetracker.app"
  
  @objc
  func updateWidgetData(_ data: NSDictionary, resolver resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    guard let sharedDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
      reject("ERROR", "Failed to access shared UserDefaults", nil)
      return
    }
    
    // Extract values from dictionary
    let todaySpending = data["todaySpending"] as? Double ?? 0.0
    let monthlySpending = data["monthlySpending"] as? Double ?? 0.0
    let monthlyBudget = data["monthlyBudget"] as? Double ?? 3000.0
    
    // Save to shared UserDefaults
    sharedDefaults.set(todaySpending, forKey: "todaySpending")
    sharedDefaults.set(monthlySpending, forKey: "monthlySpending")
    sharedDefaults.set(monthlyBudget, forKey: "monthlyBudget")
    sharedDefaults.synchronize()
    
    resolve(true)
  }
  
  @objc
  func reloadWidgets(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
      resolve(true)
    } else {
      reject("ERROR", "Widgets require iOS 14.0 or later", nil)
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
