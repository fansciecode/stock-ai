//
//  DebugView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Foundation

struct DebugView: View {
    @StateObject private var viewModel = DebugViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var showingLogDetails = false
    @State private var showingAPITester = false
    @State private var showingDeviceInfo = false
    @State private var showingClearDataConfirmation = false

    var body: some View {
        NavigationView {
            List {
                // App Information Section
                Section("App Information") {
                    InfoRow(title: "App Version", value: viewModel.appVersion)
                    InfoRow(title: "Build Number", value: viewModel.buildNumber)
                    InfoRow(title: "Bundle ID", value: viewModel.bundleIdentifier)
                    InfoRow(title: "Environment", value: viewModel.environment.rawValue.capitalized) {
                        Badge(text: viewModel.environment.rawValue.uppercased(), color: viewModel.environment == .production ? .red : .orange)
                    }
                }

                // API Information Section
                Section("API Configuration") {
                    InfoRow(title: "Base URL", value: viewModel.apiBaseURL)
                    InfoRow(title: "WebSocket URL", value: viewModel.webSocketURL)
                    InfoRow(title: "API Status", value: viewModel.apiStatus.description) {
                        StatusIndicator(status: viewModel.apiStatus)
                    }

                    Button("Test API Connection") {
                        viewModel.testAPIConnection()
                    }
                    .foregroundColor(.blue)
                }

                // Device Information Section
                Section("Device Information") {
                    InfoRow(title: "Device Model", value: viewModel.deviceModel)
                    InfoRow(title: "iOS Version", value: viewModel.iOSVersion)
                    InfoRow(title: "Device ID", value: viewModel.deviceIdentifier)
                    InfoRow(title: "Memory Usage", value: viewModel.memoryUsage)
                    InfoRow(title: "Storage Available", value: viewModel.storageAvailable)

                    Button("View Detailed Device Info") {
                        showingDeviceInfo = true
                    }
                    .foregroundColor(.blue)
                }

                // User Session Section
                Section("User Session") {
                    InfoRow(title: "User ID", value: viewModel.userId ?? "Not logged in")
                    InfoRow(title: "Session Duration", value: viewModel.sessionDuration)
                    InfoRow(title: "Last API Call", value: viewModel.lastAPICall)
                    InfoRow(title: "Auth Token Status", value: viewModel.authTokenStatus) {
                        StatusIndicator(status: viewModel.authTokenValid ? .connected : .disconnected)
                    }
                }

                // Debug Tools Section
                Section("Debug Tools") {
                    NavigationLink("View Logs") {
                        LogsView(logs: viewModel.logs)
                    }

                    Button("API Tester") {
                        showingAPITester = true
                    }
                    .foregroundColor(.blue)

                    Button("Export Debug Data") {
                        viewModel.exportDebugData()
                    }
                    .foregroundColor(.blue)

                    Button("Simulate Crash") {
                        viewModel.simulateCrash()
                    }
                    .foregroundColor(.orange)
                }

                // Data Management Section
                Section("Data Management") {
                    InfoRow(title: "Cache Size", value: viewModel.cacheSize)
                    InfoRow(title: "Database Size", value: viewModel.databaseSize)
                    InfoRow(title: "User Defaults Size", value: viewModel.userDefaultsSize)

                    Button("Clear Cache") {
                        viewModel.clearCache()
                    }
                    .foregroundColor(.orange)

                    Button("Clear All Data") {
                        showingClearDataConfirmation = true
                    }
                    .foregroundColor(.red)
                }

                // Feature Flags Section
                Section("Feature Flags") {
                    ForEach(viewModel.featureFlags, id: \.name) { flag in
                        HStack {
                            Text(flag.name)
                            Spacer()
                            Toggle("", isOn: .constant(flag.enabled))
                                .disabled(true)
                        }
                    }

                    Button("Refresh Feature Flags") {
                        viewModel.refreshFeatureFlags()
                    }
                    .foregroundColor(.blue)
                }

                // Performance Metrics Section
                Section("Performance Metrics") {
                    InfoRow(title: "App Launch Time", value: viewModel.appLaunchTime)
                    InfoRow(title: "Memory Pressure", value: viewModel.memoryPressure)
                    InfoRow(title: "CPU Usage", value: viewModel.cpuUsage)
                    InfoRow(title: "Network Requests", value: "\(viewModel.networkRequestCount)")
                    InfoRow(title: "Failed Requests", value: "\(viewModel.failedRequestCount)")
                }

                // Advanced Debug Section
                Section("Advanced Debug") {
                    Toggle("Verbose Logging", isOn: $viewModel.verboseLogging)
                    Toggle("Mock API Responses", isOn: $viewModel.mockAPIResponses)
                    Toggle("Show Touch Indicators", isOn: $viewModel.showTouchIndicators)
                    Toggle("Force Dark Mode", isOn: $viewModel.forceDarkMode)

                    Button("Reset All Settings") {
                        viewModel.resetAllSettings()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Debug Console")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Refresh") {
                        viewModel.refreshData()
                    }
                }
            }
            .sheet(isPresented: $showingAPITester) {
                APITesterView()
            }
            .sheet(isPresented: $showingDeviceInfo) {
                DeviceInfoView(viewModel: viewModel)
            }
            .alert("Clear All Data", isPresented: $showingClearDataConfirmation) {
                Button("Cancel", role: .cancel) { }
                Button("Clear", role: .destructive) {
                    viewModel.clearAllData()
                }
            } message: {
                Text("This will clear all app data including cache, user preferences, and stored data. This action cannot be undone.")
            }
        }
        .onAppear {
            viewModel.loadDebugInfo()
        }
    }
}

