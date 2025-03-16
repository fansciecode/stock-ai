package com.example.ibcmserver_init.di

import com.example.ibcmserver_init.data.repository.AuthRepository
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.NotificationRepository
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.data.repository.impl.AuthRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.EventRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.NotificationRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.MockEventRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.MockUserRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindUserRepository(impl: MockUserRepositoryImpl): UserRepository

    @Binds
    @Singleton
    abstract fun bindEventRepository(impl: MockEventRepositoryImpl): EventRepository

    @Binds
    @Singleton
    abstract fun bindNotificationRepository(
        notificationRepositoryImpl: NotificationRepositoryImpl
    ): NotificationRepository

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository
} 