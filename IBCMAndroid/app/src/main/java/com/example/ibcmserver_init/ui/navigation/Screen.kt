package com.example.ibcmserver_init.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Signup : Screen("signup")
    object CategorySelection : Screen("category_selection")
    object Dashboard : Screen("dashboard")
    object EventCreation : Screen("event_creation")
    object EventSearch : Screen("event_search")
    object EventDetails : Screen("event_details")
    object UserProfile : Screen("user_profile")
    object Settings : Screen("settings")

    companion object {
        fun appendParams(baseRoute: String, params: Map<String, String>): String {
            if (params.isEmpty()) return baseRoute
            val queryParams = params.entries.joinToString("&") { "${it.key}=${it.value}" }
            return "$baseRoute?$queryParams"
        }
    }
} 