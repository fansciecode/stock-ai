package com.example.ibcmserver_init.data.local

import androidx.room.TypeConverter
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class Converters {
    private val gson = Gson()

    // TransactionType
    @TypeConverter
    fun fromTransactionType(value: TransactionType): String {
        return value.name
    }

    @TypeConverter
    fun toTransactionType(value: String): TransactionType {
        return TransactionType.valueOf(value)
    }

    // TransactionStatus
    @TypeConverter
    fun fromTransactionStatus(value: TransactionStatus): String {
        return value.name
    }

    @TypeConverter
    fun toTransactionStatus(value: String): TransactionStatus {
        return TransactionStatus.valueOf(value)
    }

    // SettlementStatus
    @TypeConverter
    fun fromSettlementStatus(value: SettlementStatus): String {
        return value.name
    }

    @TypeConverter
    fun toSettlementStatus(value: String): SettlementStatus {
        return SettlementStatus.valueOf(value)
    }

    // DeductionType
    @TypeConverter
    fun fromDeductionType(value: DeductionType): String {
        return value.name
    }

    @TypeConverter
    fun toDeductionType(value: String): DeductionType {
        return DeductionType.valueOf(value)
    }

    // List<String>
    @TypeConverter
    fun fromStringList(value: List<String>): String {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toStringList(value: String): List<String> {
        val listType = object : TypeToken<List<String>>() {}.type
        return gson.fromJson(value, listType)
    }

    // Map<String, String>
    @TypeConverter
    fun fromStringMap(value: Map<String, String>?): String? {
        return value?.let { gson.toJson(it) }
    }

    @TypeConverter
    fun toStringMap(value: String?): Map<String, String>? {
        if (value == null) return null
        val mapType = object : TypeToken<Map<String, String>>() {}.type
        return gson.fromJson(value, mapType)
    }

    // List<PaymentMethod>
    @TypeConverter
    fun fromPaymentMethodList(value: List<PaymentMethod>): String {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toPaymentMethodList(value: String): List<PaymentMethod> {
        val listType = object : TypeToken<List<PaymentMethod>>() {}.type
        return gson.fromJson(value, listType)
    }

    // PaymentNotifications
    @TypeConverter
    fun fromPaymentNotifications(value: PaymentNotifications): String {
        return gson.toJson(value)
    }

    @TypeConverter
    fun toPaymentNotifications(value: String): PaymentNotifications {
        return gson.fromJson(value, PaymentNotifications::class.java)
    }
} 