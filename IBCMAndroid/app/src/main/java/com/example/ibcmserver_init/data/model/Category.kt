package com.example.ibcmserver_init.data.model

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

data class Category(
    val id: String,
    val name: String,
    val icon: ImageVector,
    val backgroundImage: String? = null,
    val subcategories: List<Subcategory> = emptyList()
)

data class Subcategory(
    val id: String,
    val name: String,
    val icon: ImageVector? = null
)

// Predefined categories based on backend API
object Categories {
    val all = listOf(
        Category(
            id = "sports",
            name = "Sports & Recreation",
            icon = Icons.Filled.SportsBasketball,
            backgroundImage = "sports_bg",
            subcategories = listOf(
                Subcategory(id = "racing", name = "Racing", icon = Icons.Filled.DirectionsRun),
                Subcategory(id = "badminton", name = "Badminton", icon = Icons.Filled.SportsTennis),
                Subcategory(id = "horse_riding", name = "Horse Riding"),
                Subcategory(id = "cycling", name = "Cycling", icon = Icons.Filled.DirectionsBike),
                Subcategory(id = "online_gaming", name = "Online Gaming", icon = Icons.Filled.Gamepad),
                Subcategory(id = "football", name = "Football", icon = Icons.Filled.SportsSoccer),
                Subcategory(id = "basketball", name = "Basketball", icon = Icons.Filled.SportsBasketball),
                Subcategory(id = "swimming", name = "Swimming", icon = Icons.Filled.Pool),
                Subcategory(id = "cricket", name = "Cricket"),
                Subcategory(id = "tennis", name = "Tennis", icon = Icons.Filled.SportsTennis),
                Subcategory(id = "adventure_sports", name = "Adventure Sports", icon = Icons.Filled.Terrain)
            )
        ),
        Category(
            id = "culture",
            name = "Cultural & Arts",
            icon = Icons.Filled.Palette,
            backgroundImage = "culture_bg",
            subcategories = listOf(
                Subcategory(id = "visual_arts", name = "Visual Arts", icon = Icons.Filled.Brush),
                Subcategory(id = "dance", name = "Dance Performances", icon = Icons.Filled.MusicNote),
                Subcategory(id = "music_concerts", name = "Music Concerts", icon = Icons.Filled.QueueMusic),
                Subcategory(id = "literature", name = "Literature & Poetry", icon = Icons.Filled.MenuBook),
                Subcategory(id = "traditional", name = "Traditional & Folk Events", icon = Icons.Filled.TheaterComedy)
            )
        ),
        Category(
            id = "entertainment",
            name = "Entertainment & Nightlife",
            icon = Icons.Filled.Nightlife,
            backgroundImage = "entertainment_bg",
            subcategories = listOf(
                Subcategory(id = "comedy", name = "Comedy Shows", icon = Icons.Filled.TheaterComedy),
                Subcategory(id = "movies", name = "Movie Screenings", icon = Icons.Filled.LocalMovies),
                Subcategory(id = "theatre", name = "Theatre & Drama", icon = Icons.Filled.TheaterComedy),
                Subcategory(id = "music_festivals", name = "Music Festivals", icon = Icons.Filled.Festival),
                Subcategory(id = "clubbing", name = "Clubbing & Nightlife", icon = Icons.Filled.Nightlife),
                Subcategory(id = "dj", name = "DJ Nights", icon = Icons.Filled.MusicNote)
            )
        ),
        Category(
            id = "food",
            name = "Food & Beverages",
            icon = Icons.Filled.Restaurant,
            backgroundImage = "food_bg",
            subcategories = listOf(
                Subcategory(id = "restaurants", name = "Restaurants", icon = Icons.Filled.Restaurant),
                Subcategory(id = "food_festivals", name = "Food Festivals", icon = Icons.Filled.Festival),
                Subcategory(id = "cooking_classes", name = "Cooking Classes", icon = Icons.Filled.OutdoorGrill),
                Subcategory(id = "wine_tasting", name = "Wine & Beer Tasting", icon = Icons.Filled.LocalBar)
            )
        ),
        Category(
            id = "education",
            name = "Education & Learning",
            icon = Icons.Filled.School,
            backgroundImage = "education_bg",
            subcategories = listOf(
                Subcategory(id = "workshops", name = "Workshops", icon = Icons.Filled.Build),
                Subcategory(id = "seminars", name = "Seminars", icon = Icons.Filled.Group),
                Subcategory(id = "courses", name = "Courses", icon = Icons.Filled.Class),
                Subcategory(id = "tech_events", name = "Tech Events", icon = Icons.Filled.Computer)
            )
        )
    )
} 