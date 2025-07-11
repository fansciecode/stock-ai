#!/usr/bin/swift

import Foundation

let filePath = "IBCM-ios/IBCM/Pods/FirebaseAuth/FirebaseAuth/Sources/Swift/User/User.swift"
let fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

// Replace the problematic #if !FIREBASE_CI blocks with proper Swift code
let fixedContents = fileContents.replacingOccurrences(
    of: "#if !FIREBASE_CI\n    @available(\n      *,\n      deprecated,\n      message: \"`updateEmail` is deprecated and will be removed in a future release. Use sendEmailVerification\\(beforeUpdatingEmail:\\) instead.\"\n    )\n  #endif // !FIREBASE_CI",
    with: "@available(*, deprecated, message: \"`updateEmail` is deprecated and will be removed in a future release. Use sendEmailVerification(beforeUpdatingEmail:) instead.\")"
)

try fixedContents.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Fixed User.swift")
