package com.example.ibcmserver_init.data.model.event

import kotlinx.serialization.Serializable

@Serializable
data class EventBasicInfo(
    val eventType: String,
    val title: String,
    val expectedAttendance: Int,
    val preferences: EventPreferences? = null
)

@Serializable
data class EventPreferences(
    val budget: Double? = null,
    val targetAudience: String? = null,
    val venuePreferences: List<String>? = null,
    val themePreferences: List<String>? = null
)

@Serializable
data class EventOptimization(
    val suggestedParameters: EventOptimizationParams,
    val recommendations: List<EventRecommendation>,
    val pricingStrategy: PricingStrategy,
    val marketingTips: List<String>
)

@Serializable
data class EventOptimizationParams(
    val suggestedCapacity: Int,
    val optimalTicketPrices: Map<String, Double>,
    val suggestedDateTime: String,
    val venueRecommendations: List<Venue>,
    val resourceRequirements: List<String>
)

@Serializable
data class EventRecommendation(
    val type: RecommendationType,
    val description: String,
    val impact: String,
    val priority: Int
)

@Serializable
enum class RecommendationType {
    PRICING,
    TIMING,
    VENUE,
    MARKETING,
    RESOURCES,
    ENGAGEMENT
}

@Serializable
data class PricingStrategy(
    val basePrice: Double,
    val tierPricing: Map<String, Double>,
    val discountRecommendations: List<DiscountStrategy>,
    val dynamicPricingRules: List<PricingRule>
)

@Serializable
data class DiscountStrategy(
    val type: String,
    val amount: Double,
    val conditions: String,
    val targetAudience: String
)

@Serializable
data class PricingRule(
    val condition: String,
    val adjustment: Double,
    val trigger: String
)

@Serializable
data class EventAnalytics(
    val attendance: AttendanceMetrics,
    val engagement: EngagementMetrics,
    val revenue: RevenueMetrics,
    val trends: List<TrendData>,
    val insights: List<EventInsight>
)

@Serializable
data class AttendanceMetrics(
    val expectedAttendance: Int,
    val registeredAttendance: Int,
    val attendanceRate: Double,
    val demographicBreakdown: Map<String, Double>
)

@Serializable
data class EngagementMetrics(
    val socialMediaMentions: Int,
    val websiteVisits: Int,
    val ticketPageViews: Int,
    val registrationConversionRate: Double
)

@Serializable
data class RevenueMetrics(
    val projectedRevenue: Double,
    val currentRevenue: Double,
    val ticketsSold: Map<String, Int>,
    val averageTicketPrice: Double
)

@Serializable
data class TrendData(
    val metric: String,
    val values: List<Double>,
    val timestamps: List<String>
)

@Serializable
data class EventInsight(
    val type: InsightType,
    val description: String,
    val actionItems: List<String>
)

@Serializable
enum class InsightType {
    PERFORMANCE,
    OPPORTUNITY,
    RISK,
    TREND
}

@Serializable
data class MarketingMaterials(
    val socialMedia: SocialMediaContent,
    val emailCampaign: EmailCampaign,
    val promotionalOffers: List<PromotionalOffer>,
    val marketingAssets: List<MarketingAsset>
)

@Serializable
data class SocialMediaContent(
    val posts: List<SocialPost>,
    val hashtags: List<String>,
    val schedulingRecommendations: List<PostSchedule>
)

@Serializable
data class SocialPost(
    val platform: String,
    val content: String,
    val imagePrompt: String? = null,
    val targetAudience: String,
    val suggestedTiming: String
)

@Serializable
data class EmailCampaign(
    val templates: List<EmailTemplate>,
    val segmentation: List<AudienceSegment>,
    val automationFlow: List<EmailAutomation>
)

@Serializable
data class EmailTemplate(
    val type: String,
    val subject: String,
    val content: String,
    val timing: String
)

@Serializable
data class AudienceSegment(
    val name: String,
    val criteria: Map<String, String>,
    val estimatedSize: Int
)

@Serializable
data class EmailAutomation(
    val trigger: String,
    val action: String,
    val delay: Int? = null
)

@Serializable
data class PromotionalOffer(
    val name: String,
    val description: String,
    val discountAmount: Double,
    val validityPeriod: ValidityPeriod,
    val conditions: List<String>
)

@Serializable
data class MarketingAsset(
    val type: String,
    val description: String,
    val prompt: String,
    val usage: List<String>
) 