//
//  BookingRepository.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import Foundation
import Combine

protocol BookingRepositoryProtocol {
    func createBooking(_ booking: BookingRequest) -> AnyPublisher<Booking, Error>
    func getBookings(userId: String) -> AnyPublisher<[Booking], Error>
    func getBookingById(_ id: String) -> AnyPublisher<Booking, Error>
    func updateBooking(_ booking: Booking) -> AnyPublisher<Booking, Error>
    func cancelBooking(_ id: String) -> AnyPublisher<Void, Error>
    func getBookingsByStatus(_ status: BookingStatus) -> AnyPublisher<[Booking], Error>
    func getBookingsByEvent(_ eventId: String) -> AnyPublisher<[Booking], Error>
    func getBookingsByDateRange(startDate: Date, endDate: Date) -> AnyPublisher<[Booking], Error>
}

class BookingRepository: BookingRepositoryProtocol {
    private let apiClient: APIClient
    private let networkService: NetworkService

    init(apiClient: APIClient = .shared, networkService: NetworkService = .shared) {
        self.apiClient = apiClient
        self.networkService = networkService
    }

    func createBooking(_ booking: BookingRequest) -> AnyPublisher<Booking, Error> {
        let endpoint = APIEndpoint.createBooking
        return networkService.request(endpoint: endpoint, method: .POST, body: booking)
            .map { (response: APIResponse<Booking>) in response.data }
            .eraseToAnyPublisher()
    }

    func getBookings(userId: String) -> AnyPublisher<[Booking], Error> {
        let endpoint = APIEndpoint.getBookings(userId: userId)
        return networkService.request(endpoint: endpoint, method: .GET)
            .map { (response: APIResponse<[Booking]>) in response.data }
            .eraseToAnyPublisher()
    }

    func getBookingById(_ id: String) -> AnyPublisher<Booking, Error> {
        let endpoint = APIEndpoint.getBookingById(id: id)
        return networkService.request(endpoint: endpoint, method: .GET)
            .map { (response: APIResponse<Booking>) in response.data }
            .eraseToAnyPublisher()
    }

    func updateBooking(_ booking: Booking) -> AnyPublisher<Booking, Error> {
        let endpoint = APIEndpoint.updateBooking(id: booking.id)
        return networkService.request(endpoint: endpoint, method: .PUT, body: booking)
            .map { (response: APIResponse<Booking>) in response.data }
            .eraseToAnyPublisher()
    }

    func cancelBooking(_ id: String) -> AnyPublisher<Void, Error> {
        let endpoint = APIEndpoint.cancelBooking(id: id)
        return networkService.request(endpoint: endpoint, method: .DELETE)
            .map { (response: APIResponse<EmptyResponse>) in () }
            .eraseToAnyPublisher()
    }

    func getBookingsByStatus(_ status: BookingStatus) -> AnyPublisher<[Booking], Error> {
        let endpoint = APIEndpoint.getBookingsByStatus(status: status)
        return networkService.request(endpoint: endpoint, method: .GET)
            .map { (response: APIResponse<[Booking]>) in response.data }
            .eraseToAnyPublisher()
    }

    func getBookingsByEvent(_ eventId: String) -> AnyPublisher<[Booking], Error> {
        let endpoint = APIEndpoint.getBookingsByEvent(eventId: eventId)
        return networkService.request(endpoint: endpoint, method: .GET)
            .map { (response: APIResponse<[Booking]>) in response.data }
            .eraseToAnyPublisher()
    }

    func getBookingsByDateRange(startDate: Date, endDate: Date) -> AnyPublisher<[Booking], Error> {
        let endpoint = APIEndpoint.getBookingsByDateRange(startDate: startDate, endDate: endDate)
        return networkService.request(endpoint: endpoint, method: .GET)
            .map { (response: APIResponse<[Booking]>) in response.data }
            .eraseToAnyPublisher()
    }
}

// MARK: - Mock Implementation
class MockBookingRepository: BookingRepositoryProtocol {
    private var bookings: [Booking] = []

    init() {
        // Initialize with mock data
        bookings = generateMockBookings()
    }

