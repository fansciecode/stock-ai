package com.example.ibcmserver_init.ui.screens.report

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.chat.Report
import com.example.ibcmserver_init.data.model.chat.ReportReason
import com.example.ibcmserver_init.data.model.chat.ReportType
import com.example.ibcmserver_init.data.network.ReportService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReportViewModel @Inject constructor(
    private val reportService: ReportService
) {
    private val _uiState = MutableStateFlow<ReportUiState>(ReportUiState.Loading)
    val uiState: StateFlow<ReportUiState> = _uiState.asStateFlow()

    fun loadReportReasons(type: ReportType) {
        viewModelScope.launch {
            try {
                _uiState.value = ReportUiState.Loading
                val reasons = reportService.getReportReasons(type)
                _uiState.value = ReportUiState.ReasonsLoaded(reasons)
            } catch (e: Exception) {
                _uiState.value = ReportUiState.Error(e.message ?: "Failed to load report reasons")
            }
        }
    }

    fun submitReport(report: Report) {
        viewModelScope.launch {
            try {
                _uiState.value = ReportUiState.Loading
                val submittedReport = reportService.submitReport(report)
                _uiState.value = ReportUiState.ReportSubmitted(submittedReport)
            } catch (e: Exception) {
                _uiState.value = ReportUiState.Error(e.message ?: "Failed to submit report")
            }
        }
    }

    fun updateReportStatus(reportId: String, status: String) {
        viewModelScope.launch {
            try {
                _uiState.value = ReportUiState.Loading
                val updatedReport = reportService.updateReportStatus(reportId, status)
                _uiState.value = ReportUiState.ReportUpdated(updatedReport)
            } catch (e: Exception) {
                _uiState.value = ReportUiState.Error(e.message ?: "Failed to update report status")
            }
        }
    }

    fun deleteReport(reportId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = ReportUiState.Loading
                reportService.deleteReport(reportId)
                _uiState.value = ReportUiState.ReportDeleted(reportId)
            } catch (e: Exception) {
                _uiState.value = ReportUiState.Error(e.message ?: "Failed to delete report")
            }
        }
    }
}

sealed class ReportUiState {
    object Loading : ReportUiState()
    data class ReasonsLoaded(val reasons: List<ReportReason>) : ReportUiState()
    data class ReportSubmitted(val report: Report) : ReportUiState()
    data class ReportUpdated(val report: Report) : ReportUiState()
    data class ReportDeleted(val reportId: String) : ReportUiState()
    data class Error(val message: String) : ReportUiState()
} 