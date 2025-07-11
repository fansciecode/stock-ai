#!/usr/bin/swift

import Foundation

let filePath = "IBCM-ios/IBCM/Pods/Alamofire/Source/Core/HTTPHeaders.swift"
let fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

let fixedContents = fileContents.replacingOccurrences(
    of: "let encodings: [String] = if #available(iOS 11.0, macOS 10.13, tvOS 11.0, watchOS 4.0, *) {\n            [\"br\", \"gzip\", \"deflate\"]\n        } else {\n            [\"gzip\", \"deflate\"]\n        }",
    with: "let encodings: [String]\n        if #available(iOS 11.0, macOS 10.13, tvOS 11.0, watchOS 4.0, *) {\n            encodings = [\"br\", \"gzip\", \"deflate\"]\n        } else {\n            encodings = [\"gzip\", \"deflate\"]\n        }"
)

try fixedContents.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Fixed HTTPHeaders.swift")
