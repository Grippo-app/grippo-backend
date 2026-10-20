// swift-tools-version: 5.9
import PackageDescription

// Build the native helper for SwiftPM and CodeQL; installation stays explicit.
let package = Package(
    name: "GrippoCredentialStore",
    platforms: [.macOS(.v12)],
    products: [.executable(name: "grippo-credential-store", targets: ["GrippoCredentialStore"])],
    targets: [
        .executableTarget(
            name: "GrippoCredentialStore",
            path: ".agents/skills/grippo-exercise-create/scripts",
            exclude: [
                "exercise-admin-access.cjs",
                "exercise-aws-access.cjs",
                "exercise-http.cjs",
                "exercise-media.cjs",
                "exercise-package.cjs",
                "exercise-state.cjs",
                "exercise-vault.cjs",
                "prepare-exercise.cjs",
                "publish-exercise.cjs",
            ],
            sources: ["exercise-vault.swift"],
            linkerSettings: [.linkedFramework("AppKit"), .linkedFramework("Security")]
        ),
    ]
)
