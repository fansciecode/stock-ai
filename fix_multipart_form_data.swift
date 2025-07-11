#!/usr/bin/swift

import Foundation

let filePath = "IBCM-ios/IBCM/Pods/Alamofire/Source/Features/MultipartFormData.swift"
let fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

let fixedContents = fileContents.replacingOccurrences(
    of: "        static func boundaryData(forBoundaryType boundaryType: BoundaryType, boundary: String) -> Data {\n            let boundaryText = switch boundaryType {\n            case .initial:\n                \"--\\(boundary)\\(EncodingCharacters.crlf)\"\n            case .encapsulated:\n                \"\\(EncodingCharacters.crlf)--\\(boundary)\\(EncodingCharacters.crlf)\"\n            case .final:\n                \"\\(EncodingCharacters.crlf)--\\(boundary)--\\(EncodingCharacters.crlf)\"\n            }\n",
    with: "        static func boundaryData(forBoundaryType boundaryType: BoundaryType, boundary: String) -> Data {\n            let boundaryText: String\n            switch boundaryType {\n            case .initial:\n                boundaryText = \"--\\(boundary)\\(EncodingCharacters.crlf)\"\n            case .encapsulated:\n                boundaryText = \"\\(EncodingCharacters.crlf)--\\(boundary)\\(EncodingCharacters.crlf)\"\n            case .final:\n                boundaryText = \"\\(EncodingCharacters.crlf)--\\(boundary)--\\(EncodingCharacters.crlf)\"\n            }\n"
)

try fixedContents.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Fixed MultipartFormData.swift")
