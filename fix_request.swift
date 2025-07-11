#!/usr/bin/swift

import Foundation

let filePath = "IBCM-ios/IBCM/Pods/Alamofire/Source/Core/Request.swift"
let fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

let fixedContents = fileContents.replacingOccurrences(
    of: "        func canTransitionTo(_ state: State) -> Bool {\n            switch (self, state) {\n            case (.initialized, _):\n                true\n            case (_, .initialized), (.cancelled, _), (.finished, _):\n                false\n            case (.resumed, .cancelled), (.suspended, .cancelled), (.resumed, .suspended), (.suspended, .resumed):\n                true\n            case (.suspended, .suspended), (.resumed, .resumed):\n                false\n            case (_, .finished):\n                true\n            }\n        }",
    with: "        func canTransitionTo(_ state: State) -> Bool {\n            switch (self, state) {\n            case (.initialized, _):\n                return true\n            case (_, .initialized), (.cancelled, _), (.finished, _):\n                return false\n            case (.resumed, .cancelled), (.suspended, .cancelled), (.resumed, .suspended), (.suspended, .resumed):\n                return true\n            case (.suspended, .suspended), (.resumed, .resumed):\n                return false\n            case (_, .finished):\n                return true\n            }\n        }"
)

let fixedContents2 = fixedContents.replacingOccurrences(
    of: "        var sessionDisposition: URLSession.ResponseDisposition {\n            switch self {\n            case .allow: .allow\n            case .cancel: .cancel\n            }\n        }",
    with: "        var sessionDisposition: URLSession.ResponseDisposition {\n            switch self {\n            case .allow: return .allow\n            case .cancel: return .cancel\n            }\n        }"
)

try fixedContents2.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Fixed Request.swift")
