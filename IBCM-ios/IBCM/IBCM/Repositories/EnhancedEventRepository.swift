import Foundation

protocol EnhancedEventRepository {
    func getEventAnalytics(eventId: String) async throws -> EventAnalytics
    func getEventAttendees(eventId: String, page: Int, limit: Int) async throws -> ([User], ListMetadata)
    func getEventInvitations(eventId: String) async throws -> [EventInvitation]
    func sendEventInvitation(eventId: String, userId: String) async throws -> EventInvitation
    func respondToInvitation(invitationId: String, accepted: Bool) async throws -> EventInvitation
    func getEventSchedule(eventId: String) async throws -> EventSchedule
    func updateEventSchedule(eventId: String, schedule: EventSchedule) async throws -> EventSchedule
    func getEventResources(eventId: String) async throws -> [EventResource]
    func addEventResource(eventId: String, resource: EventResource) async throws -> EventResource
    func removeEventResource(eventId: String, resourceId: String) async throws
    func getEventBudget(eventId: String) async throws -> EventBudget
    func updateEventBudget(eventId: String, budget: EventBudget) async throws -> EventBudget
    func getEventExpenses(eventId: String) async throws -> [EventExpense]
    func addEventExpense(eventId: String, expense: EventExpense) async throws -> EventExpense
    func removeEventExpense(eventId: String, expenseId: String) async throws
    func getEventTasks(eventId: String) async throws -> [EventTask]
    func addEventTask(eventId: String, task: EventTask) async throws -> EventTask
    func updateEventTask(eventId: String, task: EventTask) async throws -> EventTask
    func removeEventTask(eventId: String, taskId: String) async throws
    func assignEventTask(eventId: String, taskId: String, userId: String) async throws -> EventTask
    func getEventPolls(eventId: String) async throws -> [EventPoll]
    func createEventPoll(eventId: String, poll: EventPoll) async throws -> EventPoll
    func voteInPoll(eventId: String, pollId: String, optionId: String) async throws -> EventPoll
    func getEventMetrics(eventId: String) async throws -> EventMetrics
    func exportEventData(eventId: String, format: ExportFormat) async throws -> Data
}

class EnhancedEventRepositoryImpl: EnhancedEventRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedEventData>
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func getEventAnalytics(eventId: String) async throws -> EventAnalytics {
        let response: EventAnalyticsResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/analytics",
            method: "GET"
        )
        return response.data
    }
    
    func getEventAttendees(eventId: String, page: Int, limit: Int) async throws -> ([User], ListMetadata) {
        let response: UserListResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/attendees",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
        return (response.data, response.metadata)
    }
    
    func getEventInvitations(eventId: String) async throws -> [EventInvitation] {
        let response: EventInvitationListResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/invitations",
            method: "GET"
        )
        return response.data
    }
    
    func sendEventInvitation(eventId: String, userId: String) async throws -> EventInvitation {
        let response: EventInvitationResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/invitations",
            method: "POST",
            body: try JSONEncoder().encode(["userId": userId])
        )
        return response.data
    }
    
    func respondToInvitation(invitationId: String, accepted: Bool) async throws -> EventInvitation {
        let response: EventInvitationResponse = try await apiService.request(
            endpoint: "/events/invitations/\(invitationId)/respond",
            method: "POST",
            body: try JSONEncoder().encode(["accepted": accepted])
        )
        return response.data
    }
    
    func getEventSchedule(eventId: String) async throws -> EventSchedule {
        if let cached = cache.object(forKey: "\(eventId)_schedule" as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
                return cached.data as! EventSchedule
            }
        }
        
        let response: EventScheduleResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/schedule",
            method: "GET"
        )
        
        cache.setObject(
            CachedEventData(data: response.data, timestamp: Date()),
            forKey: "\(eventId)_schedule" as NSString
        )
        return response.data
    }
    
    func updateEventSchedule(eventId: String, schedule: EventSchedule) async throws -> EventSchedule {
        let response: EventScheduleResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/schedule",
            method: "PUT",
            body: try JSONEncoder().encode(schedule)
        )
        
        cache.setObject(
            CachedEventData(data: response.data, timestamp: Date()),
            forKey: "\(eventId)_schedule" as NSString
        )
        return response.data
    }
    
    func getEventResources(eventId: String) async throws -> [EventResource] {
        let response: EventResourceListResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/resources",
            method: "GET"
        )
        return response.data
    }
    
    func addEventResource(eventId: String, resource: EventResource) async throws -> EventResource {
        let response: EventResourceResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/resources",
            method: "POST",
            body: try JSONEncoder().encode(resource)
        )
        return response.data
    }
    
    func removeEventResource(eventId: String, resourceId: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/resources/\(resourceId)",
            method: "DELETE"
        )
        
        if !response.success {
            throw EnhancedEventError.resourceRemovalFailed
        }
    }
    
    func getEventBudget(eventId: String) async throws -> EventBudget {
        let response: EventBudgetResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/budget",
            method: "GET"
        )
        return response.data
    }
    
    func updateEventBudget(eventId: String, budget: EventBudget) async throws -> EventBudget {
        let response: EventBudgetResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/budget",
            method: "PUT",
            body: try JSONEncoder().encode(budget)
        )
        return response.data
    }
    
    func getEventExpenses(eventId: String) async throws -> [EventExpense] {
        let response: EventExpenseListResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/expenses",
            method: "GET"
        )
        return response.data
    }
    
    func addEventExpense(eventId: String, expense: EventExpense) async throws -> EventExpense {
        let response: EventExpenseResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/expenses",
            method: "POST",
            body: try JSONEncoder().encode(expense)
        )
        return response.data
    }
    
    func removeEventExpense(eventId: String, expenseId: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/expenses/\(expenseId)",
            method: "DELETE"
        )
        
        if !response.success {
            throw EnhancedEventError.expenseRemovalFailed
        }
    }
    
    func getEventTasks(eventId: String) async throws -> [EventTask] {
        let response: EventTaskListResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/tasks",
            method: "GET"
        )
        return response.data
    }
    
    func addEventTask(eventId: String, task: EventTask) async throws -> EventTask {
        let response: EventTaskResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/tasks",
            method: "POST",
            body: try JSONEncoder().encode(task)
        )
        return response.data
    }
    
    func updateEventTask(eventId: String, task: EventTask) async throws -> EventTask {
        let response: EventTaskResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/tasks/\(task.id)",
            method: "PUT",
            body: try JSONEncoder().encode(task)
        )
        return response.data
    }
    
    func removeEventTask(eventId: String, taskId: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/tasks/\(taskId)",
            method: "DELETE"
        )
        
        if !response.success {
            throw EnhancedEventError.taskRemovalFailed
        }
    }
    
    func assignEventTask(eventId: String, taskId: String, userId: String) async throws -> EventTask {
        let response: EventTaskResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/tasks/\(taskId)/assign",
            method: "POST",
            body: try JSONEncoder().encode(["userId": userId])
        )
        return response.data
    }
    
    func getEventPolls(eventId: String) async throws -> [EventPoll] {
        let response: EventPollListResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/polls",
            method: "GET"
        )
        return response.data
    }
    
    func createEventPoll(eventId: String, poll: EventPoll) async throws -> EventPoll {
        let response: EventPollResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/polls",
            method: "POST",
            body: try JSONEncoder().encode(poll)
        )
        return response.data
    }
    
    func voteInPoll(eventId: String, pollId: String, optionId: String) async throws -> EventPoll {
        let response: EventPollResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/polls/\(pollId)/vote",
            method: "POST",
            body: try JSONEncoder().encode(["optionId": optionId])
        )
        return response.data
    }
    
    func getEventMetrics(eventId: String) async throws -> EventMetrics {
        let response: EventMetricsResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/metrics",
            method: "GET"
        )
        return response.data
    }
    
    func exportEventData(eventId: String, format: ExportFormat) async throws -> Data {
        let response: DataResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/export",
            method: "GET",
            queryItems: [URLQueryItem(name: "format", value: format.rawValue)]
        )
        return response.data
    }
}

