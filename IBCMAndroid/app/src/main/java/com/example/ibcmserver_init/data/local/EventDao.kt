package com.example.ibcmserver_init.data.local

import androidx.room.*
import com.example.ibcmserver_init.data.model.Event
import kotlinx.coroutines.flow.Flow

@Dao
interface EventDao {
    @Query("SELECT * FROM events WHERE " +
           "(:category IS NULL OR category = :category) AND " +
           "((:lat IS NULL AND :lon IS NULL) OR " +
           "(ABS(latitude - :lat) <= :radius AND ABS(longitude - :lon) <= :radius))")
    fun getNearbyEvents(
        lat: Double?,
        lon: Double?,
        radius: Double,
        category: String?
    ): Flow<List<Event>>

    @Query("SELECT * FROM events WHERE " +
           "(:category IS NULL OR category = :category) AND " +
           "((:lat IS NULL AND :lon IS NULL) OR " +
           "(ABS(latitude - :lat) <= :radius AND ABS(longitude - :lon) <= :radius))")
    suspend fun getNearbyEventsSync(
        lat: Double?,
        lon: Double?,
        radius: Double,
        category: String?
    ): List<Event>

    @Query("SELECT * FROM events WHERE (:category IS NULL OR category = :category) ORDER BY rating DESC")
    fun getTrendingEvents(category: String?): Flow<List<Event>>

    @Query("SELECT * FROM events WHERE (:category IS NULL OR category = :category) ORDER BY rating DESC")
    suspend fun getTrendingEventsSync(category: String?): List<Event>

    @Query("SELECT * FROM events WHERE " +
           "(:query IS NULL OR title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%')")
    suspend fun searchEvents(query: String?, filters: Map<String, String>): List<Event>

    @Query("SELECT * FROM events WHERE id = :eventId")
    suspend fun getEventById(eventId: String): Event?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: Event)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvents(events: List<Event>)

    @Query("DELETE FROM events WHERE id = :eventId")
    suspend fun deleteEvent(eventId: String)

    @Query("DELETE FROM events")
    suspend fun clearAllEvents()

    @Transaction
    suspend fun refreshEvents(events: List<Event>) {
        clearAllEvents()
        insertEvents(events)
    }
} 