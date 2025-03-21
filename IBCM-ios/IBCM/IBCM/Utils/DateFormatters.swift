import Foundation

// MARK: - Date Formatters
struct DateFormatters {
    static let iso8601Full: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
    
    static let isoDate: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter
    }()
    
    static let isoTime: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        return formatter
    }()
}

// MARK: - Custom Date Encoding/Decoding Strategies
extension JSONDecoder {
    static let customized: JSONDecoder = {
        let decoder = JSONDecoder()
        
        // Date decoding strategy
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            
            // Try ISO8601 with fractional seconds
            if let date = DateFormatters.iso8601Full.date(from: dateString) {
                return date
            }
            
            // Try ISO date only
            if let date = DateFormatters.isoDate.date(from: dateString) {
                return date
            }
            
            // Try timestamp
            if let timestamp = TimeInterval(dateString) {
                return Date(timeIntervalSince1970: timestamp)
            }
            
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date string \(dateString)"
            )
        }
        
        return decoder
    }()
}

extension JSONEncoder {
    static let customized: JSONEncoder = {
        let encoder = JSONEncoder()
        
        // Date encoding strategy
        encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(DateFormatters.iso8601Full.string(from: date))
        }
        
        return encoder
    }()
}

// MARK: - Custom Property Wrappers
@propertyWrapper
struct ISO8601Date {
    private var date: Date
    
    var wrappedValue: Date {
        get { date }
        set { date = newValue }
    }
    
    init(wrappedValue: Date) {
        self.date = wrappedValue
    }
}

extension ISO8601Date: Codable {
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let dateString = try container.decode(String.self)
        
        if let date = DateFormatters.iso8601Full.date(from: dateString) {
            self.date = date
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Invalid ISO8601 date format"
            )
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(DateFormatters.iso8601Full.string(from: date))
    }
}

// Usage example:
/*
struct Event: Codable {
    let id: String
    @ISO8601Date var createdAt: Date
    @ISO8601Date var updatedAt: Date
}
*/ 