struct InfoRow<Accessory: View>: View {
    let title: String
    let value: String
    let accessory: Accessory?

    init(title: String, value: String, @ViewBuilder accessory: () -> Accessory = { EmptyView() }) {
        self.title = title
        self.value = value
        self.accessory = accessory()
    }

    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline)
            Spacer()
            if let accessory = accessory {
                accessory
            }
            Text(value)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.trailing)
        }
    }
}

struct Badge: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.semibold)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(color.opacity(0.2))
            .foregroundColor(color)
            .cornerRadius(4)
    }
}

struct StatusIndicator: View {
    let status: APIStatus

    var body: some View {
        Circle()
            .fill(status.color)
            .frame(width: 8, height: 8)
    }
}

struct LogsView: View {
    let logs: [DebugLog]
    @State private var searchText = ""
    @State private var selectedLogLevel = LogLevel.all

    var filteredLogs: [DebugLog] {
        logs.filter { log in
            let matchesSearch = searchText.isEmpty || log.message.localizedCaseInsensitiveContains(searchText)
            let matchesLevel = selectedLogLevel == .all || log.level == selectedLogLevel
            return matchesSearch && matchesLevel
        }
    }

    var body: some View {
        VStack {
            // Search and Filter
            VStack(spacing: 8) {
                SearchBar(text: $searchText)

                Picker("Log Level", selection: $selectedLogLevel) {
                    ForEach(LogLevel.allCases, id: \.self) { level in
                        Text(level.rawValue.capitalized).tag(level)
                    }
                }
                .pickerStyle(.segmented)
            }
            .padding()

            // Logs List
            List(filteredLogs) { log in
                LogRowView(log: log)
            }
        }
        .navigationTitle("Debug Logs")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct LogRowView: View {
    let log: DebugLog
    @State private var isExpanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(log.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)

                Badge(text: log.level.rawValue.uppercased(), color: log.level.color)

                Spacer()

                Button {
                    isExpanded.toggle()
                } label: {
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Text(log.message)
                .font(.caption)
                .lineLimit(isExpanded ? nil : 2)

            if isExpanded && !log.details.isEmpty {
                Text(log.details)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }
        }
        .padding(.vertical, 2)
    }
}

struct SearchBar: View {
    @Binding var text: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)

            TextField("Search logs...", text: $text)

            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(Color(.systemGray6))
        .cornerRadius(8)
    }
}

struct APITesterView: View {
    @StateObject private var viewModel = APITesterViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Request") {
                    Picker("Method", selection: $viewModel.method) {
                        ForEach(HTTPMethod.allCases, id: \.self) { method in
                            Text(method.rawValue).tag(method)
                        }
                    }

                    TextField("Endpoint", text: $viewModel.endpoint)

                    TextEditor(text: $viewModel.requestBody)
                        .frame(height: 100)
                        .font(.caption)
                }

                Section("Headers") {
                    ForEach(viewModel.headers.indices, id: \.self) { index in
                        HStack {
                            TextField("Key", text: $viewModel.headers[index].key)
                            TextField("Value", text: $viewModel.headers[index].value)
                        }
                    }

                    Button("Add Header") {
                        viewModel.addHeader()
                    }
                }

                Section {
                    Button("Send Request") {
                        viewModel.sendRequest()
                    }
                    .disabled(viewModel.isLoading)
                }

                if viewModel.isLoading {
                    Section("Response") {
                        HStack {
                            ProgressView()
                            Text("Loading...")
                        }
                    }
                } else if let response = viewModel.response {
                    Section("Response") {
                        Text("Status: \(response.statusCode)")

                        ScrollView {
                            Text(response.body)
                                .font(.caption)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .frame(height: 200)
                    }
                }
            }
            .navigationTitle("API Tester")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct DeviceInfoView: View {
    let viewModel: DebugViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Section("Hardware") {
                    InfoRow(title: "Device Model", value: viewModel.deviceModel)
                    InfoRow(title: "Device Name", value: viewModel.deviceName)
                    InfoRow(title: "System Version", value: viewModel.iOSVersion)
                    InfoRow(title: "Screen Resolution", value: viewModel.screenResolution)
                    InfoRow(title: "Screen Scale", value: viewModel.screenScale)
                }

                Section("Performance") {
                    InfoRow(title: "Available Memory", value: viewModel.availableMemory)
                    InfoRow(title: "Used Memory", value: viewModel.usedMemory)
                    InfoRow(title: "Storage Free", value: viewModel.storageAvailable)
                    InfoRow(title: "Storage Used", value: viewModel.storageUsed)
                    InfoRow(title: "Battery Level", value: viewModel.batteryLevel)
                    InfoRow(title: "Battery State", value: viewModel.batteryState)
                }

                Section("Network") {
                    InfoRow(title: "Connection Type", value: viewModel.connectionType)
                    InfoRow(title: "Carrier", value: viewModel.carrierName)
                    InfoRow(title: "Country Code", value: viewModel.countryCode)
                }

                Section("Identifiers") {
                    InfoRow(title: "Vendor ID", value: viewModel.vendorIdentifier)
                    InfoRow(title: "Ad ID", value: viewModel.advertisingIdentifier)
                    InfoRow(title: "Push Token", value: viewModel.pushToken)
                }
            }
            .navigationTitle("Device Information")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview
struct DebugView_Previews: PreviewProvider {
    static var previews: some View {
        DebugView()
    }
}
