import Foundation
import AppKit
import Security
import Darwin

// This executable owns only these two records. Never enumerate a keychain,
// modify its settings or change the default access control created by macOS.
private let service = "app.grippo.exercise-publisher.local"
private let maximumBytes = 64 * 1024

private func fail(_ code: String) -> Never {
    FileHandle.standardError.write(Data((code + "\n").utf8))
    exit(1)
}

private func check(_ status: OSStatus) {
    switch status {
    case errSecSuccess: return
    case errSecInteractionNotAllowed: fail("VAULT_LOCKED")
    case errSecAuthFailed, errSecUserCanceled: fail("VAULT_ACCESS_DENIED")
    default: fail("VAULT_KEYCHAIN_FAILED")
    }
}

private func emit(_ value: Any) {
    guard JSONSerialization.isValidJSONObject(value),
          let encoded = try? JSONSerialization.data(withJSONObject: value),
          encoded.count <= maximumBytes else { fail("VAULT_RESPONSE_INVALID") }
    FileHandle.standardOutput.write(encoded)
}

private func loginKeychain() -> SecKeychain {
    var keychain: SecKeychain?
    check(SecKeychainCopyDefault(&keychain))
    guard let keychain else { fail("VAULT_KEYCHAIN_UNAVAILABLE") }
    var length = UInt32(PATH_MAX)
    var bytes = [CChar](repeating: 0, count: Int(PATH_MAX))
    check(SecKeychainGetPath(keychain, &length, &bytes))
    let path = String(cString: bytes)
    guard let entry = getpwuid(getuid()), let directory = entry.pointee.pw_dir else {
        fail("VAULT_KEYCHAIN_UNAVAILABLE")
    }
    let home = String(cString: directory)
    guard path == home + "/Library/Keychains/login.keychain-db"
            || path == home + "/Library/Keychains/login.keychain" else {
        fail("VAULT_LOGIN_KEYCHAIN_REQUIRED")
    }
    return keychain
}

private func promptAdmin() {
    guard isatty(STDOUT_FILENO) == 0 else { fail("VAULT_PRIVATE_PIPE_REQUIRED") }
    let application = NSApplication.shared
    application.setActivationPolicy(.accessory)
    let alert = NSAlert()
    alert.messageText = "Grippo Exercise Publisher"
    alert.informativeText = "One-time setup for https://grippo-app.com. After verification, these credentials will be stored only in this Mac's login Keychain. Nothing is published during setup."
    alert.addButton(withTitle: "Continue")
    alert.addButton(withTitle: "Cancel")
    let view = NSView(frame: NSRect(x: 0, y: 0, width: 420, height: 110))
    let emailLabel = NSTextField(labelWithString: "Admin email")
    emailLabel.frame = NSRect(x: 0, y: 88, width: 420, height: 18)
    let email = NSTextField(frame: NSRect(x: 0, y: 60, width: 420, height: 24))
    let passwordLabel = NSTextField(labelWithString: "Password")
    passwordLabel.frame = NSRect(x: 0, y: 32, width: 420, height: 18)
    let password = NSSecureTextField(frame: NSRect(x: 0, y: 4, width: 420, height: 24))
    for item in [emailLabel, email, passwordLabel, password] { view.addSubview(item) }
    alert.accessoryView = view
    alert.window.initialFirstResponder = email
    application.activate(ignoringOtherApps: true)
    let response = alert.runModal()
    let address = email.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
    let secret = password.stringValue
    email.stringValue = ""
    password.stringValue = ""
    guard response == .alertFirstButtonReturn else { fail("VAULT_INPUT_CANCELLED") }
    guard !address.isEmpty, address.utf8.count <= 1280,
          !secret.isEmpty, secret.utf8.count <= 16384 else { fail("VAULT_RECORD_INVALID") }
    emit(["email": address, "password": secret])
}

private func run() {
    let args = Array(CommandLine.arguments.dropFirst())
    if args == ["prompt-admin"] { promptAdmin(); return }
    guard args.count == 2, ["read", "write", "delete", "probe"].contains(args[0]),
          ["admin", "aws"].contains(args[1]) else { fail("VAULT_ARGUMENTS_INVALID") }
    let operation = args[0]
    let keychain = loginKeychain()
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: args[1],
        kSecMatchSearchList as String: [keychain],
    ]

    switch operation {
    case "read", "probe":
        var lookup = query
        lookup[kSecMatchLimit as String] = kSecMatchLimitOne
        lookup[operation == "read" ? kSecReturnData as String : kSecReturnAttributes as String] = true
        var result: CFTypeRef?
        let status = SecItemCopyMatching(lookup as CFDictionary, &result)
        if status == errSecItemNotFound { emit(["found": false]); return }
        check(status)
        if operation == "probe" { emit(["found": true]); return }
        guard var data = result as? Data, data.count > 0, data.count <= maximumBytes else {
            fail("VAULT_RECORD_INVALID")
        }
        defer { data.resetBytes(in: 0..<data.count) }
        guard let record = try? JSONSerialization.jsonObject(with: data), record is [String: Any] else {
            fail("VAULT_RECORD_INVALID")
        }
        // stdout is a private pipe captured by exercise-vault.cjs, never a TTY.
        guard isatty(STDOUT_FILENO) == 0 else { fail("VAULT_PRIVATE_PIPE_REQUIRED") }
        emit(["found": true, "record": record])
    case "write":
        guard isatty(STDIN_FILENO) == 0 else { fail("VAULT_PRIVATE_PIPE_REQUIRED") }
        var data = Data()
        while true {
            let part = FileHandle.standardInput.readData(ofLength: min(4096, maximumBytes + 1 - data.count))
            if part.isEmpty { break }
            data.append(part)
            if data.count > maximumBytes { fail("VAULT_INPUT_TOO_LARGE") }
        }
        defer { data.resetBytes(in: 0..<data.count) }
        guard !data.isEmpty,
              let record = try? JSONSerialization.jsonObject(with: data), record is [String: Any] else {
            fail("VAULT_RECORD_INVALID")
        }
        let changes = [kSecValueData as String: data] as CFDictionary
        let status = SecItemUpdate(query as CFDictionary, changes)
        if status == errSecItemNotFound {
            var addition = query
            addition.removeValue(forKey: kSecMatchSearchList as String)
            addition[kSecUseKeychain as String] = keychain
            addition[kSecValueData as String] = data
            addition[kSecAttrLabel as String] = "Grippo Exercise Publisher (" + args[1] + ")"
            // Omitting kSecAttrAccess deliberately keeps the default creator ACL.
            check(SecItemAdd(addition as CFDictionary, nil))
        } else { check(status) }
        emit(["stored": true])
    case "delete":
        let status = SecItemDelete(query as CFDictionary)
        if status == errSecItemNotFound { emit(["deleted": false]); return }
        check(status)
        emit(["deleted": true])
    default: fail("VAULT_ARGUMENTS_INVALID")
    }
}

run()
