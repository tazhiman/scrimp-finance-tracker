#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TransactionSyncModule, NSObject)

RCT_EXTERN_METHOD(getPendingTransactions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearPendingTransactions:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
