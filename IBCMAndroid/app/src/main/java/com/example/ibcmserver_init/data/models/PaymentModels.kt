package com.example.ibcmserver_init.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.example.ibcmserver_init.data.local.Converters

@Entity(tableName = "earnings_summary")
data class EarningsSummary(
    @PrimaryKey
    val id: Int = 1,
    val totalEarnings: Double,
    val pendingEarnings: Double,
    val availableEarnings: Double,
    val totalDeductions: Double,
    val lastSettlementAmount: Double,
    val lastSettlementDate: String
)

@Entity(tableName = "transactions")
@TypeConverters(Converters::class)
data class Transaction(
    @PrimaryKey
    val id: String,
    val amount: Double,
    val type: TransactionType,
    val status: TransactionStatus,
    val description: String,
    val timestamp: String,
    val orderId: String?,
    val customerId: String?,
    val metadata: Map<String, String>?
)

@Entity(tableName = "settlements")
@TypeConverters(Converters::class)
data class Settlement(
    @PrimaryKey
    val id: String,
    val amount: Double,
    val status: SettlementStatus,
    val timestamp: String,
    val bankAccountId: String,
    val transactions: List<String>,
    val metadata: Map<String, String>?
)

@Entity(tableName = "deductions")
@TypeConverters(Converters::class)
data class Deduction(
    @PrimaryKey
    val id: String,
    val amount: Double,
    val type: DeductionType,
    val description: String,
    val timestamp: String,
    val transactionId: String?,
    val metadata: Map<String, String>?
)

data class PaymentRequest(
    val amount: Double,
    val currency: String,
    val paymentMethod: PaymentMethod,
    val orderId: String?,
    val customerId: String?,
    val metadata: Map<String, String>?
)

data class PaymentResponse(
    val transactionId: String,
    val status: TransactionStatus,
    val amount: Double,
    val timestamp: String
)

data class RefundRequest(
    val transactionId: String,
    val amount: Double,
    val reason: String
)

data class RefundResponse(
    val refundId: String,
    val status: TransactionStatus,
    val amount: Double,
    val timestamp: String
)

data class SettlementRequest(
    val amount: Double,
    val bankAccountId: String,
    val transactions: List<String>
)

data class SettlementResponse(
    val settlementId: String,
    val status: SettlementStatus,
    val amount: Double,
    val timestamp: String
)

data class PaymentSettings(
    val defaultCurrency: String,
    val supportedPaymentMethods: List<PaymentMethod>,
    val minimumSettlementAmount: Double,
    val settlementSchedule: SettlementSchedule,
    val notifications: PaymentNotifications
)

data class BankAccount(
    val id: String,
    val accountHolderName: String,
    val accountNumber: String,
    val bankName: String,
    val routingNumber: String,
    val isDefault: Boolean
)

enum class TransactionType {
    PAYMENT,
    REFUND,
    SETTLEMENT,
    ADJUSTMENT,
    FEE
}

enum class TransactionStatus {
    PENDING,
    COMPLETED,
    FAILED,
    REFUNDED,
    CANCELLED
}

enum class SettlementStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED
}

enum class DeductionType {
    FEE,
    TAX,
    REFUND,
    ADJUSTMENT
}

enum class PaymentMethod {
    CREDIT_CARD,
    DEBIT_CARD,
    BANK_TRANSFER,
    DIGITAL_WALLET,
    CRYPTO
}

enum class SettlementSchedule {
    DAILY,
    WEEKLY,
    MONTHLY,
    MANUAL
}

data class PaymentNotifications(
    val emailNotifications: Boolean,
    val pushNotifications: Boolean,
    val smsNotifications: Boolean
) 