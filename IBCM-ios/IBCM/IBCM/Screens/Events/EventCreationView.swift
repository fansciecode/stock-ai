import SwiftUI

struct EventCreationView: View {
    @StateObject private var viewModel = EventCreationViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section("Event Details") {
                    TextField("Title", text: $viewModel.formState.title)
                        .textFieldStyle(.roundedBorder)
                        .overlay {
                            if let error = viewModel.formState.titleError {
                                Text(error)
                                    .foregroundColor(.red)
                                    .font(.caption)
                                    .padding(.top, 40)
                            }
                        }
                    
                    TextEditor(text: $viewModel.formState.description)
                        .frame(height: 100)
                        .overlay {
                            if let error = viewModel.formState.descriptionError {
                                Text(error)
                                    .foregroundColor(.red)
                                    .font(.caption)
                                    .padding(.top, 110)
                            }
                        }
                }
                
                Section("Category & Visibility") {
                    Picker("Category", selection: $viewModel.formState.category) {
                        Text("Select Category").tag("")
                        ForEach(viewModel.categories, id: \.rawValue) { category in
                            Text(category.rawValue).tag(category.rawValue)
                        }
                    }
                    .overlay {
                        if let error = viewModel.formState.categoryError {
                            Text(error)
                                .foregroundColor(.red)
                                .font(.caption)
                                .padding(.top, 40)
                        }
                    }
                    
                    Picker("Visibility", selection: $viewModel.formState.visibility) {
                        Text("Public").tag(EventType.Visibility.public.rawValue)
                        Text("Private").tag(EventType.Visibility.private.rawValue)
                        Text("Invite Only").tag(EventType.Visibility.inviteOnly.rawValue)
                    }
                }
                
                Section("Date & Time") {
                    DatePicker("Date", selection: $viewModel.formState.date, displayedComponents: .date)
                    DatePicker("Time", selection: $viewModel.formState.time, displayedComponents: .hourAndMinute)
                }
                
                Section("Location") {
                    TextField("Location", text: $viewModel.formState.location)
                        .textFieldStyle(.roundedBorder)
                        .overlay {
                            if let error = viewModel.formState.locationError {
                                Text(error)
                                    .foregroundColor(.red)
                                    .font(.caption)
                                    .padding(.top, 40)
                            }
                        }
                }
                
                Section("Capacity") {
                    TextField("Maximum Attendees", value: $viewModel.formState.maxAttendees, format: .number)
                        .keyboardType(.numberPad)
                        .textFieldStyle(.roundedBorder)
                }
            }
            .navigationTitle("Create Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        Task {
                            await viewModel.createEvent()
                            dismiss()
                        }
                    }
                    .disabled(!viewModel.formState.isValid || viewModel.isLoading)
                }
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }
}

#Preview {
    EventCreationView()
} 