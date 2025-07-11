import Foundation
import CoreLocation

struct Location: Codable, Equatable {
    let latitude: Double
    let longitude: Double
    let name: String?
    let address: String?
    let city: String?
    let state: String?
    let country: String?
    let postalCode: String?
    
    init(latitude: Double, longitude: Double, name: String? = nil, address: String? = nil,
         city: String? = nil, state: String? = nil, country: String? = nil, postalCode: String? = nil) {
        self.latitude = latitude
        self.longitude = longitude
        self.name = name
        self.address = address
        self.city = city
        self.state = state
        self.country = country
        self.postalCode = postalCode
    }
    
    init(coordinate: CLLocationCoordinate2D, name: String? = nil, address: String? = nil,
         city: String? = nil, state: String? = nil, country: String? = nil, postalCode: String? = nil) {
        self.latitude = coordinate.latitude
        self.longitude = coordinate.longitude
        self.name = name
        self.address = address
        self.city = city
        self.state = state
        self.country = country
        self.postalCode = postalCode
    }
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
    
    var clLocation: CLLocation {
        CLLocation(latitude: latitude, longitude: longitude)
    }
    
    func distance(from otherLocation: Location) -> CLLocationDistance {
        return clLocation.distance(from: otherLocation.clLocation)
    }
    
    func formattedAddress() -> String {
        var components: [String] = []
        
        if let name = name, !name.isEmpty {
            components.append(name)
        }
        
        if let address = address, !address.isEmpty {
            components.append(address)
        }
        
        var cityStateZip: [String] = []
        if let city = city, !city.isEmpty {
            cityStateZip.append(city)
        }
        
        if let state = state, !state.isEmpty {
            cityStateZip.append(state)
        }
        
        if let postalCode = postalCode, !postalCode.isEmpty {
            cityStateZip.append(postalCode)
        }
        
        if !cityStateZip.isEmpty {
            components.append(cityStateZip.joined(separator: ", "))
        }
        
        if let country = country, !country.isEmpty {
            components.append(country)
        }
        
        return components.joined(separator: ", ")
    }
    
    static func == (lhs: Location, rhs: Location) -> Bool {
        return lhs.latitude == rhs.latitude &&
               lhs.longitude == rhs.longitude &&
               lhs.name == rhs.name &&
               lhs.address == rhs.address &&
               lhs.city == rhs.city &&
               lhs.state == rhs.state &&
               lhs.country == rhs.country &&
               lhs.postalCode == rhs.postalCode
    }
} 