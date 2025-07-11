//
//  ExternalEventsFilterView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI

struct ExternalEventsFilterView: View {
    @Binding var selectedCategory: String
    @Binding var selectedLocation: String
    @Binding var selectedDate: Date
    let categories: [EventCategory]
    let onApply: (String, String, Date) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var tempCategory: String
    @State private var tempLocation: String
    @State private var tempDate: Date
    @State private var showingDatePicker = false

    init(
        selectedCategory: Binding<String>,
        selectedLocation: Binding<String>,
        selectedDate: Binding<Date>,
        categories: [EventCategory],
        onApply: @escaping (String, String, Date) -> Void
    ) {
        self._selectedCategory = selectedCategory
        self._selectedLocation = selectedLocation
        self._selectedDate = selectedDate
        self.categories = categories
        self.onApply = onApply

        self._tempCategory = State(initialValue: selectedCategory.wrappedValue)
        self._tempLocation = State(initialValue: selectedLocation.wrappedValue)
        self._tempDate = State(initialValue: selectedDate.wrappedValue)
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Category") {
                    Picker("Category", selection: $tempCategory) {
                        ForEach(categories) { category in
                            Text(category.name)
                                .tag(category.id)
                        }
                    }
                    .pickerStyle(.menu)
                }

                Section("Location") {
                    HStack {
                        Image(systemName: "location")
                            .foregroundColor(.blue)
                            .frame(width: 20)

                        TextField("Enter city or address", text: $tempLocation)
                            .textFieldStyle(.plain)

                        if !tempLocation.isEmpty {
                            Button {
                                tempLocation = ""
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Date") {
                    Button {
                        showingDatePicker = true
                    } label: {
                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(.blue)
                                .frame(width: 20)

                            Text(formatDate(tempDate))
                                .foregroundColor(.primary)

                            Spacer()

                            if !Calendar.current.isDateInToday(tempDate) {
                                Button {
                                    tempDate = Date()
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.gray)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }

                Section {
                    Button("Clear All Filters") {
                        tempCategory = "all"
                        tempLocation = ""
                        tempDate = Date()
                    }
                    .foregroundColor(.red)
                    .frame(maxWidth: .infinity, alignment: .center)
                }
            }
            .navigationTitle("Filter Events")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        selectedCategory = tempCategory
                        selectedLocation = tempLocation
                        selectedDate = tempDate
                        onApply(tempCategory, tempLocation, tempDate)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
            .sheet(isPresented: $showingDatePicker) {
                NavigationView {
                    VStack {
                        DatePicker(
                            "Select Date",
                            selection: $tempDate,
                            in: Date()...,
                            displayedComponents: .date
                        )
                        .datePickerStyle(.wheel)
                        .padding()

                        Spacer()
                    }
                    .navigationTitle("Select Date")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Cancel") {
                                showingDatePicker = false
                            }
                        }

                        ToolbarItem(placement: .navigationBarTrailing) {
                            Button("Done") {
                                showingDatePicker = false
                            }
                            .fontWeight(.semibold)
                        }
                    }
                }
                .presentationDetents([.medium])
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        if Calendar.current.isDateInToday(date) {
            return "Any Date"
        }

        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Preview
struct ExternalEventsFilterView_Previews: PreviewProvider {
    static var previews: some View {
        ExternalEventsFilterView(
            selectedCategory: .constant("all"),
            selectedLocation: .constant(""),
            selectedDate: .constant(Date()),
            categories: [
                EventCategory(id: "all", name: "All Categories"),
                EventCategory(id: "music", name: "Music"),
                EventCategory(id: "tech", name: "Technology"),
                EventCategory(id: "art", name: "Art & Culture")
            ]
        ) { _, _, _ in }
    }
}
