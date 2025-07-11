//
//  ReportView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Combine

struct ReportView: View {
    @StateObject private var viewModel = ReportViewModel()
    @State private var reportText = ""
    @State private var selectedReportType: ReportType = .bug
    @State private var selectedPriority: Priority = .medium
    @State private var contactEmail = ""
    @State private var attachments: [URL] = []
    @State private var showingImagePicker = false
    @State private var showingFilePicker = false
    @State private var showingSuccessAlert = false
    @State private var showingErrorAlert = false
    @Environment(\.dismiss) private var dismiss

    enum ReportType: String, CaseIterable {
        case bug = "Bug Report"
        case feature = "Feature Request"
        case content = "Content Issue"
        case security = "Security Issue"
        case performance = "Performance Issue"
        case other = "Other"
    }

    enum Priority: String, CaseIterable {
        case low = "Low"
        case medium = "Medium"
        case high = "High"
        case critical = "Critical"
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Report an Issue")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)

                        Text("Help us improve IBCM by reporting bugs, suggesting features, or other feedback.")
                            .font(.body)
                            .foregroundColor(.secondary)
                    }

                    // Report Type Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Report Type")
                            .font(.headline)
                            .fontWeight(.semibold)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 2), spacing: 8) {
                            ForEach(ReportType.allCases, id: \.self) { type in
                                Button(action: {
                                    selectedReportType = type
                                }) {
                                    VStack(spacing: 4) {
                                        Image(systemName: getReportTypeIcon(type))
                                            .font(.title2)
                                            .foregroundColor(selectedReportType == type ? .white : .blue)

                                        Text(type.rawValue)
                                            .font(.caption)
                                            .foregroundColor(selectedReportType == type ? .white : .primary)
                                            .multilineTextAlignment(.center)
                                    }
                                    .frame(maxWidth: .infinity, minHeight: 60)
                                    .background(selectedReportType == type ? Color.blue : Color.gray.opacity(0.1))
                                    .cornerRadius(12)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                    }

                    // Priority Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Priority")
                            .font(.headline)
                            .fontWeight(.semibold)

                        HStack(spacing: 8) {
                            ForEach(Priority.allCases, id: \.self) { priority in
                                Button(action: {
                                    selectedPriority = priority
                                }) {
                                    Text(priority.rawValue)
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                        .foregroundColor(selectedPriority == priority ? .white : getPriorityColor(priority))
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 8)
                                        .background(selectedPriority == priority ? getPriorityColor(priority) : Color.clear)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 20)
                                                .stroke(getPriorityColor(priority), lineWidth: 1)
                                        )
                                        .cornerRadius(20)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                        }
                    }

                    // Contact Email
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Contact Email (Optional)")
                            .font(.headline)
                            .fontWeight(.semibold)

                        TextField("your@email.com", text: $contactEmail)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                    }

                    // Report Description
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Description")
                            .font(.headline)
                            .fontWeight(.semibold)

                        Text("Please provide detailed information about the issue or feedback.")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        TextEditor(text: $reportText)
                            .frame(minHeight: 150)
                            .padding(8)
                            .background(Color.gray.opacity(0.1))
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                            )
                    }

                    // Attachments Section
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Attachments (Optional)")
                            .font(.headline)
                            .fontWeight(.semibold)

                        Text("Add screenshots, documents, or other files that help describe the issue.")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        HStack(spacing: 12) {
                            Button(action: {
                                showingImagePicker = true
                            }) {
                                HStack {
                                    Image(systemName: "photo")
                                    Text("Add Photo")
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.blue.opacity(0.1))
                                .foregroundColor(.blue)
                                .cornerRadius(8)
                            }

                            Button(action: {
                                showingFilePicker = true
                            }) {
                                HStack {
                                    Image(systemName: "doc")
                                    Text("Add File")
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.green.opacity(0.1))
                                .foregroundColor(.green)
                                .cornerRadius(8)
                            }
                        }

                        // Show attached files
                        if !attachments.isEmpty {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(attachments, id: \.self) { attachment in
                                        AttachmentCard(url: attachment) {
                                            attachments.removeAll { $0 == attachment }
                                        }
                                    }
                                }
                                .padding(.horizontal, 4)
                            }
                        }
                    }

                    // Submit Button
                    Button(action: {
                        submitReport()
                    }) {
                        HStack {
                            if viewModel.isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                                    .foregroundColor(.white)
                            } else {
                                Image(systemName: "paperplane.fill")
                                    .font(.title2)
                            }

                            Text("Submit Report")
                                .font(.headline)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isFormValid ? Color.blue : Color.gray)
                        .cornerRadius(12)
                    }
                    .disabled(!isFormValid || viewModel.isLoading)

                    // Character count
                    HStack {
                        Spacer()
                        Text("\(reportText.count)/1000")
                            .font(.caption)
                            .foregroundColor(reportText.count > 1000 ? .red : .secondary)
                    }
                }
                .padding()
            }
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() }
            )
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker { image in
                    // Handle selected image
                }
            }
            .sheet(isPresented: $showingFilePicker) {
                DocumentPicker { urls in
                    attachments.append(contentsOf: urls)
                }
            }
            .alert("Report Submitted", isPresented: $showingSuccessAlert) {
                Button("OK") { dismiss() }
            } message: {
                Text("Thank you for your feedback! We'll review your report and get back to you if needed.")
            }
            .alert("Error", isPresented: $showingErrorAlert) {
                Button("OK") { }
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred while submitting your report.")
            }
        }
    }

    // MARK: - Helper Methods
    private var isFormValid: Bool {
        !reportText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        reportText.count <= 1000 &&
        (contactEmail.isEmpty || isValidEmail(contactEmail))
    }

    private func submitReport() {
        let report = ReportData(
            type: selectedReportType,
            priority: selectedPriority,
            description: reportText,
            contactEmail: contactEmail.isEmpty ? nil : contactEmail,
            attachments: attachments
        )

        viewModel.submitReport(report) { [weak viewModel] success in
            DispatchQueue.main.async {
                if success {
                    showingSuccessAlert = true
                } else {
                    showingErrorAlert = true
                }
            }
        }
    }

    private func getReportTypeIcon(_ type: ReportType) -> String {
        switch type {
        case .bug:
            return "ladybug"
        case .feature:
            return "lightbulb"
        case .content:
            return "doc.text"
        case .security:
            return "lock.shield"
        case .performance:
            return "speedometer"
        case .other:
            return "questionmark.circle"
        }
    }

    private func getPriorityColor(_ priority: Priority) -> Color {
        switch priority {
        case .low:
            return .green
        case .medium:
            return .orange
        case .high:
            return .red
        case .critical:
            return .purple
        }
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegEx = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPred = NSPredicate(format:"SELF MATCHES %@", emailRegEx)
        return emailPred.evaluate(with: email)
    }
}

