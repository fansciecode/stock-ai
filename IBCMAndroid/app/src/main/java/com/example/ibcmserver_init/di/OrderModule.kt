package com.example.ibcmserver_init.di

import com.example.ibcmserver_init.data.api.OrderApiService
import com.example.ibcmserver_init.data.repository.OrderRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object OrderModule {
    
    @Provides
    @Singleton
    fun provideOrderApiService(retrofit: Retrofit): OrderApiService {
        return retrofit.create(OrderApiService::class.java)
    }

    @Provides
    @Singleton
    fun provideOrderRepository(orderApiService: OrderApiService): OrderRepository {
        return OrderRepository(orderApiService)
    }
} 