    func createBooking(_ booking: BookingRequest) -> AnyPublisher<Booking, Error> {
        let newBooking = Booking(
            id: UUID().uuidString,
            userId: booking.userId,
            eventId: booking.eventId,
            packageId: booking.packageId,
            attendeeCount: booking.attendeeCount,
            totalAmount: booking.totalAmount,
            status: .pending,
            bookingDate: Date(),
            eventDate: booking.eventDate,
            paymentStatus: .pending,
            cancellationReason: nil,
            refundAmount: nil,
            notes: booking.notes,
            createdAt: Date(),
            updatedAt: Date()
        )

        bookings.append(newBooking)

        return Just(newBooking)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(1), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func getBookings(userId: String) -> AnyPublisher<[Booking], Error> {
        let userBookings = bookings.filter { $0.userId == userId }
        return Just(userBookings)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func getBookingById(_ id: String) -> AnyPublisher<Booking, Error> {
        if let booking = bookings.first(where: { $0.id == id }) {
            return Just(booking)
                .setFailureType(to: Error.self)
                .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
                .eraseToAnyPublisher()
        } else {
            return Fail(error: BookingError.bookingNotFound)
                .eraseToAnyPublisher()
        }
    }

    func updateBooking(_ booking: Booking) -> AnyPublisher<Booking, Error> {
        if let index = bookings.firstIndex(where: { $0.id == booking.id }) {
            var updatedBooking = booking
            updatedBooking.updatedAt = Date()
            bookings[index] = updatedBooking

            return Just(updatedBooking)
                .setFailureType(to: Error.self)
                .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
                .eraseToAnyPublisher()
        } else {
            return Fail(error: BookingError.bookingNotFound)
                .eraseToAnyPublisher()
        }
    }

    func cancelBooking(_ id: String) -> AnyPublisher<Void, Error> {
        if let index = bookings.firstIndex(where: { $0.id == id }) {
            bookings[index].status = .cancelled
            bookings[index].cancellationReason = "Cancelled by user"
            bookings[index].updatedAt = Date()

            return Just(())
                .setFailureType(to: Error.self)
                .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
                .eraseToAnyPublisher()
        } else {
            return Fail(error: BookingError.bookingNotFound)
                .eraseToAnyPublisher()
        }
    }

    func getBookingsByStatus(_ status: BookingStatus) -> AnyPublisher<[Booking], Error> {
        let filteredBookings = bookings.filter { $0.status == status }
        return Just(filteredBookings)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func getBookingsByEvent(_ eventId: String) -> AnyPublisher<[Booking], Error> {
        let eventBookings = bookings.filter { $0.eventId == eventId }
        return Just(eventBookings)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func getBookingsByDateRange(startDate: Date, endDate: Date) -> AnyPublisher<[Booking], Error> {
        let filteredBookings = bookings.filter { booking in
            booking.eventDate >= startDate && booking.eventDate <= endDate
        }
        return Just(filteredBookings)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    private func generateMockBookings() -> [Booking] {
        return [
            Booking(
                id: "booking_1",
                userId: "user_1",
                eventId: "event_1",
                packageId: "package_1",
                attendeeCount: 2,
                totalAmount: 199.99,
                status: .confirmed,
                bookingDate: Date().addingTimeInterval(-86400),
                eventDate: Date().addingTimeInterval(86400),
                paymentStatus: .completed,
                cancellationReason: nil,
                refundAmount: nil,
                notes: "Looking forward to the event!",
                createdAt: Date().addingTimeInterval(-86400),
                updatedAt: Date().addingTimeInterval(-86400)
            ),
            Booking(
                id: "booking_2",
                userId: "user_1",
                eventId: "event_2",
                packageId: "package_2",
                attendeeCount: 1,
                totalAmount: 99.99,
                status: .pending,
                bookingDate: Date().addingTimeInterval(-3600),
                eventDate: Date().addingTimeInterval(172800),
                paymentStatus: .pending,
                cancellationReason: nil,
                refundAmount: nil,
                notes: nil,
                createdAt: Date().addingTimeInterval(-3600),
                updatedAt: Date().addingTimeInterval(-3600)
            ),
            Booking(
                id: "booking_3",
                userId: "user_2",
                eventId: "event_1",
                packageId: "package_1",
                attendeeCount: 3,
                totalAmount: 299.99,
                status: .cancelled,
                bookingDate: Date().addingTimeInterval(-172800),
                eventDate: Date().addingTimeInterval(86400),
                paymentStatus: .refunded,
                cancellationReason: "Changed plans",
                refundAmount: 299.99,
                notes: "Will book again next time",
                createdAt: Date().addingTimeInterval(-172800),
                updatedAt: Date().addingTimeInterval(-86400)
            )
        ]
    }
}

// MARK: - Error Types
enum BookingError: Error, LocalizedError {
    case bookingNotFound
    case invalidBookingData
    case paymentFailed
    case bookingAlreadyCancelled
    case cancellationNotAllowed
    case insufficientCapacity
    case eventNotFound
    case packageNotFound
    case networkError

    var errorDescription: String? {
        switch self {
        case .bookingNotFound:
            return "Booking not found"
        case .invalidBookingData:
            return "Invalid booking data"
        case .paymentFailed:
            return "Payment failed"
        case .bookingAlreadyCancelled:
            return "Booking is already cancelled"
        case .cancellationNotAllowed:
            return "Cancellation not allowed for this booking"
        case .insufficientCapacity:
            return "Insufficient capacity for this event"
        case .eventNotFound:
            return "Event not found"
        case .packageNotFound:
            return "Package not found"
        case .networkError:
            return "Network error occurred"
        }
    }
}

// MARK: - API Endpoints Extension
extension APIEndpoint {
    static let createBooking = APIEndpoint(path: "/bookings", requiresAuth: true)
    static func getBookings(userId: String) -> APIEndpoint {
        return APIEndpoint(path: "/bookings/user/\(userId)", requiresAuth: true)
    }
    static func getBookingById(id: String) -> APIEndpoint {
        return APIEndpoint(path: "/bookings/\(id)", requiresAuth: true)
    }
    static func updateBooking(id: String) -> APIEndpoint {
        return APIEndpoint(path: "/bookings/\(id)", requiresAuth: true)
    }
    static func cancelBooking(id: String) -> APIEndpoint {
        return APIEndpoint(path: "/bookings/\(id)/cancel", requiresAuth: true)
    }
    static func getBookingsByStatus(status: BookingStatus) -> APIEndpoint {
        return APIEndpoint(path: "/bookings/status/\(status.rawValue)", requiresAuth: true)
    }
    static func getBookingsByEvent(eventId: String) -> APIEndpoint {
        return APIEndpoint(path: "/bookings/event/\(eventId)", requiresAuth: true)
    }
    static func getBookingsByDateRange(startDate: Date, endDate: Date) -> APIEndpoint {
        let formatter = ISO8601DateFormatter()
        let start = formatter.string(from: startDate)
        let end = formatter.string(from: endDate)
        return APIEndpoint(path: "/bookings/date-range?start=\(start)&end=\(end)", requiresAuth: true)
    }
}
