#!/usr/bin/swift

import Foundation

let filePath = "IBCM-ios/IBCM/Pods/IQKeyboardCore/IQKeyboardCore/Classes/IQTextInputView.swift"
let fileContents = try String(contentsOfFile: filePath, encoding: .utf8)

let fixedContents = fileContents.replacingOccurrences(
    of: "    public var iqIsEnabled: Bool {\n        if #available(iOS 16.4, *) {\n            return isEnabled\n        } else {\n            return searchTextField.isEnabled\n        }\n    }",
    with: "    public var iqIsEnabled: Bool {\n        if #available(iOS 16.4, *) {\n            return self.isEnabled\n        } else {\n            return self.searchTextField.isEnabled\n        }\n    }"
)

try fixedContents.write(toFile: filePath, atomically: true, encoding: .utf8)
print("Fixed IQTextInputView.swift")
