#!/usr/bin/swift

import Foundation

let filePath = "Pods/FirebaseStorage/FirebaseStorage/Sources/Storage.swift"
var fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

// Replace the existing empty implementations with proper ones
let emptyImplementations = """

// Empty implementations for fallback when components are nil
private class EmptyAuthInterop: NSObject, AuthInterop {
  func getToken(forcingRefresh: Bool, completion: @escaping (String?, Error?) -> Void) {
    completion(nil, nil)
  }
  
  func getUserID() -> String? {
    return nil
  }
}

// Define a simple AppCheckToken implementation
private class SimpleAppCheckToken: NSObject, FIRAppCheckTokenResultInterop {
  var token: String {
    return ""
  }
  
  var error: Error? {
    return nil
  }
}

private class EmptyAppCheckInterop: NSObject, AppCheckInterop {
  func getToken(forcingRefresh: Bool, completion: @escaping (FIRAppCheckTokenResultInterop?, Error?) -> Void) {
    completion(SimpleAppCheckToken(), nil)
  }
  
  func getLimitedUseToken(completion: @escaping (FIRAppCheckTokenResultInterop?, Error?) -> Void) {
    completion(SimpleAppCheckToken(), nil)
  }
  
  func tokenDidChangeNotificationName() -> String {
    return "EmptyAppCheckTokenDidChange"
  }
  
  func notificationTokenKey() -> String {
    return "token"
  }
  
  func notificationAppNameKey() -> String {
    return "appName"
  }
}
"""

// Remove existing implementations if they exist
if fileContents.contains("EmptyAuthInterop") {
    let startRange = fileContents.range(of: "// Empty implementations for fallback when components are nil")
    let endRange = fileContents.range(of: "}", options: .backwards)
    
    if let start = startRange?.lowerBound, let end = endRange?.upperBound {
        let rangeToReplace = start..<end
        fileContents.removeSubrange(rangeToReplace)
    }
}

// Add the new implementations
fileContents = fileContents + emptyImplementations

try fileContents.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Added proper protocol implementations to Storage.swift")
