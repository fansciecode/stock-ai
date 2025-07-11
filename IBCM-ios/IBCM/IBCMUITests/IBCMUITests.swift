//
//  IBCMUITests.swift
//  IBCMUITests
//
//  Created by kiran Naik on 20/03/25.
//

import XCTest

final class IBCMUITests: XCTestCase {
    
    let app = XCUIApplication()

    override func setUpWithError() throws {
        // Put setup code here. This method is called before the invocation of each test method in the class.

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false
        
        // Launch the app before each test
        app.launch()
    }

    override func tearDownWithError() throws {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }
    
    // MARK: - Authentication Tests
    
    func testLoginScreen() throws {
        // Test login screen elements
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.secureTextFields["Password"].exists)
        XCTAssertTrue(app.buttons["Login"].exists)
        XCTAssertTrue(app.buttons["Sign Up"].exists)
        XCTAssertTrue(app.buttons["Forgot Password?"].exists)
    }
    
    func testSignupScreen() throws {
        // Navigate to signup
        app.buttons["Sign Up"].tap()
        
        // Test signup screen elements
        XCTAssertTrue(app.textFields["Full Name"].exists)
        XCTAssertTrue(app.textFields["Email"].exists)
        XCTAssertTrue(app.secureTextFields["Password"].exists)
        XCTAssertTrue(app.secureTextFields["Confirm Password"].exists)
        XCTAssertTrue(app.buttons["Create Account"].exists)
    }
    
    // MARK: - Main App Tests
    
    func testHomeScreen() throws {
        // Login first (assuming test account)
        loginTestUser()
        
        // Verify home screen elements
        XCTAssertTrue(app.navigationBars["Home"].exists)
        XCTAssertTrue(app.searchFields.element.exists)
        XCTAssertTrue(app.buttons["Map View"].exists || app.buttons["List View"].exists)
        
        // Check categories exist
        XCTAssertTrue(app.scrollViews.firstMatch.exists)
        
        // Check quick action buttons
        XCTAssertTrue(app.buttons["Create Event"].exists)
        XCTAssertTrue(app.buttons["My Events"].exists)
        XCTAssertTrue(app.buttons["Tickets"].exists)
        XCTAssertTrue(app.buttons["Favorites"].exists)
    }
    
    func testProfileScreen() throws {
        // Login first
        loginTestUser()
        
        // Navigate to profile
        app.tabBars.buttons["Profile"].tap()
        
        // Verify profile elements
        XCTAssertTrue(app.navigationBars["Profile"].exists)
        XCTAssertTrue(app.images["ProfileImage"].exists)
        XCTAssertTrue(app.buttons["Edit Profile"].exists)
    }
    
    func testEventsScreen() throws {
        // Login first
        loginTestUser()
        
        // Navigate to events
        app.tabBars.buttons["Events"].tap()
        
        // Verify events screen elements
        XCTAssertTrue(app.navigationBars["Events"].exists)
        XCTAssertTrue(app.segmentedControls["EventsSegmentControl"].exists)
    }
    
    func testSettingsScreen() throws {
        // Login first
        loginTestUser()
        
        // Navigate to profile then settings
        app.tabBars.buttons["Profile"].tap()
        app.buttons["Settings"].tap()
        
        // Verify settings screen elements
        XCTAssertTrue(app.navigationBars["Settings"].exists)
        XCTAssertTrue(app.switches["NotificationsSwitch"].exists)
        XCTAssertTrue(app.buttons["Privacy Policy"].exists)
        XCTAssertTrue(app.buttons["Terms of Service"].exists)
        XCTAssertTrue(app.buttons["Logout"].exists)
    }
    
    // MARK: - Helper Methods
    
    private func loginTestUser() {
        // Enter test credentials and login
        let emailTextField = app.textFields["Email"]
        let passwordField = app.secureTextFields["Password"]
        let loginButton = app.buttons["Login"]
        
        emailTextField.tap()
        emailTextField.typeText("test@example.com")
        
        passwordField.tap()
        passwordField.typeText("password123")
        
        loginButton.tap()
        
        // Wait for home screen to appear
        let homeNavBar = app.navigationBars["Home"]
        XCTAssertTrue(homeNavBar.waitForExistence(timeout: 5))
    }

    func testLaunchPerformance() throws {
        if #available(macOS 10.15, iOS 13.0, tvOS 13.0, watchOS 7.0, *) {
            // This measures how long it takes to launch your application.
            measure(metrics: [XCTApplicationLaunchMetric()]) {
                XCUIApplication().launch()
            }
        }
    }
}
