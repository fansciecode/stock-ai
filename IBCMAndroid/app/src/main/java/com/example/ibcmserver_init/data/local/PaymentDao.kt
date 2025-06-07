package com.example.ibcmserver_init.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface PaymentDao {
    // Earnings Summary
    @Query("SELECT * FROM earnings_summary WHERE id = 1")
    suspend fun getEarningsSummary(): EarningsSummary

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEarningsSummary(summary: EarningsSummary)

    // Transactions
    @Query("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 50")
    suspend fun getRecentTransactions(): List<Transaction>

    @Query("SELECT * FROM transactions WHERE id = :transactionId")
    suspend fun getTransactionById(transactionId: String): Transaction

    @Query("SELECT * FROM transactions WHERE timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp DESC")
    suspend fun getTransactionsByDateRange(startDate: String, endDate: String): List<Transaction>

    @Query("SELECT * FROM transactions WHERE type = :type ORDER BY timestamp DESC")
    suspend fun getTransactionsByType(type: TransactionType): List<Transaction>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: Transaction)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransactions(transactions: List<Transaction>)

    @Query("SELECT status FROM transactions WHERE id = :transactionId")
    fun observeTransactionStatus(transactionId: String): Flow<TransactionStatus>

    // Settlements
    @Query("SELECT * FROM settlements ORDER BY timestamp DESC")
    suspend fun getSettlements(): List<Settlement>

    @Query("SELECT * FROM settlements WHERE id = :settlementId")
    suspend fun getSettlementById(settlementId: String): Settlement

    @Query("SELECT * FROM settlements WHERE timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp DESC")
    suspend fun getSettlementsByDateRange(startDate: String, endDate: String): List<Settlement>

    @Query("SELECT * FROM settlements WHERE status = :status ORDER BY timestamp DESC")
    suspend fun getSettlementsByStatus(status: SettlementStatus): List<Settlement>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSettlement(settlement: Settlement)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSettlements(settlements: List<Settlement>)

    @Query("SELECT status FROM settlements WHERE id = :settlementId")
    fun observeSettlementStatus(settlementId: String): Flow<SettlementStatus>

    // Deductions
    @Query("SELECT * FROM deductions ORDER BY timestamp DESC")
    suspend fun getDeductions(): List<Deduction>

    @Query("SELECT * FROM deductions WHERE id = :deductionId")
    suspend fun getDeductionById(deductionId: String): Deduction

    @Query("SELECT * FROM deductions WHERE timestamp BETWEEN :startDate AND :endDate ORDER BY timestamp DESC")
    suspend fun getDeductionsByDateRange(startDate: String, endDate: String): List<Deduction>

    @Query("SELECT * FROM deductions WHERE type = :type ORDER BY timestamp DESC")
    suspend fun getDeductionsByType(type: DeductionType): List<Deduction>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeduction(deduction: Deduction)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeductions(deductions: List<Deduction>)

    // Clear all data
    @Query("DELETE FROM earnings_summary")
    suspend fun clearEarningsSummary()

    @Query("DELETE FROM transactions")
    suspend fun clearTransactions()

    @Query("DELETE FROM settlements")
    suspend fun clearSettlements()

    @Query("DELETE FROM deductions")
    suspend fun clearDeductions()

    @Transaction
    suspend fun clearAll() {
        clearEarningsSummary()
        clearTransactions()
        clearSettlements()
        clearDeductions()
    }
} 