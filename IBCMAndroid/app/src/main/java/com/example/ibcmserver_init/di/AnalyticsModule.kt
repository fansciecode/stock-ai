package com.example.ibcmserver_init.di

import com.example.ibcmserver_init.data.api.AnalyticsApi
import com.example.ibcmserver_init.data.api.ContentAnalyticsApi
import com.example.ibcmserver_init.data.api.UserActivityApi
import com.example.ibcmserver_init.data.repository.AnalyticsRepository
import com.example.ibcmserver_init.data.service.DeviceInfoService
import com.example.ibcmserver_init.data.service.LocationService
import com.example.ibcmserver_init.data.service.UserService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AnalyticsModule {

    @Provides
    @Singleton
    fun provideUserActivityApi(retrofit: Retrofit): UserActivityApi {
        return retrofit.create(UserActivityApi::class.java)
    }

    @Provides
    @Singleton
    fun provideAnalyticsApi(retrofit: Retrofit): AnalyticsApi {
        return retrofit.create(AnalyticsApi::class.java)
    }

    @Provides
    @Singleton
    fun provideContentAnalyticsApi(retrofit: Retrofit): ContentAnalyticsApi {
        return retrofit.create(ContentAnalyticsApi::class.java)
    }

    @Provides
    @Singleton
    fun provideAnalyticsRepository(
        userActivityApi: UserActivityApi,
        analyticsApi: AnalyticsApi,
        contentAnalyticsApi: ContentAnalyticsApi,
        userService: UserService,
        locationService: LocationService,
        deviceInfoService: DeviceInfoService
    ): AnalyticsRepository {
        return AnalyticsRepository(
            userActivityApi = userActivityApi,
            analyticsApi = analyticsApi,
            contentAnalyticsApi = contentAnalyticsApi,
            userService = userService,
            locationService = locationService,
            deviceInfoService = deviceInfoService
        )
    }
} 