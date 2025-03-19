package com.example.ibcmserver_init.data.repository.impl

import com.example.ibcmserver_init.data.api.EventApiService
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.EventRequest
import com.example.ibcmserver_init.data.model.Review
import com.example.ibcmserver_init.data.repository.EventRepository
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import dagger.hilt.android.scopes.ActivityScoped
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.tasks.await
import java.time.LocalDate
import java.time.LocalTime
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EventRepositoryImpl @Inject constructor(
    private val eventApiService: EventApiService,
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) : EventRepository {
    private val eventsCollection = firestore.collection("events")

    override suspend fun createEvent(event: Event): Result<Event> {
        return try {
            val eventMap = event.toMap()
            val docRef = firestore.collection("events").document()
            docRef.set(eventMap).await()
            Result.success(event.copy(id = docRef.id))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getEventById(eventId: String): Event? {
        return try {
            val doc = firestore.collection("events").document(eventId).get().await()
            doc.toObject(Event::class.java)?.copy(id = doc.id)
        } catch (e: Exception) {
            null
        }
    }

    override suspend fun updateEvent(event: Event): Result<Event> {
        return try {
            val eventMap = event.toMap()
            firestore.collection("events").document(event.id).set(eventMap).await()
            Result.success(event)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteEvent(eventId: String): Result<Unit> {
        return try {
            firestore.collection("events").document(eventId).delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun searchEvents(query: String): List<Event> {
        return try {
            val eventsRef = firestore.collection("events")
            val querySnapshot = eventsRef
                .orderBy("title")
                .whereGreaterThanOrEqualTo("title", query)
                .whereLessThanOrEqualTo("title", query + '\uf8ff')
                .get()
                .await()

            querySnapshot.documents.mapNotNull { doc ->
                doc.toObject(Event::class.java)?.copy(id = doc.id)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    override suspend fun getEventsByCategory(category: String): List<Event> {
        return try {
            val querySnapshot = firestore.collection("events")
                .whereEqualTo("category", category)
                .get()
                .await()

            querySnapshot.documents.mapNotNull { doc ->
                doc.toObject(Event::class.java)?.copy(id = doc.id)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    override suspend fun getEventsByUser(userId: String): List<Event> {
        return try {
            val querySnapshot = firestore.collection("events")
                .whereEqualTo("creatorId", userId)
                .get()
                .await()

            querySnapshot.documents.mapNotNull { doc ->
                doc.toObject(Event::class.java)?.copy(id = doc.id)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    override suspend fun joinEvent(eventId: String): Result<Event> {
        return try {
            val eventDoc = firestore.collection("events").document(eventId)
            val event = eventDoc.get().await().toObject(Event::class.java)
            
            if (event != null) {
                eventDoc.update("attendees", event.attendees + event.creatorId).await()
                Result.success(event.copy(attendees = event.attendees + event.creatorId))
            } else {
                Result.failure(Exception("Event not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun leaveEvent(eventId: String): Result<Event> {
        return try {
            val eventDoc = firestore.collection("events").document(eventId)
            val event = eventDoc.get().await().toObject(Event::class.java)
            
            if (event != null) {
                eventDoc.update("attendees", event.attendees - event.creatorId).await()
                Result.success(event.copy(attendees = event.attendees - event.creatorId))
            } else {
                Result.failure(Exception("Event not found"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun addEventReview(eventId: String, review: Review): Result<Review> {
        return try {
            val eventDoc = firestore.collection("events").document(eventId)
            val event = eventDoc.get().await().toObject(Event::class.java)
                ?: throw Exception("Event not found")

            val updatedReviews = event.reviews + review
            eventDoc.update("reviews", updatedReviews).await()
            Result.success(review)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun addComment(eventId: String, text: String): Event {
        return try {
            val eventDoc = firestore.collection("events").document(eventId)
            val event = eventDoc.get().await().toObject(Event::class.java)
                ?: throw Exception("Event not found")

            val comment = Event.Comment(
                id = System.currentTimeMillis().toString(),
                userId = event.creatorId,
                text = text,
                timestamp = System.currentTimeMillis()
            )

            val updatedComments = event.comments + comment
            eventDoc.update("comments", updatedComments).await()
            event.copy(comments = updatedComments)
        } catch (e: Exception) {
            throw e
        }
    }

    override suspend fun addCommentWithImage(eventId: String, text: String, imageUrl: String): Event {
        val event = getEventById(eventId)
        val comment = Event.Comment(
            text = text,
            userId = event?.creatorId ?: throw Exception("Event not found"),
            userName = event?.creatorName ?: throw Exception("Event not found"),
            imageUrl = imageUrl
        )
        val updatedEvent = event?.copy(
            comments = event.comments + comment
        ) ?: throw Exception("Event not found")
        eventsCollection.document(eventId).update(updatedEvent.toMap()).await()
        return updatedEvent
    }

    override suspend fun deleteComment(eventId: String, commentId: String): Event {
        return try {
            val eventDoc = firestore.collection("events").document(eventId)
            val event = eventDoc.get().await().toObject(Event::class.java)
                ?: throw Exception("Event not found")

            val updatedComments = event.comments.filter { it.id != commentId }
            eventDoc.update("comments", updatedComments).await()
            event.copy(comments = updatedComments)
        } catch (e: Exception) {
            throw e
        }
    }

    override suspend fun setReminder(eventId: String, enabled: Boolean): Event {
        val event = getEventById(eventId)
        val updatedEvent = event?.copy(
            hasReminder = enabled
        ) ?: throw Exception("Event not found")
        eventsCollection.document(eventId).update(updatedEvent.toMap()).await()
        return updatedEvent
    }

    override suspend fun upgradeEventVisibility(eventId: String): Result<Event> {
        return try {
            val event = getEventById(eventId)
            val updatedEvent = event?.copy(
                visibility = "public"
            ) ?: throw Exception("Event not found")
            eventsCollection.document(eventId).update(updatedEvent.toMap()).await()
            Result.success(updatedEvent)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun observeEvent(eventId: String): Flow<Event> = callbackFlow {
        val subscription = eventsCollection.document(eventId)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val event = snapshot?.toObject(Event::class.java)
                if (event != null) {
                    trySend(event)
                }
            }
        awaitClose { subscription.remove() }
    }

    override fun observeEventsByCategory(category: String): Flow<List<Event>> = flow {
        val snapshot = eventsCollection
            .whereEqualTo("category", category)
            .get()
            .await()
        val events = snapshot.documents.map { doc ->
            Event(
                id = doc.id,
                title = doc.getString("title") ?: "",
                description = doc.getString("description") ?: "",
                category = doc.getString("category") ?: "",
                date = doc.getTimestamp("date")?.toDate()?.toLocalDate() ?: LocalDate.now(),
                time = doc.getTimestamp("time")?.toDate()?.toLocalTime() ?: LocalTime.now(),
                location = doc.getString("location") ?: "",
                latitude = doc.getDouble("latitude") ?: 0.0,
                longitude = doc.getDouble("longitude") ?: 0.0,
                creatorId = doc.getString("creatorId") ?: "",
                creatorName = doc.getString("creatorName") ?: "",
                visibility = doc.getString("visibility") ?: "public",
                maxAttendees = doc.getLong("maxAttendees")?.toInt() ?: 0,
                attendees = (doc.get("attendees") as? List<String>) ?: emptyList(),
                interestedUsers = (doc.get("interestedUsers") as? List<String>) ?: emptyList(),
                reviews = (doc.get("reviews") as? List<Map<String, Any>>)?.map { Review.fromMap(it) } ?: emptyList(),
                comments = (doc.get("comments") as? List<Map<String, Any>>)?.map { Event.Comment.fromMap(it) } ?: emptyList(),
                hasReminder = doc.getBoolean("hasReminder") ?: false,
                createdAt = doc.getLong("createdAt") ?: System.currentTimeMillis(),
                updatedAt = doc.getLong("updatedAt") ?: System.currentTimeMillis()
            )
        }
        emit(events)
    }

    override fun observeEventsByUser(userId: String): Flow<List<Event>> = flow {
        val snapshot = eventsCollection
            .whereEqualTo("creatorId", userId)
            .get()
            .await()
        val events = snapshot.documents.map { doc ->
            Event(
                id = doc.id,
                title = doc.getString("title") ?: "",
                description = doc.getString("description") ?: "",
                category = doc.getString("category") ?: "",
                date = doc.getTimestamp("date")?.toDate()?.toLocalDate() ?: LocalDate.now(),
                time = doc.getTimestamp("time")?.toDate()?.toLocalTime() ?: LocalTime.now(),
                location = doc.getString("location") ?: "",
                latitude = doc.getDouble("latitude") ?: 0.0,
                longitude = doc.getDouble("longitude") ?: 0.0,
                creatorId = doc.getString("creatorId") ?: "",
                creatorName = doc.getString("creatorName") ?: "",
                visibility = doc.getString("visibility") ?: "public",
                maxAttendees = doc.getLong("maxAttendees")?.toInt() ?: 0,
                attendees = (doc.get("attendees") as? List<String>) ?: emptyList(),
                interestedUsers = (doc.get("interestedUsers") as? List<String>) ?: emptyList(),
                reviews = (doc.get("reviews") as? List<Map<String, Any>>)?.map { Review.fromMap(it) } ?: emptyList(),
                comments = (doc.get("comments") as? List<Map<String, Any>>)?.map { Event.Comment.fromMap(it) } ?: emptyList(),
                hasReminder = doc.getBoolean("hasReminder") ?: false,
                createdAt = doc.getLong("createdAt") ?: System.currentTimeMillis(),
                updatedAt = doc.getLong("updatedAt") ?: System.currentTimeMillis()
            )
        }
        emit(events)
    }

    override suspend fun getEventRequests(eventId: String): Flow<List<EventRequest>> = flow {
        val querySnapshot = firestore.collection("events")
            .document(eventId)
            .collection("requests")
            .get()
            .await()
            
        emit(querySnapshot.documents.mapNotNull { it.toObject(EventRequest::class.java) })
    }

    override suspend fun createEventRequest(request: EventRequest): Result<EventRequest> {
        return try {
            val userId = auth.currentUser?.uid ?: throw IllegalStateException("User not logged in")
            val requestWithUser = request.copy(userId = userId)
            
            firestore.collection("events")
                .document(request.eventId)
                .collection("requests")
                .document(requestWithUser.id)
                .set(requestWithUser.toMap())
                .await()
                
            Result.success(requestWithUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateEventRequest(request: EventRequest): Result<EventRequest> {
        return try {
            firestore.collection("events")
                .document(request.eventId)
                .collection("requests")
                .document(request.id)
                .set(request.toMap())
                .await()
                
            Result.success(request)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getEventReviews(eventId: String): Flow<List<Review>> = flow {
        val querySnapshot = firestore.collection("events")
            .document(eventId)
            .collection("reviews")
            .get()
            .await()
            
        emit(querySnapshot.documents.mapNotNull { it.toObject(Review::class.java) })
    }

    override suspend fun getNearbyEvents(
        latitude: Double,
        longitude: Double,
        radius: Double,
        category: String?
    ): List<Event> {
        return eventApiService.getNearbyEvents(latitude, longitude, radius, category)
    }

    override suspend fun getTrendingEvents(category: String?): List<Event> {
        return eventApiService.getTrendingEvents(category)
    }

    override suspend fun getUpcomingEvents(): List<Event> {
        val today = LocalDate.now()
        val querySnapshot = firestore.collection("events")
            .whereEqualTo("visibility", "public")
            .get()
            .await()
            
        return querySnapshot.documents
            .mapNotNull { it.toObject(Event::class.java) }
            .filter { it.date >= today }
    }

    override suspend fun getPopularEvents(): List<Event> {
        return try {
            val querySnapshot = firestore.collection("events")
                .orderBy("attendees", Query.Direction.DESCENDING)
                .limit(10)
                .get()
                .await()

            querySnapshot.documents.mapNotNull { doc ->
                doc.toObject(Event::class.java)?.copy(id = doc.id)
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val R = 6371.0 // Earth's radius in kilometers
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private fun Event.toMap(): Map<String, Any?> {
        return mapOf(
            "title" to title,
            "description" to description,
            "category" to category,
            "date" to date.toString(),
            "time" to time.toString(),
            "location" to location,
            "latitude" to latitude,
            "longitude" to longitude,
            "creatorId" to creatorId,
            "creatorName" to creatorName,
            "visibility" to visibility,
            "maxAttendees" to maxAttendees,
            "attendees" to attendees,
            "interestedUsers" to interestedUsers,
            "reviews" to reviews.map { it.toMap() },
            "comments" to comments.map { it.toMap() },
            "hasReminder" to hasReminder,
            "createdAt" to createdAt,
            "updatedAt" to updatedAt
        )
    }

    private fun Review.toMap(): Map<String, Any> {
        return mapOf(
            "userId" to userId,
            "rating" to rating,
            "comment" to comment,
            "timestamp" to timestamp
        )
    }

    private fun Event.Comment.toMap(): Map<String, Any> {
        return mapOf(
            "id" to id,
            "userId" to userId,
            "text" to text,
            "timestamp" to timestamp
        )
    }
} 