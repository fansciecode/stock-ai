package com.example.ibcmserver_init.data.repository.impl

import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.Review
import com.example.ibcmserver_init.data.repository.EventRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.time.LocalDate
import java.time.LocalTime
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockEventRepositoryImpl @Inject constructor() : EventRepository {

    private val events = mutableListOf<Event>()

    init {
        // Add some mock events
        events.add(
            Event(
                id = "1",
                title = "Tech Conference",
                description = "Annual tech conference",
                category = "Technology",
                date = LocalDate.now().plusDays(7),
                time = LocalTime.of(9, 0),
                location = "Convention Center",
                latitude = 37.7749,
                longitude = -122.4194,
                creatorId = "user1",
                creatorName = "John Doe",
                visibility = "public",
                maxAttendees = 100,
                attendees = listOf("user1", "user2"),
                interestedUsers = listOf("user3"),
                reviews = listOf(
                    Review(
                        id = "review1",
                        userId = "user2",
                        userName = "Jane Smith",
                        rating = 5,
                        comment = "Great event!",
                        createdAt = System.currentTimeMillis()
                    )
                ),
                comments = listOf(
                    Event.Comment(
                        id = "comment1",
                        userId = "user2",
                        userName = "Jane Smith",
                        text = "Looking forward to it!",
                        createdAt = System.currentTimeMillis()
                    )
                ),
                hasReminder = false,
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
        )
    }

    override suspend fun searchEvents(query: String): List<Event> {
        return events.filter { 
            it.title.contains(query, ignoreCase = true) || 
            it.description.contains(query, ignoreCase = true)
        }
    }

    override suspend fun createEvent(event: Event): Event {
        val newEvent = event.copy(id = System.currentTimeMillis().toString())
        events.add(newEvent)
        return newEvent
    }

    override suspend fun updateEvent(event: Event): Event {
        val index = events.indexOfFirst { it.id == event.id }
        if (index != -1) {
            events[index] = event
            return event
        }
        throw Exception("Event not found")
    }

    override suspend fun deleteEvent(eventId: String): Result<Unit> {
        return try {
            val removed = events.removeIf { it.id == eventId }
            if (removed) Result.success(Unit)
            else Result.failure(Exception("Event not found"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getEventById(eventId: String): Event? {
        return events.find { it.id == eventId }
    }

    override suspend fun getEventsByCategory(category: String): List<Event> {
        return events.filter { it.category == category }
    }

    override suspend fun getEventsByUser(userId: String): List<Event> {
        return events.filter { it.creatorId == userId }
    }

    override suspend fun joinEvent(eventId: String): Result<Event> {
        return try {
            val event = events.find { it.id == eventId }
                ?: return Result.failure(Exception("Event not found"))
            
            val updatedEvent = event.copy(
                attendees = event.attendees + event.creatorId
            )
            val index = events.indexOfFirst { it.id == eventId }
            events[index] = updatedEvent
            Result.success(updatedEvent)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun leaveEvent(eventId: String): Result<Event> {
        return try {
            val event = events.find { it.id == eventId }
                ?: return Result.failure(Exception("Event not found"))
            
            val updatedEvent = event.copy(
                attendees = event.attendees - event.creatorId
            )
            val index = events.indexOfFirst { it.id == eventId }
            events[index] = updatedEvent
            Result.success(updatedEvent)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun addEventReview(eventId: String, review: Review): Event {
        val event = events.find { it.id == eventId }
            ?: throw Exception("Event not found")
        
        val updatedEvent = event.copy(
            reviews = event.reviews + review
        )
        val index = events.indexOfFirst { it.id == eventId }
        events[index] = updatedEvent
        return updatedEvent
    }

    override suspend fun addComment(eventId: String, text: String): Event {
        val event = events.find { it.id == eventId }
            ?: throw Exception("Event not found")
        
        val comment = Event.Comment(
            id = System.currentTimeMillis().toString(),
            userId = event.creatorId,
            text = text,
            timestamp = System.currentTimeMillis()
        )
        
        val updatedEvent = event.copy(
            comments = event.comments + comment
        )
        val index = events.indexOfFirst { it.id == eventId }
        events[index] = updatedEvent
        return updatedEvent
    }

    override suspend fun deleteComment(eventId: String, commentId: String): Event {
        val event = events.find { it.id == eventId }
            ?: throw Exception("Event not found")
        
        val updatedEvent = event.copy(
            comments = event.comments.filter { it.id != commentId }
        )
        val index = events.indexOfFirst { it.id == eventId }
        events[index] = updatedEvent
        return updatedEvent
    }

    override suspend fun getNearbyEvents(latitude: Double, longitude: Double, radius: Double): List<Event> {
        // In mock implementation, just return all events
        return events
    }

    override suspend fun getPopularEvents(): List<Event> {
        return events.sortedByDescending { it.attendees.size }.take(10)
    }

    override fun observeEventsByCategory(category: String): Flow<List<Event>> = flow {
        emit(events.filter { it.category == category })
    }

    override fun observeEventsByUser(userId: String): Flow<List<Event>> = flow {
        emit(events.filter { it.creatorId == userId })
    }
}