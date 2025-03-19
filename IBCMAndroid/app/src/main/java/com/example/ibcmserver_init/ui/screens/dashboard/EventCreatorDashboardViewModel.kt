package com.example.ibcmserver_init.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.event.EventAnalytics
import com.example.ibcmserver_init.data.repository.EventRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EventCreatorDashboardViewModel @Inject constructor(
    private val eventRepository: EventRepository
) : ViewModel() {

    private val _events = MutableStateFlow<List<Event>>(emptyList())
    val events: StateFlow<List<Event>> = _events.asStateFlow()

    private val _analytics = MutableStateFlow<EventAnalytics?>(null)
    val analytics: StateFlow<EventAnalytics?> = _analytics.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        loadEvents()
        loadAnalytics()
    }

    private fun loadEvents() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                eventRepository.getEventsByUser(userId = "current_user_id") // TODO: Get actual user ID
                    .collect { events ->
                        _events.value = events
                    }
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun loadAnalytics() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // TODO: Implement analytics loading from repository
                // For now, using dummy data
                _analytics.value = EventAnalytics(
                    attendance = AttendanceMetrics(
                        expectedAttendance = 100,
                        registeredAttendance = 75,
                        attendanceRate = 75.0,
                        demographicBreakdown = mapOf(
                            "18-24" to 0.4,
                            "25-34" to 0.4,
                            "35-44" to 0.2
                        )
                    ),
                    engagement = EngagementMetrics(
                        socialMediaMentions = 150,
                        websiteVisits = 1000,
                        ticketPageViews = 500,
                        registrationConversionRate = 15.0
                    ),
                    revenue = RevenueMetrics(
                        projectedRevenue = 10000.0,
                        currentRevenue = 7500.0,
                        ticketsSold = mapOf(
                            "VIP" to 20,
                            "Regular" to 55
                        ),
                        averageTicketPrice = 100.0
                    ),
                    trends = listOf(
                        TrendData(
                            metric = "Ticket Sales",
                            values = listOf(10.0, 15.0, 20.0, 25.0, 30.0),
                            timestamps = listOf("Day 1", "Day 2", "Day 3", "Day 4", "Day 5")
                        )
                    ),
                    insights = listOf(
                        EventInsight(
                            type = InsightType.PERFORMANCE,
                            description = "Ticket sales are 25% above projections",
                            actionItems = listOf(
                                "Consider increasing capacity",
                                "Promote VIP tickets more aggressively"
                            )
                        ),
                        EventInsight(
                            type = InsightType.OPPORTUNITY,
                            description = "High engagement on social media",
                            actionItems = listOf(
                                "Increase social media advertising budget",
                                "Create more shareable content"
                            )
                        )
                    )
                )
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun refreshData() {
        loadEvents()
        loadAnalytics()
    }

    fun getEventAnalytics(eventId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // TODO: Implement event-specific analytics loading
                // For now, using the same analytics data
                loadAnalytics()
            } catch (e: Exception) {
                // Handle error
            } finally {
                _isLoading.value = false
            }
        }
    }
} 