// MARK: - Cache Types
private class CachedEventData {
    let data: Any
    let timestamp: Date
    
    init(data: Any, timestamp: Date) {
        self.data = data
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct EventAnalyticsResponse: Codable {
    let success: Bool
    let data: EventAnalytics
    let message: String?
}

struct EventInvitationResponse: Codable {
    let success: Bool
    let data: EventInvitation
    let message: String?
}

struct EventInvitationListResponse: Codable {
    let success: Bool
    let data: [EventInvitation]
    let message: String?
}

struct EventScheduleResponse: Codable {
    let success: Bool
    let data: EventSchedule
    let message: String?
}

struct EventResourceResponse: Codable {
    let success: Bool
    let data: EventResource
    let message: String?
}

struct EventResourceListResponse: Codable {
    let success: Bool
    let data: [EventResource]
    let message: String?
}

struct EventBudgetResponse: Codable {
    let success: Bool
    let data: EventBudget
    let message: String?
}

struct EventExpenseResponse: Codable {
    let success: Bool
    let data: EventExpense
    let message: String?
}

struct EventExpenseListResponse: Codable {
    let success: Bool
    let data: [EventExpense]
    let message: String?
}

struct EventTaskResponse: Codable {
    let success: Bool
    let data: EventTask
    let message: String?
}

struct EventTaskListResponse: Codable {
    let success: Bool
    let data: [EventTask]
    let message: String?
}

struct EventPollResponse: Codable {
    let success: Bool
    let data: EventPoll
    let message: String?
}

struct EventPollListResponse: Codable {
    let success: Bool
    let data: [EventPoll]
    let message: String?
}

struct EventMetricsResponse: Codable {
    let success: Bool
    let data: EventMetrics
    let message: String?
}

struct DataResponse: Codable {
    let success: Bool
    let data: Data
    let message: String?
}

// MARK: - Enums
enum ExportFormat: String {
    case pdf
    case csv
    case json
    case xlsx
}

enum EnhancedEventError: LocalizedError {
    case analyticsNotAvailable
    case invitationFailed
    case resourceRemovalFailed
    case expenseRemovalFailed
    case taskRemovalFailed
    case pollCreationFailed
    case exportFailed
    
    var errorDescription: String? {
        switch self {
        case .analyticsNotAvailable:
            return "Analytics data is not available"
        case .invitationFailed:
            return "Failed to send invitation"
        case .resourceRemovalFailed:
            return "Failed to remove resource"
        case .expenseRemovalFailed:
            return "Failed to remove expense"
        case .taskRemovalFailed:
            return "Failed to remove task"
        case .pollCreationFailed:
            return "Failed to create poll"
        case .exportFailed:
            return "Failed to export event data"
        }
    }
} 