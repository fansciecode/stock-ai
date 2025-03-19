package com.example.ibcmserver_init.ui.viewmodel

import android.net.Uri
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.verification.DocumentFile
import com.example.ibcmserver_init.data.model.verification.DocumentMetadata
import com.example.ibcmserver_init.data.model.verification.DocumentType
import com.example.ibcmserver_init.data.model.verification.VerificationDetails
import com.example.ibcmserver_init.data.repository.VerificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

@HiltViewModel
class VerificationViewModel @Inject constructor(
    private val repository: VerificationRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow<VerificationUiState>(VerificationUiState.Initial)
    val uiState: StateFlow<VerificationUiState> = _uiState.asStateFlow()

    private val _selectedDocuments = MutableStateFlow<List<DocumentFile>>(emptyList())
    val selectedDocuments: StateFlow<List<DocumentFile>> = _selectedDocuments.asStateFlow()

    private var verificationId: String? = null

    fun addDocument(uri: Uri, type: DocumentType) {
        viewModelScope.launch {
            val metadata = getDocumentMetadata(uri)
            val document = DocumentFile(uri, type, metadata)
            _selectedDocuments.update { current -> current + document }
        }
    }

    fun removeDocument(document: DocumentFile) {
        _selectedDocuments.update { current -> current - document }
    }

    fun submitVerification() {
        viewModelScope.launch {
            _uiState.value = VerificationUiState.Loading
            
            val documents = selectedDocuments.value
            if (documents.isEmpty()) {
                _uiState.value = VerificationUiState.Error("No documents selected")
                return@launch
            }

            repository.submitVerification(documents)
                .onSuccess { details ->
                    verificationId = details.id
                    _uiState.value = VerificationUiState.Submitted(details)
                }
                .onFailure { error ->
                    _uiState.value = VerificationUiState.Error(error.message ?: "Unknown error")
                }
        }
    }

    fun checkStatus() {
        viewModelScope.launch {
            verificationId?.let { id ->
                _uiState.value = VerificationUiState.Loading
                repository.getVerificationStatus(id)
                    .onSuccess { details ->
                        _uiState.value = VerificationUiState.Status(details)
                    }
                    .onFailure { error ->
                        _uiState.value = VerificationUiState.Error(error.message ?: "Unknown error")
                    }
            }
        }
    }

    private suspend fun getDocumentMetadata(uri: Uri): DocumentMetadata =
        withContext(Dispatchers.IO) {
            // Implement metadata extraction
            DocumentMetadata(
                size = 0L,
                mimeType = "image/jpeg",
                dimensions = null
            )
        }
}

sealed class VerificationUiState {
    object Initial : VerificationUiState()
    object Loading : VerificationUiState()
    data class Submitted(val details: VerificationDetails) : VerificationUiState()
    data class Status(val details: VerificationDetails) : VerificationUiState()
    data class Error(val message: String) : VerificationUiState()
} 