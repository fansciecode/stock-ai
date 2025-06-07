package com.example.ibcmserver_init.ui.screens.business

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PaymentManagementViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PaymentManagementUiState())
    val uiState: StateFlow<PaymentManagementUiState> = _uiState.asStateFlow()

    init {
        loadPayments()
    }

    fun loadPayments() {
        viewModelScope.launch {
            try {
                _uiState.update { it.copy(isLoading = true) }
                
                val earningsSummary = paymentRepository.getEarningsSummary()
                val recentTransactions = paymentRepository.getRecentTransactions()
                val settlements = paymentRepository.getSettlements()
                val deductions = paymentRepository.getDeductions()

                _uiState.update { currentState ->
                    currentState.copy(
                        earningsSummary = earningsSummary,
                        recentTransactions = recentTransactions,
                        settlements = settlements,
                        deductions = deductions,
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update { currentState ->
                    currentState.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load payment data"
                    )
                }
            }
        }
    }

    fun refreshPayments() {
        loadPayments()
    }

    fun navigateToTransaction(transactionId: String) {
        _uiState.update { it.copy(selectedTransactionId = transactionId) }
    }

    fun navigateToSettlement(settlementId: String) {
        _uiState.update { it.copy(selectedSettlementId = settlementId) }
    }

    fun clearSelection() {
        _uiState.update { currentState ->
            currentState.copy(
                selectedTransactionId = null,
                selectedSettlementId = null
            )
        }
    }
}

data class PaymentManagementUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val earningsSummary: EarningsSummary? = null,
    val recentTransactions: List<Transaction> = emptyList(),
    val settlements: List<Settlement> = emptyList(),
    val deductions: List<Deduction> = emptyList(),
    val selectedTransactionId: String? = null,
    val selectedSettlementId: String? = null
)

data class EarningsSummary(
    val totalEarnings: Double = 0.0,
    val pendingAmount: Double = 0.0,
    val availableAmount: Double = 0.0,
    val platformFee: Double = 0.0,
    val taxAmount: Double = 0.0,
    val otherCharges: Double = 0.0
)

data class Transaction(
    val id: String,
    val amount: Double,
    val date: String,
    val type: TransactionType,
    val status: TransactionStatus,
    val description: String? = null,
    val orderId: String? = null
)

data class Settlement(
    val id: String,
    val amount: Double,
    val date: String,
    val status: SettlementStatus,
    val paymentMethod: String,
    val transactionIds: List<String>
)

data class Deduction(
    val id: String,
    val name: String,
    val amount: Double,
    val type: DeductionType,
    val description: String? = null
)

enum class TransactionType {
    ORDER_PAYMENT,
    REFUND,
    SETTLEMENT,
    ADJUSTMENT
}

enum class TransactionStatus {
    SUCCESS,
    PENDING,
    FAILED,
    REFUNDED
}

enum class SettlementStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
}

enum class DeductionType {
    PLATFORM_FEE,
    TAX,
    SHIPPING,
    DISCOUNT,
    OTHER
} 