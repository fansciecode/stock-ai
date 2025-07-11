#!/usr/bin/swift

import Foundation

let filePath = "IBCM-ios/IBCM/Pods/FirebaseStorage/FirebaseStorage/Sources/Internal/StorageUtils.swift"
let fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

// Replace the problematic os(visionOS) with proper Swift code
let fixedContents = fileContents.replacingOccurrences(
    of: "#if os(iOS) || os(tvOS) || os(visionOS)",
    with: "#if os(iOS) || os(tvOS)"
)

try fixedContents.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Fixed StorageUtils.swift")
