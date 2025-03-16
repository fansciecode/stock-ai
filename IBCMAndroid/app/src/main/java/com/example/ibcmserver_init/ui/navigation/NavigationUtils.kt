package com.example.ibcmserver_init.ui.navigation

fun createRoute(baseRoute: String, vararg params: String): String {
    return if (params.isEmpty()) {
        baseRoute
    } else {
        val paramString = params.joinToString("/")
        "$baseRoute/$paramString"
    }
} 