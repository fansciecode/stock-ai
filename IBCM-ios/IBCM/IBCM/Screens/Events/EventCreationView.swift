import SwiftUI

struct EventCreationView: View {
    @StateObject private var viewModel = EventCreationViewModel()
    @Environment(\.dismiss) private var dismiss
    @StateObject private var aiViewModel = AIViewModel()
    
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
                    
                    HStack {
                        Text("Description")
                            .font(.headline)
                        
                        Spacer()
                        
                        Button("Generate") {
                            if !viewModel.formState.title.isEmpty && viewModel.formState.category != nil {
                                aiViewModel.generateDescription(
                                    title: viewModel.formState.title,
                                    category: viewModel.formState.category?.rawValue ?? "",
                                    context: viewModel.formState.location
                                )
                            } else {
                                // Show alert that title and category are required
                                viewModel.showError = true
                                viewModel.errorMessage = "Please enter a title and select a category first."
                            }
                        }
                        .font(.caption)
                        .disabled(viewModel.formState.title.isEmpty || viewModel.formState.category == nil)
                    }
                    
                    TextEditor(text: $viewModel.formState.description)
                        .frame(height: 120)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )
                        .onChange(of: aiViewModel.generatedDescription) { newValue in
                            if !newValue.isEmpty {
                                viewModel.formState.description = newValue
                            }
                        }
                    
                    HStack {
                        Text("Tags")
                            .font(.headline)
                        
                        Spacer()
                        
                        Button("Generate Tags") {
                            if !viewModel.formState.description.isEmpty {
                                aiViewModel.generateTags(content: viewModel.formState.description)
                            } else {
                                // Show alert that description is required
                                viewModel.showError = true
                                viewModel.errorMessage = "Please enter a description first."
                            }
                        }
                        .font(.caption)
                        .disabled(viewModel.formState.description.isEmpty)
                    }
                    
                    if !aiViewModel.generatedTags.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                ForEach(aiViewModel.generatedTags, id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(Color.blue.opacity(0.2))
                                        .foregroundColor(.blue)
                                        .cornerRadius(12)
                                }
                            }
                        }
                        .frame(height: 30)
                    }
                    
                    if aiViewModel.isLoading {
                        ProgressView("Generating...")
                            .padding()
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
            .alert(isPresented: $aiViewModel.showError) {
                Alert(
                    title: Text("Generation Error"),
                    message: Text(aiViewModel.errorMessage ?? "An unknown error occurred"),
                    dismissButton: .default(Text("OK"))
                )
            }
        }
    }
}

#Preview {
    EventCreationView()
} 