package com.example.ibcmserver_init.utils

import kotlinx.coroutines.flow.*
import java.io.IOException

sealed class Resource<T> {
    data class Success<T>(val data: T) : Resource<T>()
    data class Loading<T>(val data: T? = null) : Resource<T>()
    data class Error<T>(val error: Throwable, val data: T? = null) : Resource<T>()
}

inline fun <ResultType, RequestType> networkBoundResource(
    crossinline query: () -> Flow<ResultType>,
    crossinline fetch: suspend () -> RequestType,
    crossinline saveFetchResult: suspend (RequestType) -> Unit,
    crossinline shouldFetch: (ResultType) -> Boolean = { true },
    crossinline onFetchError: (Throwable) -> Unit = { },
    crossinline onFetchSuccess: () -> Unit = { }
) = flow {
    emit(Resource.Loading())

    val data = query().first()

    val flow = if (shouldFetch(data)) {
        emit(Resource.Loading(data))

        try {
            saveFetchResult(fetch())
            onFetchSuccess()
            query().map { Resource.Success(it) }
        } catch (throwable: Throwable) {
            onFetchError(throwable)
            query().map {
                when (throwable) {
                    is IOException -> Resource.Error(NetworkError(), it)
                    else -> Resource.Error(throwable, it)
                }
            }
        }
    } else {
        query().map { Resource.Success(it) }
    }

    emitAll(flow)
}

class NetworkError : IOException("No network connection available")
class ServerError(message: String) : Exception(message)
class CacheError : Exception("Cache is empty or invalid") 