// MARK: - Attachment Card
struct AttachmentCard: View {
    let url: URL
    let onRemove: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(url.lastPathComponent)
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(1)

                Text(getFileSize(url))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.gray)
                    .font(.caption)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(6)
    }

    private func getFileSize(_ url: URL) -> String {
        do {
            let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
            if let size = attributes[.size] as? Int64 {
                return ByteCountFormatter.string(fromByteCount: size, countStyle: .file)
            }
        } catch {
            // Handle error
        }
        return "Unknown size"
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    let onImageSelected: (UIImage) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .photoLibrary
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker

        init(_ parent: ImagePicker) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.onImageSelected(image)
            }
            picker.dismiss(animated: true)
        }
    }
}

// MARK: - Document Picker
struct DocumentPicker: UIViewControllerRepresentable {
    let onDocumentsSelected: ([URL]) -> Void

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.item])
        picker.delegate = context.coordinator
        picker.allowsMultipleSelection = true
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIDocumentPickerDelegate {
        let parent: DocumentPicker

        init(_ parent: DocumentPicker) {
            self.parent = parent
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            parent.onDocumentsSelected(urls)
        }
    }
}

// MARK: - Report Data Model
struct ReportData {
    let type: ReportView.ReportType
    let priority: ReportView.Priority
    let description: String
    let contactEmail: String?
    let attachments: [URL]
}

// MARK: - Report View Model
class ReportViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let reportService = ReportService()

    func submitReport(_ report: ReportData, completion: @escaping (Bool) -> Void) {
        isLoading = true
        errorMessage = nil

        reportService.submitReport(report) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false

                switch result {
                case .success:
                    completion(true)
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                    completion(false)
                }
            }
        }
    }
}

// MARK: - Report Service
class ReportService {
    func submitReport(_ report: ReportData, completion: @escaping (Result<Void, Error>) -> Void) {
        // Simulate API call
        DispatchQueue.global().asyncAfter(deadline: .now() + 2.0) {
            // Simulate success/failure
            if Bool.random() {
                completion(.success(()))
            } else {
                completion(.failure(NSError(domain: "ReportService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to submit report"])))
            }
        }
    }
}

#Preview {
    ReportView()
}
