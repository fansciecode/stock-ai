#!/usr/bin/swift

import Foundation

let filePath = "Pods/FirebaseStorage/FirebaseStorage/Sources/Storage.swift"
var fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

// Add empty implementations at the end of the file
let emptyImplementations = """

// Empty implementations for fallback when components are nil
private class EmptyAuthInterop: AuthInterop {
  func getToken(completion: @escaping (String?, Error?) -> Void) {
    completion(nil, nil)
  }
  
  func getUserID() -> String? {
    return nil
  }
}

private class EmptyAppCheckInterop: AppCheckInterop {
  func getToken(completion: @escaping (AppCheckToken?, Error?) -> Void) {
    completion(nil, nil)
  }
}
"""

if !fileContents.contains("EmptyAuthInterop") {
    fileContents = fileContents.replacingOccurrences(of: "}", with: "}\n\(emptyImplementations)", options: .backwards, range: fileContents.range(of: "}", options: .backwards))
}

try fileContents.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Added empty implementations to Storage.swift")
