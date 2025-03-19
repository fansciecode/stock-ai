package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.models.*
import com.example.ibcmserver_init.data.api.PaymentApi
import com.example.ibcmserver_init.data.local.PaymentDao
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepository @Inject constructor(
    private val paymentApi: PaymentApi,
    private val paymentDao: PaymentDao
) {
    suspend fun getEarningsSummary(): EarningsSummary {
        return try {
            paymentApi.getEarningsSummary()
        } catch (e: Exception) {
            paymentDao.getEarningsSummary()
        }
    }

    suspend fun getRecentTransactions(): List<Transaction> {
        return try {
            val transactions = paymentApi.getRecentTransactions()
            paymentDao.insertTransactions(transactions)
            transactions
        } catch (e: Exception) {
            paymentDao.getRecentTransactions()
        }
    }

    suspend fun getSettlements(): List<Settlement> {
        return try {
            val settlements = paymentApi.getSettlements()
            paymentDao.insertSettlements(settlements)
            settlements
        } catch (e: Exception) {
            paymentDao.getSettlements()
        }
    }

    suspend fun getDeductions(): List<Deduction> {
        return try {
            val deductions = paymentApi.getDeductions()
            paymentDao.insertDeductions(deductions)
            deductions
        } catch (e: Exception) {
            paymentDao.getDeductions()
        }
    }

    suspend fun getTransactionDetails(transactionId: String): Transaction {
        return try {
            val transaction = paymentApi.getTransactionDetails(transactionId)
            paymentDao.insertTransaction(transaction)
            transaction
        } catch (e: Exception) {
            paymentDao.getTransactionById(transactionId)
        }
    }

    suspend fun getSettlementDetails(settlementId: String): Settlement {
        return try {
            val settlement = paymentApi.getSettlementDetails(settlementId)
            paymentDao.insertSettlement(settlement)
            settlement
        } catch (e: Exception) {
            paymentDao.getSettlementById(settlementId)
        }
    }

    suspend fun getDeductionDetails(deductionId: String): Deduction {
        return try {
            val deduction = paymentApi.getDeductionDetails(deductionId)
            paymentDao.insertDeduction(deduction)
            deduction
        } catch (e: Exception) {
            paymentDao.getDeductionById(deductionId)
        }
    }

    suspend fun getTransactionsByDateRange(
        startDate: String,
        endDate: String
    ): List<Transaction> {
        return try {
            val transactions = paymentApi.getTransactionsByDateRange(startDate, endDate)
            paymentDao.insertTransactions(transactions)
            transactions
        } catch (e: Exception) {
            paymentDao.getTransactionsByDateRange(startDate, endDate)
        }
    }

    suspend fun getSettlementsByDateRange(
        startDate: String,
        endDate: String
    ): List<Settlement> {
        return try {
            val settlements = paymentApi.getSettlementsByDateRange(startDate, endDate)
            paymentDao.insertSettlements(settlements)
            settlements
        } catch (e: Exception) {
            paymentDao.getSettlementsByDateRange(startDate, endDate)
        }
    }

    suspend fun getDeductionsByDateRange(
        startDate: String,
        endDate: String
    ): List<Deduction> {
        return try {
            val deductions = paymentApi.getDeductionsByDateRange(startDate, endDate)
            paymentDao.insertDeductions(deductions)
            deductions
        } catch (e: Exception) {
            paymentDao.getDeductionsByDateRange(startDate, endDate)
        }
    }

    suspend fun getTransactionsByType(type: TransactionType): List<Transaction> {
        return try {
            val transactions = paymentApi.getTransactionsByType(type)
            paymentDao.insertTransactions(transactions)
            transactions
        } catch (e: Exception) {
            paymentDao.getTransactionsByType(type)
        }
    }

    suspend fun getSettlementsByStatus(status: SettlementStatus): List<Settlement> {
        return try {
            val settlements = paymentApi.getSettlementsByStatus(status)
            paymentDao.insertSettlements(settlements)
            settlements
        } catch (e: Exception) {
            paymentDao.getSettlementsByStatus(status)
        }
    }

    suspend fun getDeductionsByType(type: DeductionType): List<Deduction> {
        return try {
            val deductions = paymentApi.getDeductionsByType(type)
            paymentDao.insertDeductions(deductions)
            deductions
        } catch (e: Exception) {
            paymentDao.getDeductionsByType(type)
        }
    }

    fun observeTransactionStatus(transactionId: String): Flow<TransactionStatus> {
        return paymentDao.observeTransactionStatus(transactionId)
    }

    fun observeSettlementStatus(settlementId: String): Flow<SettlementStatus> {
        return paymentDao.observeSettlementStatus(settlementId)
    }
} 