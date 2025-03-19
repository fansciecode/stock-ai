sealed class ApiResponse<T> {
    data class Success<T>(val data: T) : ApiResponse<T>()
    data class Error<T>(val code: Int, val message: String) : ApiResponse<T>()
    data class NetworkError<T>(val throwable: Throwable) : ApiResponse<T>()
}

// Add extension function for Response handling
suspend fun <T> Response<T>.toApiResponse(): ApiResponse<T> {
    return try {
        if (isSuccessful) {
            val body = body()
            if (body != null) {
                ApiResponse.Success(body)
            } else {
                ApiResponse.Error(code(), "Response body is null")
            }
        } else {
            ApiResponse.Error(code(), errorBody()?.string() ?: "Unknown error")
        }
    } catch (e: Exception) {
        ApiResponse.NetworkError(e)
    }
} 