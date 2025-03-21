package com.example.ibcmserver_init.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import com.example.ibcmserver_init.data.model.review.ReviewSettings
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "review_settings")

@Singleton
class ReviewSettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private object PreferencesKeys {
        val NOTIFY_NEW_REVIEWS = booleanPreferencesKey("notify_new_reviews")
        val NOTIFY_REVIEW_RESPONSES = booleanPreferencesKey("notify_review_responses")
        val NOTIFY_REVIEW_REPORTS = booleanPreferencesKey("notify_review_reports")
        val AUTO_APPROVE_REVIEWS = booleanPreferencesKey("auto_approve_reviews")
        val REQUIRE_PURCHASE = booleanPreferencesKey("require_purchase")
        val ENABLE_PROFANITY_FILTER = booleanPreferencesKey("enable_profanity_filter")
        val ENABLE_SPAM_DETECTION = booleanPreferencesKey("enable_spam_detection")
    }

    val settings: Flow<ReviewSettings> = context.dataStore.data.map { preferences ->
        ReviewSettings(
            notifyNewReviews = preferences[PreferencesKeys.NOTIFY_NEW_REVIEWS] ?: true,
            notifyReviewResponses = preferences[PreferencesKeys.NOTIFY_REVIEW_RESPONSES] ?: true,
            notifyReviewReports = preferences[PreferencesKeys.NOTIFY_REVIEW_REPORTS] ?: true,
            autoApproveReviews = preferences[PreferencesKeys.AUTO_APPROVE_REVIEWS] ?: false,
            requirePurchase = preferences[PreferencesKeys.REQUIRE_PURCHASE] ?: true,
            enableProfanityFilter = preferences[PreferencesKeys.ENABLE_PROFANITY_FILTER] ?: true,
            enableSpamDetection = preferences[PreferencesKeys.ENABLE_SPAM_DETECTION] ?: true
        )
    }

    suspend fun getSettings(): ReviewSettings {
        return settings.map { it }.value ?: ReviewSettings()
    }

    suspend fun saveSettings(settings: ReviewSettings) {
        context.dataStore.edit { preferences ->
            preferences[PreferencesKeys.NOTIFY_NEW_REVIEWS] = settings.notifyNewReviews
            preferences[PreferencesKeys.NOTIFY_REVIEW_RESPONSES] = settings.notifyReviewResponses
            preferences[PreferencesKeys.NOTIFY_REVIEW_REPORTS] = settings.notifyReviewReports
            preferences[PreferencesKeys.AUTO_APPROVE_REVIEWS] = settings.autoApproveReviews
            preferences[PreferencesKeys.REQUIRE_PURCHASE] = settings.requirePurchase
            preferences[PreferencesKeys.ENABLE_PROFANITY_FILTER] = settings.enableProfanityFilter
            preferences[PreferencesKeys.ENABLE_SPAM_DETECTION] = settings.enableSpamDetection
        }
    }
} 