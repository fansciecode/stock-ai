#!/usr/bin/swift

import Foundation

let filePath = "IBCM-ios/IBCM/Pods/FirebaseStorage/FirebaseStorage/Sources/StorageError.swift"
let fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

let fixedContents = fileContents.replacingOccurrences(
    of: "    let storageError = switch serverError.code {\n    case 400: StorageError.unknown(\n        message: \"Unknown 400 error from backend\",\n        serverError: errorDictionary\n      )\n    case 401: StorageError.unauthenticated(serverError: errorDictionary)\n    case 402: StorageError.quotaExceeded(\n        bucket: ref.path.bucket,\n        serverError: errorDictionary\n      )\n    case 403: StorageError.unauthorized(\n        bucket: ref.path.bucket,\n        object: ref.path.object ?? \"<object-entity-internal-error>\",\n        serverError: errorDictionary\n      )\n    case 404: StorageError.objectNotFound(\n        object: ref.path.object ?? \"<object-entity-internal-error>\", serverError: errorDictionary\n      )\n    default: StorageError.unknown(\n        message: \"Unexpected \\(serverError.code) code from backend\", serverError: errorDictionary\n      )\n    }",
    with: "    let storageError: StorageError\n    switch serverError.code {\n    case 400:\n      storageError = StorageError.unknown(\n        message: \"Unknown 400 error from backend\",\n        serverError: errorDictionary\n      )\n    case 401:\n      storageError = StorageError.unauthenticated(serverError: errorDictionary)\n    case 402:\n      storageError = StorageError.quotaExceeded(\n        bucket: ref.path.bucket,\n        serverError: errorDictionary\n      )\n    case 403:\n      storageError = StorageError.unauthorized(\n        bucket: ref.path.bucket,\n        object: ref.path.object ?? \"<object-entity-internal-error>\",\n        serverError: errorDictionary\n      )\n    case 404:\n      storageError = StorageError.objectNotFound(\n        object: ref.path.object ?? \"<object-entity-internal-error>\", serverError: errorDictionary\n      )\n    default:\n      storageError = StorageError.unknown(\n        message: \"Unexpected \\(serverError.code) code from backend\", serverError: errorDictionary\n      )\n    }"
)

try fixedContents.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Fixed StorageError.swift")
