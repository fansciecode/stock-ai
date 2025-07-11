#!/usr/bin/swift

import Foundation

let filePath = "IBCM-ios/IBCM/Pods/FirebaseAuth/FirebaseAuth/Sources/Swift/AuthProvider/OAuthProvider.swift"
let fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

// Replace the problematic #if !FIREBASE_CI blocks with proper Swift code
let fixedContents = fileContents.replacingOccurrences(
    of: "#if !FIREBASE_CI\n    @available(\n      swift,\n      deprecated: 0.01,\n      message: \"Use `provider\\(providerID: AuthProviderID\\) -> OAuthProvider` instead.\"\n    )\n  #endif // !FIREBASE_CI",
    with: "@available(swift, deprecated: 0.01, message: \"Use `provider(providerID: AuthProviderID) -> OAuthProvider` instead.\")"
)

let fixedContents2 = fixedContents.replacingOccurrences(
    of: "#if !FIREBASE_CI\n    @available(\n      swift,\n      deprecated: 0.01,\n      message: \"Use `provider\\(providerID: AuthProviderID, auth: Auth\\) -> OAuthProvider` instead.\"\n    )\n  #endif // !FIREBASE_CI",
    with: "@available(swift, deprecated: 0.01, message: \"Use `provider(providerID: AuthProviderID, auth: Auth) -> OAuthProvider` instead.\")"
)

let fixedContents3 = fixedContents2.replacingOccurrences(
    of: "#if !FIREBASE_CI\n    @available(\n      swift,\n      deprecated: 0.01,\n      message: \"Use `credential\\(providerID: AuthProviderID, idToken: String, accessToken: String\\? = nil\\) -> OAuthCredential` instead.\"\n    )\n  #endif // !FIREBASE_CI",
    with: "@available(swift, deprecated: 0.01, message: \"Use `credential(providerID: AuthProviderID, idToken: String, accessToken: String? = nil) -> OAuthCredential` instead.\")"
)

let fixedContents4 = fixedContents3.replacingOccurrences(
    of: "#if !FIREBASE_CI\n    @available(\n      swift,\n      deprecated: 0.01,\n      message: \"Use `credential\\(providerID: AuthProviderID, accessToken: String\\) -> OAuthCredential` instead.\"\n    )\n  #endif // !FIREBASE_CI",
    with: "@available(swift, deprecated: 0.01, message: \"Use `credential(providerID: AuthProviderID, accessToken: String) -> OAuthCredential` instead.\")"
)

let fixedContents5 = fixedContents4.replacingOccurrences(
    of: "#if !FIREBASE_CI\n    @available(\n      swift,\n      deprecated: 0.01,\n      message: \"Use `credential\\(providerID: AuthProviderID, idToken: String, rawNonce: String, accessToken: String\\? = nil\\) -> OAuthCredential` instead.\"\n    )\n  #endif // !FIREBASE_CI",
    with: "@available(swift, deprecated: 0.01, message: \"Use `credential(providerID: AuthProviderID, idToken: String, rawNonce: String, accessToken: String? = nil) -> OAuthCredential` instead.\")"
)

try fixedContents5.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Fixed OAuthProvider.swift")
