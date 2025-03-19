package com.example.ibcmserver_init.di

import com.example.ibcmserver_init.data.repository.AuthRepository
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.NotificationRepository
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.data.repository.impl.AuthRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.EventRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.NotificationRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.UserRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.ImageRepositoryImpl
import com.example.ibcmserver_init.data.repository.impl.ChatRepositoryImpl
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
    abstract fun bindUserRepository(impl: UserRepositoryImpl): UserRepository

    @Binds
    @Singleton
    abstract fun bindEventRepository(impl: EventRepositoryImpl): EventRepository

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

    @Binds
    @Singleton
    abstract fun bindImageRepository(
        imageRepositoryImpl: ImageRepositoryImpl
    ): ImageRepository

    @Binds
    @Singleton
    abstract fun bindChatRepository(
        chatRepositoryImpl: ChatRepositoryImpl
    ): ChatRepository
} 