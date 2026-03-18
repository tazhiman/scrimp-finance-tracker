#import <React/RCTBridgeModule.h>

@interface TransactionSyncModule : NSObject <RCTBridgeModule>
@end

@implementation TransactionSyncModule

static NSString *const kAppGroupIdentifier = @"group.com.scrimp.app";
static NSString *const kPendingKey = @"pendingTransactions";

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

RCT_EXPORT_METHOD(getPendingTransactions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:kAppGroupIdentifier];
  if (!sharedDefaults) {
    resolve(@"[]");
    return;
  }

  NSData *data = [sharedDefaults dataForKey:kPendingKey];
  if (!data) {
    resolve(@"[]");
    return;
  }

  NSString *jsonString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  if (!jsonString) {
    resolve(@"[]");
    return;
  }

  resolve(jsonString);
}

RCT_EXPORT_METHOD(clearPendingTransactions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSUserDefaults *sharedDefaults = [[NSUserDefaults alloc] initWithSuiteName:kAppGroupIdentifier];
  if (sharedDefaults) {
    [sharedDefaults removeObjectForKey:kPendingKey];
    [sharedDefaults synchronize];
  }
  resolve(@(YES));
}

@end
