#!/usr/bin/env python3
"""
IBCM AI - Advanced Agent System
Implements Planner, Search, Delivery, and Analytics Agents as specified in the document
"""

import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import numpy as np
from math import radians, sin, cos, sqrt, atan2
import requests
import feedparser

logger = logging.getLogger(__name__)

class PlannerAgent:
    """
    Planner Agent - Decides which sub-agent should handle a query
    Analyzes user intent and creates execution plan
    """
    
    def __init__(self, ai_engine):
        self.ai_engine = ai_engine
        
    async def analyze_and_plan(self, query: str, user_id: str, context: Dict) -> Dict:
        """Analyze query and create execution plan"""
        try:
            # Analyze query intent
            intent = await self._analyze_intent(query, context)
            
            # Create execution plan
            plan = await self._create_execution_plan(intent, query, context)
            
            # Determine priority and complexity
            priority = self._determine_priority(intent, context)
            
            return {
                'intent': intent,
                'plan': plan,
                'priority': priority,
                'estimated_time': self._estimate_processing_time(plan),
                'complexity': self._assess_complexity(query, context)
            }
            
        except Exception as e:
            logger.error(f"Planner agent error: {e}")
            return {
                'intent': 'general_search',
                'plan': {'actions': ['semantic_search', 'basic_response']},
                'priority': 'medium',
                'estimated_time': 1.0,
                'complexity': 'low'
            }
    
    async def get_real_time_context(self) -> Dict:
        """Get real-time context information"""
        context = {
            'current_time': datetime.now().isoformat(),
            'day_of_week': datetime.now().strftime('%A'),
            'hour_of_day': datetime.now().hour,
            'season': self._get_current_season(),
            'trending_topics': await self._get_trending_topics()
        }
        return context
    
    def _get_current_season(self) -> str:
        """Determine current season"""
        month = datetime.now().month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'fall'
    
    async def _get_trending_topics(self) -> List[str]:
        """Get current trending topics from feeds"""
        try:
            trending = []
            # Sample RSS feed parsing for trending topics
            feeds = [
                'https://feeds.feedburner.com/TechCrunch',
                'https://rss.cnn.com/rss/edition.rss'
            ]
            
            for feed_url in feeds:
                try:
                    feed = feedparser.parse(feed_url)
                    for entry in feed.entries[:3]:  # Get top 3 from each feed
                        trending.append(entry.title)
                except Exception:
                    continue
            
            return trending[:10]  # Return top 10 trending topics
        except Exception as e:
            logger.warning(f"Could not fetch trending topics: {e}")
            return ['tech events', 'local activities', 'weekend plans']
    
    async def _analyze_intent(self, query: str, context: Dict) -> str:
        """Advanced intent analysis"""
        query_lower = query.lower()
        
        # Location-based intents
        if any(word in query_lower for word in ['near', 'nearby', 'location', 'around']):
            if any(word in query_lower for word in ['spa', 'wellness', 'massage']):
                return 'location_wellness_search'
            elif any(word in query_lower for word in ['restaurant', 'food', 'dining']):
                return 'location_dining_search'
            elif any(word in query_lower for word in ['gym', 'fitness', 'workout']):
                return 'location_fitness_search'
            else:
                return 'location_general_search'
        
        # Time-based intents
        if any(word in query_lower for word in ['today', 'tonight', 'tomorrow', 'weekend']):
            return f"time_based_{self._get_category(query_lower)}"
        
        # Price-based intents
        if any(word in query_lower for word in ['cheap', 'affordable', 'budget', 'expensive', 'premium']):
            return f"price_sensitive_{self._get_category(query_lower)}"
        
        # Category-specific intents
        category = self._get_category(query_lower)
        return f"{category}_search"
    
    def _get_category(self, query_lower: str) -> str:
        """Get main category from query"""
        if any(word in query_lower for word in ['spa', 'wellness', 'massage', 'relaxation']):
            return 'wellness'
        elif any(word in query_lower for word in ['restaurant', 'food', 'dining', 'eat']):
            return 'dining'
        elif any(word in query_lower for word in ['gym', 'fitness', 'workout', 'yoga']):
            return 'fitness'
        elif any(word in query_lower for word in ['event', 'show', 'concert', 'entertainment']):
            return 'entertainment'
        else:
            return 'general'
    
    async def _create_execution_plan(self, intent: str, query: str, context: Dict) -> Dict:
        """Create detailed execution plan"""
        base_actions = ['semantic_search', 'relevance_filtering']
        
        if 'location' in intent:
            base_actions.extend(['spatial_filtering', 'distance_calculation'])
        
        if 'time' in intent:
            base_actions.extend(['temporal_filtering', 'availability_check'])
        
        if 'price' in intent:
            base_actions.extend(['price_filtering', 'value_assessment'])
        
        base_actions.extend(['personalization', 'ranking', 'response_generation'])
        
        return {
            'actions': base_actions,
            'search_strategy': self._determine_search_strategy(intent),
            'filters': self._determine_filters(intent, context),
            'ranking_criteria': self._determine_ranking_criteria(intent, context)
        }
    
    def _determine_search_strategy(self, intent: str) -> str:
        """Determine search strategy based on intent"""
        if 'location' in intent:
            return 'spatial_semantic'
        elif 'time' in intent:
            return 'temporal_semantic'
        elif 'price' in intent:
            return 'value_semantic'
        else:
            return 'semantic_only'
    
    def _determine_filters(self, intent: str, context: Dict) -> Dict:
        """Determine filters to apply"""
        filters = {}
        
        if 'location' in intent and context.get('location'):
            filters['spatial'] = {
                'max_distance': 25,  # km
                'location': context['location']
            }
        
        if 'time' in intent:
            filters['temporal'] = {
                'time_window': '24h',
                'availability_required': True
            }
        
        if 'price' in intent:
            filters['pricing'] = {
                'budget_consideration': True,
                'value_optimization': True
            }
        
        return filters
    
    def _determine_ranking_criteria(self, intent: str, context: Dict) -> List[str]:
        """Determine ranking criteria"""
        criteria = ['relevance_score']
        
        if 'location' in intent:
            criteria.append('distance_score')
        
        if 'price' in intent:
            criteria.append('value_score')
        
        criteria.extend(['rating_score', 'availability_score', 'personalization_score'])
        
        return criteria
    
    def _determine_priority(self, intent: str, context: Dict) -> str:
        """Determine processing priority"""
        if 'time' in intent and any(word in intent for word in ['today', 'tonight']):
            return 'high'
        elif 'location' in intent:
            return 'medium'
        else:
            return 'low'
    
    def _estimate_processing_time(self, plan: Dict) -> float:
        """Estimate processing time in seconds"""
        base_time = 0.5
        action_time = len(plan.get('actions', [])) * 0.1
        complexity_factor = 1.2 if plan.get('search_strategy') == 'spatial_semantic' else 1.0
        
        return (base_time + action_time) * complexity_factor
    
    def _assess_complexity(self, query: str, context: Dict) -> str:
        """Assess query complexity"""
        complexity_score = 0
        
        if len(query.split()) > 10:
            complexity_score += 1
        
        if context.get('location'):
            complexity_score += 1
        
        if context.get('preferences') and len(context['preferences']) > 3:
            complexity_score += 1
        
        if complexity_score >= 2:
            return 'high'
        elif complexity_score == 1:
            return 'medium'
        else:
            return 'low'

class SearchAgent:
    """
    Search Agent - Retrieves relevant data using advanced search strategies
    Implements spatio-temporal search with real-time filtering
    """
    
    def __init__(self, ai_engine):
        self.ai_engine = ai_engine
        
    async def execute_search(self, plan: Dict, query: str, context: Dict) -> Dict:
        """Execute search based on plan"""
        try:
            start_time = time.time()
            
            # Get base results from semantic search
            semantic_results = await self._semantic_search(query, plan)
            
            # Apply spatial filtering if needed
            if 'spatial_filtering' in plan.get('actions', []):
                semantic_results = await self._apply_spatial_filtering(semantic_results, plan, context)
            
            # Apply temporal filtering if needed
            if 'temporal_filtering' in plan.get('actions', []):
                semantic_results = await self._apply_temporal_filtering(semantic_results, plan, context)
            
            # Apply price filtering if needed
            if 'price_filtering' in plan.get('actions', []):
                semantic_results = await self._apply_price_filtering(semantic_results, plan, context)
            
            # Apply personalization
            if 'personalization' in plan.get('actions', []):
                semantic_results = await self._apply_personalization(semantic_results, context)
            
            # Rank results
            ranked_results = await self._rank_results(semantic_results, plan, context)
            
            processing_time = time.time() - start_time
            
            logger.info(f"🎯 SearchAgent: Semantic: {len(semantic_results)}, Ranked: {len(ranked_results)}")
            
            return {
                'results': ranked_results,
                'total_found': len(ranked_results),
                'processing_time': processing_time,
                'search_strategy': plan.get('search_strategy'),
                'filters_applied': list(plan.get('filters', {}).keys()),
                'performance_metrics': self._get_performance_metrics(semantic_results, ranked_results)
            }
            
        except Exception as e:
            logger.error(f"Search agent error: {e}")
            return {
                'results': [],
                'total_found': 0,
                'processing_time': 0,
                'error': str(e)
            }
    
    async def _semantic_search(self, query: str, plan: Dict) -> List[Dict]:
        """Perform semantic search with demo data support"""
        try:
            # Get results from AI engine's semantic search
            search_results = await self.ai_engine.semantic_search(query, top_k=20)
            
            # Get full entity data from database OR use demo data
            entities = []
            if self.ai_engine.db is not None:
                # Database mode - get real entities
                for result in search_results:
                    try:
                        entity_id = result['entity_id']
                        entity = self.ai_engine.db.events.find_one({'_id': entity_id})
                        if entity:
                            entity['_id'] = str(entity['_id'])
                            entity['semantic_score'] = result['score']
                            entities.append(entity)
                    except:
                        continue
            else:
                # Demo mode - convert search results to entity format
                for result in search_results:
                    entity = {
                        '_id': result['entity_id'],
                        'title': result['text'].split(' - ')[0] if ' - ' in result['text'] else f"Service for {query}",
                        'description': result['text'],
                        'category': self._get_category_from_query(query),
                        'location': {
                            'latitude': 12.9716 + (hash(result['entity_id']) % 100) / 1000,  # Demo coordinates
                            'longitude': 77.5946 + (hash(result['entity_id']) % 100) / 1000,
                            'address': "Downtown Area, City Center"
                        },
                        'pricing': {
                            'amount': 100 + (hash(result['entity_id']) % 500),  # Demo pricing
                            'currency': 'INR',
                            'offers': ['10% off for new users', 'Weekend special deals']
                        },
                        'rating': 4.0 + (hash(result['entity_id']) % 10) / 10,  # Demo rating 4.0-4.9
                        'availability': 'Available now',
                        'contact': '+91-98765-43210',
                        'semantic_score': result['score'],
                        'distance_km': round((hash(result['entity_id']) % 50) / 10, 1)  # Demo distance 0-5km
                    }
                    entities.append(entity)
            
            logger.info(f"🔍 SearchAgent: Found {len(entities)} entities for query '{query}'")
            return entities
            
        except Exception as e:
            logger.warning(f"Semantic search error: {e}")
            return []
    
    def _get_category_from_query(self, query: str) -> str:
        """Determine category from query for demo data"""
        query_lower = query.lower()
        if any(word in query_lower for word in ['food', 'eat', 'restaurant', 'meal']):
            return 'Food & Beverages'
        elif any(word in query_lower for word in ['movie', 'entertainment', 'fun']):
            return 'Entertainment & Nightlife'
        elif any(word in query_lower for word in ['shop', 'buy', 'mall']):
            return 'Retail & Shopping'
        elif any(word in query_lower for word in ['service', 'help', 'repair']):
            return 'Individual & Home Services'
        else:
            return 'General Services'
    
    async def _apply_spatial_filtering(self, results: List[Dict], plan: Dict, context: Dict) -> List[Dict]:
        """Apply spatial filtering with Haversine distance"""
        try:
            spatial_filter = plan.get('filters', {}).get('spatial')
            if not spatial_filter or not context.get('location'):
                return results
            
            user_location = context['location']
            user_lat = user_location.get('lat', 0)
            user_lon = user_location.get('lon', 0)
            max_distance = spatial_filter.get('max_distance', 25)
            
            filtered_results = []
            for result in results:
                location = result.get('location', {})
                if location.get('lat') and location.get('lon'):
                    distance = self._calculate_haversine_distance(
                        user_lat, user_lon,
                        location['lat'], location['lon']
                    )
                    
                    if distance <= max_distance:
                        result['distance_km'] = round(distance, 2)
                        result['distance_score'] = max(0, 1 - (distance / max_distance))
                        filtered_results.append(result)
            
            return filtered_results
            
        except Exception as e:
            logger.warning(f"Spatial filtering error: {e}")
            return results
    
    def _calculate_haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate Haversine distance between two points"""
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c
    
    async def _apply_temporal_filtering(self, results: List[Dict], plan: Dict, context: Dict) -> List[Dict]:
        """Apply temporal filtering"""
        try:
            # Filter by availability and time preferences
            filtered_results = []
            current_time = datetime.now()
            
            for result in results:
                # Check availability
                availability = result.get('availability', '')
                if 'available' in availability.lower() or 'open' in availability.lower():
                    result['temporal_score'] = 1.0
                    filtered_results.append(result)
                elif availability:
                    result['temporal_score'] = 0.5
                    filtered_results.append(result)
                else:
                    result['temporal_score'] = 0.3
                    filtered_results.append(result)
            
            return filtered_results
            
        except Exception as e:
            logger.warning(f"Temporal filtering error: {e}")
            return results
    
    async def _apply_price_filtering(self, results: List[Dict], plan: Dict, context: Dict) -> List[Dict]:
        """Apply price filtering and value assessment"""
        try:
            for result in results:
                pricing = result.get('pricing', {})
                amount = pricing.get('amount', 0)
                
                if amount:
                    # Simple value score based on price and rating
                    rating = result.get('rating', 3.5)
                    value_score = min(1.0, rating / (amount / 50))  # Normalize by $50 baseline
                    result['value_score'] = value_score
                    result['price_category'] = self._categorize_price(amount)
                else:
                    result['value_score'] = 0.5
                    result['price_category'] = 'contact_for_pricing'
            
            return results
            
        except Exception as e:
            logger.warning(f"Price filtering error: {e}")
            return results
    
    def _categorize_price(self, amount: float) -> str:
        """Categorize price level"""
        if amount < 50:
            return 'budget'
        elif amount < 150:
            return 'moderate'
        elif amount < 300:
            return 'premium'
        else:
            return 'luxury'
    
    async def _apply_personalization(self, results: List[Dict], context: Dict) -> List[Dict]:
        """Apply personalization based on user preferences"""
        try:
            preferences = context.get('preferences', [])
            if not preferences:
                return results
            
            for result in results:
                personalization_score = 0
                
                # Check category match
                category = result.get('category', '').lower()
                for pref in preferences:
                    if pref.lower() in category:
                        personalization_score += 0.3
                
                # Check tags match
                tags = result.get('tags', [])
                for tag in tags:
                    for pref in preferences:
                        if pref.lower() in tag.lower():
                            personalization_score += 0.1
                
                result['personalization_score'] = min(1.0, personalization_score)
            
            return results
            
        except Exception as e:
            logger.warning(f"Personalization error: {e}")
            return results
    
    async def _rank_results(self, results: List[Dict], plan: Dict, context: Dict) -> List[Dict]:
        """Rank results based on multiple criteria"""
        try:
            ranking_criteria = plan.get('ranking_criteria', ['relevance_score'])
            
            for result in results:
                total_score = 0
                score_count = 0
                
                # Base semantic score
                if 'relevance_score' in ranking_criteria:
                    total_score += result.get('semantic_score', 0) * 0.3
                    score_count += 1
                
                # Distance score
                if 'distance_score' in ranking_criteria:
                    total_score += result.get('distance_score', 0.5) * 0.2
                    score_count += 1
                
                # Value score
                if 'value_score' in ranking_criteria:
                    total_score += result.get('value_score', 0.5) * 0.2
                    score_count += 1
                
                # Rating score
                if 'rating_score' in ranking_criteria:
                    rating = result.get('rating', 3.5)
                    rating_score = rating / 5.0
                    total_score += rating_score * 0.15
                    score_count += 1
                
                # Personalization score
                if 'personalization_score' in ranking_criteria:
                    total_score += result.get('personalization_score', 0) * 0.15
                    score_count += 1
                
                result['final_score'] = total_score / max(score_count, 1)
            
            # Sort by final score
            return sorted(results, key=lambda x: x.get('final_score', 0), reverse=True)
            
        except Exception as e:
            logger.warning(f"Ranking error: {e}")
            return results
    
    def _get_performance_metrics(self, initial_results: List[Dict], final_results: List[Dict]) -> Dict:
        """Get performance metrics"""
        return {
            'initial_count': len(initial_results),
            'final_count': len(final_results),
            'filter_efficiency': len(final_results) / max(len(initial_results), 1),
            'avg_final_score': np.mean([r.get('final_score', 0) for r in final_results]) if final_results else 0
        }

class DeliveryAgent:
    """
    Delivery Agent - Formats results and generates dynamic content
    Creates personalized, engaging responses
    """
    
    def __init__(self, ai_engine):
        self.ai_engine = ai_engine
        
    async def format_and_deliver(self, search_results: Dict, plan: Dict, query: str, context: Dict) -> Dict:
        """Format search results into engaging response"""
        try:
            results = search_results.get('results', [])
            
            # Generate main response
            main_response = await self._generate_main_response(results, query, context)
            
            # Format individual items
            formatted_items = await self._format_items(results, context)
            
            # Generate recommendations
            recommendations = await self._generate_recommendations(results, plan, context)
            
            # Create call-to-action
            call_to_action = self._generate_call_to_action(results, plan)
            
            return {
                'success': True,
                'main_response': main_response,
                'items': formatted_items,
                'recommendations': recommendations,
                'call_to_action': call_to_action,
                'search_summary': self._create_search_summary(search_results),
                'personalization_applied': bool(context.get('preferences')),
                'total_results': len(results)
            }
            
        except Exception as e:
            logger.error(f"Delivery agent error: {e}")
            return {
                'success': False,
                'error': str(e),
                'fallback_response': self._generate_fallback_response(query)
            }
    
    async def _generate_main_response(self, results: List[Dict], query: str, context: Dict) -> str:
        """Generate main AI response"""
        if not results:
            return f"I searched for '{query}' but couldn't find specific matches. Let me help you explore other options or refine your search."
        
        # Build context for AI response
        top_results = results[:3]
        result_context = ""
        
        for i, result in enumerate(top_results, 1):
            result_context += f"{i}. {result.get('title', 'Service')} - "
            result_context += f"{result.get('category', 'General')} "
            if result.get('distance_km'):
                result_context += f"({result['distance_km']}km away) "
            if result.get('pricing', {}).get('amount'):
                result_context += f"${result['pricing']['amount']} "
            result_context += "\n"
        
        # Generate intelligent response
        if self.ai_engine.model:
            try:
                prompt = f"Based on the query '{query}' and these options:\n{result_context}\nGenerate a helpful, enthusiastic response that highlights the best matches."
                
                response = await self.ai_engine.generate_response(prompt)
                return response
            except:
                pass
        
        # Fallback intelligent response
        return self._generate_intelligent_fallback(query, top_results, context)
    
    def _generate_intelligent_fallback(self, query: str, results: List[Dict], context: Dict) -> str:
        """Generate intelligent fallback response"""
        if not results:
            return f"I understand you're looking for {query}. Let me help you find the best options available."
        
        total = len(results)
        category = results[0].get('category', 'services')
        
        response = f"Great! I found {total} excellent {category} options for you. "
        
        if context.get('location'):
            response += f"Based on your location, here are the best nearby choices: "
        else:
            response += f"Here are the top recommendations: "
        
        # Highlight top result
        top_result = results[0]
        response += f"\n\n⭐ **{top_result.get('title', 'Top Choice')}** stands out with "
        
        if top_result.get('rating'):
            response += f"{top_result['rating']}/5 stars"
        
        if top_result.get('distance_km'):
            response += f" and is just {top_result['distance_km']}km away"
        
        if top_result.get('pricing', {}).get('amount'):
            response += f" at ${top_result['pricing']['amount']}"
        
        response += f". {top_result.get('description', 'Professional service with great reviews.')[:100]}..."
        
        if total > 1:
            response += f"\n\nI also found {total-1} other great options that match your needs perfectly!"
        
        return response
    
    async def _format_items(self, results: List[Dict], context: Dict) -> List[Dict]:
        """Format individual items for display"""
        formatted_items = []
        
        for i, result in enumerate(results[:10], 1):  # Limit to top 10
            formatted_item = {
                'rank': i,
                'id': result.get('_id', f'item_{i}'),
                'title': result.get('title', 'Service'),
                'description': result.get('description', 'Professional service')[:200] + "...",
                'category': result.get('category', 'General'),
                'rating': f"⭐ {result.get('rating', 'New')}/5" if result.get('rating') else "⭐ New",
                'pricing': self._format_pricing(result.get('pricing', {})),
                'location': self._format_location(result.get('location', {})),
                'features': result.get('features', [])[:3],  # Top 3 features
                'availability': result.get('availability', 'Contact for availability'),
                'scores': {
                    'final_score': f"{result.get('final_score', 0):.1%}",
                    'semantic_match': f"{result.get('semantic_score', 0):.1%}",
                    'personalization': f"{result.get('personalization_score', 0):.1%}"
                }
            }
            
            # Add distance if available
            if result.get('distance_km'):
                formatted_item['distance'] = f"{result['distance_km']}km away"
            
            # Add value assessment
            if result.get('value_score'):
                formatted_item['value_rating'] = f"{result['value_score']:.1%} value score"
            
            formatted_items.append(formatted_item)
        
        return formatted_items
    
    def _format_pricing(self, pricing: Dict) -> Dict:
        """Format pricing information"""
        if not pricing:
            return {'main': 'Contact for pricing', 'details': []}
        
        amount = pricing.get('amount')
        if amount:
            return {
                'main': f"${amount}",
                'currency': pricing.get('currency', 'USD'),
                'packages': pricing.get('packages', []),
                'category': getattr(self, '_categorize_price', lambda x: 'standard')(amount)
            }
        
        return {'main': 'Contact for pricing', 'details': []}
    
    def _format_location(self, location: Dict) -> Dict:
        """Format location information"""
        if not location:
            return {'address': 'Location available upon booking'}
        
        return {
            'address': location.get('address', 'Address available'),
            'neighborhood': location.get('neighborhood', ''),
            'city': location.get('city', ''),
            'coordinates': {
                'lat': location.get('lat'),
                'lon': location.get('lon')
            } if location.get('lat') else None
        }
    
    async def _generate_recommendations(self, results: List[Dict], plan: Dict, context: Dict) -> List[str]:
        """Generate smart recommendations"""
        recommendations = []
        
        if not results:
            recommendations = [
                "💡 Try broadening your search terms",
                "📍 Consider expanding your location radius",
                "🔍 Check our featured services and offers"
            ]
        else:
            # Time-based recommendations
            if 'temporal' in plan.get('filters', {}):
                recommendations.append("📅 Book in advance for guaranteed availability")
            
            # Location-based recommendations
            if any(r.get('distance_km') for r in results):
                recommendations.append("🚗 Check transportation options for further locations")
            
            # Price-based recommendations
            if any(r.get('value_score', 0) > 0.8 for r in results):
                recommendations.append("💰 Great value options available - book soon!")
            
            # Category-specific recommendations
            category = results[0].get('category', '')
            if 'wellness' in category:
                recommendations.extend([
                    "🧘 Consider package deals for multiple sessions",
                    "🌿 Ask about organic and natural options"
                ])
            elif 'dining' in category:
                recommendations.extend([
                    "🍷 Inquire about wine pairing options",
                    "👥 Make reservations for groups early"
                ])
            elif 'fitness' in category:
                recommendations.extend([
                    "🏃 Try different class times to find your preference",
                    "🤝 Join community events to meet like-minded people"
                ])
        
        return recommendations[:4]  # Limit to 4 recommendations
    
    def _generate_call_to_action(self, results: List[Dict], plan: Dict) -> str:
        """Generate appropriate call-to-action"""
        if not results:
            return "🔍 Refine your search or explore our featured services"
        
        if len(results) == 1:
            return f"📞 Book {results[0].get('title', 'this service')} now to secure your spot!"
        
        intent = plan.get('intent', '')
        if 'time' in intent:
            return "⏰ Time-sensitive options available - book today for best selection!"
        elif 'location' in intent:
            return "📍 Perfect nearby options found - check availability and book now!"
        else:
            return f"✨ {len(results)} great options available - compare and book your favorite!"
    
    def _create_search_summary(self, search_results: Dict) -> Dict:
        """Create search summary"""
        return {
            'total_found': search_results.get('total_found', 0),
            'processing_time': f"{search_results.get('processing_time', 0):.3f}s",
            'search_strategy': search_results.get('search_strategy', 'semantic'),
            'filters_applied': search_results.get('filters_applied', []),
            'performance': search_results.get('performance_metrics', {})
        }
    
    def _generate_fallback_response(self, query: str) -> str:
        """Generate fallback response for errors"""
        return f"I understand you're looking for {query}. Let me help you find the best options. Please try your request again or contact our support team for assistance."

class AnalyticsAgent:
    """
    Analytics Agent - Predicts demand, prices, trends per domain
    Provides business intelligence insights
    """
    
    def __init__(self, ai_engine):
        self.ai_engine = ai_engine
        
    async def analyze_trends(self, results: List[Dict], query: str, context: Dict) -> Dict:
        """Analyze trends and provide insights"""
        try:
            # Demand analysis
            demand_analysis = await self._analyze_demand(results, context)
            
            # Price trends
            price_trends = await self._analyze_price_trends(results)
            
            # Category performance
            category_performance = await self._analyze_category_performance(results)
            
            # Prediction insights
            predictions = await self._generate_predictions(results, context)
            
            return {
                'demand_analysis': demand_analysis,
                'price_trends': price_trends,
                'category_performance': category_performance,
                'predictions': predictions,
                'market_insights': self._generate_market_insights(results, context)
            }
            
        except Exception as e:
            logger.error(f"Analytics agent error: {e}")
            return {
                'error': str(e),
                'basic_stats': self._get_basic_stats(results)
            }
    
    async def _analyze_demand(self, results: List[Dict], context: Dict) -> Dict:
        """Analyze demand patterns"""
        if not results:
            return {'status': 'no_data'}
        
        # Availability analysis
        available_count = sum(1 for r in results if 'available' in r.get('availability', '').lower())
        demand_indicator = 1 - (available_count / len(results))
        
        return {
            'demand_level': 'high' if demand_indicator > 0.7 else 'medium' if demand_indicator > 0.3 else 'low',
            'availability_rate': available_count / len(results),
            'total_options': len(results),
            'demand_score': demand_indicator
        }
    
    async def _analyze_price_trends(self, results: List[Dict]) -> Dict:
        """Analyze price trends"""
        prices = [r.get('pricing', {}).get('amount', 0) for r in results if r.get('pricing', {}).get('amount')]
        
        if not prices:
            return {'status': 'no_pricing_data'}
        
        avg_price = np.mean(prices)
        price_range = max(prices) - min(prices)
        
        return {
            'average_price': round(avg_price, 2),
            'price_range': round(price_range, 2),
            'min_price': min(prices),
            'max_price': max(prices),
            'price_distribution': {
                'budget': sum(1 for p in prices if p < avg_price * 0.7),
                'moderate': sum(1 for p in prices if avg_price * 0.7 <= p <= avg_price * 1.3),
                'premium': sum(1 for p in prices if p > avg_price * 1.3)
            }
        }
    
    async def _analyze_category_performance(self, results: List[Dict]) -> Dict:
        """Analyze category performance"""
        categories = {}
        
        for result in results:
            category = result.get('category', 'unknown')
            if category not in categories:
                categories[category] = {
                    'count': 0,
                    'avg_rating': 0,
                    'avg_price': 0,
                    'ratings': [],
                    'prices': []
                }
            
            categories[category]['count'] += 1
            
            if result.get('rating'):
                categories[category]['ratings'].append(result['rating'])
            
            if result.get('pricing', {}).get('amount'):
                categories[category]['prices'].append(result['pricing']['amount'])
        
        # Calculate averages
        for category, data in categories.items():
            data['avg_rating'] = np.mean(data['ratings']) if data['ratings'] else 0
            data['avg_price'] = np.mean(data['prices']) if data['prices'] else 0
        
        return categories
    
    async def _generate_predictions(self, results: List[Dict], context: Dict) -> Dict:
        """Generate simple predictions"""
        predictions = {}
        
        # Time-based predictions
        current_hour = datetime.now().hour
        if 9 <= current_hour <= 17:
            predictions['optimal_booking_time'] = 'Business hours - good availability'
        elif 18 <= current_hour <= 21:
            predictions['optimal_booking_time'] = 'Peak hours - book early'
        else:
            predictions['optimal_booking_time'] = 'Off-peak - excellent availability'
        
        # Demand predictions
        if results:
            avg_rating = np.mean([r.get('rating', 0) for r in results if r.get('rating')])
            if avg_rating > 4.5:
                predictions['demand_forecast'] = 'High demand expected - book soon'
            elif avg_rating > 4.0:
                predictions['demand_forecast'] = 'Moderate demand - good availability'
            else:
                predictions['demand_forecast'] = 'Normal demand - flexible booking'
        
        return predictions
    
    def _generate_market_insights(self, results: List[Dict], context: Dict) -> List[str]:
        """Generate market insights"""
        insights = []
        
        if not results:
            insights.append("💡 Market opportunity - limited options in this category")
            return insights
        
        # Competition analysis
        if len(results) > 10:
            insights.append("🏆 Highly competitive market with many options")
        elif len(results) < 3:
            insights.append("🎯 Niche market with limited competition")
        
        # Quality analysis
        ratings = [r.get('rating', 0) for r in results if r.get('rating')]
        if ratings:
            avg_rating = np.mean(ratings)
            if avg_rating > 4.5:
                insights.append("⭐ Exceptionally high-quality market")
            elif avg_rating < 3.5:
                insights.append("📈 Market opportunity for quality improvement")
        
        # Price analysis
        prices = [r.get('pricing', {}).get('amount', 0) for r in results if r.get('pricing', {}).get('amount')]
        if prices:
            price_variance = np.var(prices)
            if price_variance > np.mean(prices):
                insights.append("💰 Wide price range - good options for all budgets")
        
        return insights[:3]  # Limit to 3 insights
    
    def _get_basic_stats(self, results: List[Dict]) -> Dict:
        """Get basic statistics"""
        return {
            'total_results': len(results),
            'categories': len(set(r.get('category', 'unknown') for r in results)),
            'with_ratings': sum(1 for r in results if r.get('rating')),
            'with_pricing': sum(1 for r in results if r.get('pricing', {}).get('amount'))
        }

class AgentOrchestrator:
    """
    Agent Orchestrator - Coordinates all agents
    Implements the complete agent workflow from the document
    """
    
    def __init__(self, ai_engine):
        self.ai_engine = ai_engine
        self.planner = PlannerAgent(ai_engine)
        self.search = SearchAgent(ai_engine)
        self.delivery = DeliveryAgent(ai_engine)
        self.analytics = AnalyticsAgent(ai_engine)
        
    async def process_request(self, query: str, user_id: str, context: Dict = None) -> Dict:
        """Process complete request through agent workflow"""
        try:
            start_time = time.time()
            
            if context is None:
                context = {}
            
            # Stage 1: Planning
            logger.info(f"🧠 Planner Agent: Analyzing query '{query[:50]}...'")
            plan = await self.planner.analyze_and_plan(query, user_id, context)
            
            # Stage 2: Search
            logger.info(f"🔍 Search Agent: Executing {plan['plan'].get('search_strategy', 'semantic')} search")
            search_results = await self.search.execute_search(plan['plan'], query, context)
            
            # Stage 3: Analytics (if results available)
            analytics_results = None
            if search_results['results']:
                logger.info(f"📊 Analytics Agent: Analyzing {len(search_results['results'])} results")
                analytics_results = await self.analytics.analyze_trends(
                    search_results['results'], query, context
                )
            
            # Stage 4: Delivery
            logger.info(f"📦 Delivery Agent: Formatting response")
            delivery_results = await self.delivery.format_and_deliver(
                search_results, plan, query, context
            )
            
            total_time = time.time() - start_time
            
            # Combine all results
            final_response = {
                'success': True,
                'query': query,
                'user_id': user_id,
                'agent_workflow': {
                    'planner': {
                        'intent': plan['intent'],
                        'priority': plan['priority'],
                        'complexity': plan['complexity']
                    },
                    'search': {
                        'strategy': search_results.get('search_strategy'),
                        'total_found': search_results.get('total_found', 0),
                        'filters_applied': search_results.get('filters_applied', [])
                    },
                    'analytics': analytics_results,
                    'delivery': {
                        'response_generated': delivery_results.get('success', False),
                        'items_formatted': len(delivery_results.get('items', []))
                    }
                },
                'response': delivery_results.get('main_response', ''),
                'items': delivery_results.get('items', []),
                'recommendations': delivery_results.get('recommendations', []),
                'call_to_action': delivery_results.get('call_to_action', ''),
                'performance': {
                    'total_processing_time': round(total_time, 3),
                    'estimated_time': plan.get('estimated_time', 0),
                    'efficiency': 'excellent' if total_time < 2 else 'good' if total_time < 5 else 'acceptable'
                },
                'timestamp': datetime.now().isoformat()
            }
            
            logger.info(f"✅ Agent workflow completed in {total_time:.3f}s")
            return final_response
            
        except Exception as e:
            logger.error(f"❌ Agent orchestrator error: {e}")
            return {
                'success': False,
                'error': str(e),
                'query': query,
                'fallback_response': f"I understand you're looking for {query}. Please try again or contact support.",
                'timestamp': datetime.now().isoformat()
            }
    
    async def get_status(self) -> Dict:
        """Get agent system status"""
        return {
            'agent_system': 'Advanced Agent Orchestrator',
            'agents': {
                'planner': 'operational',
                'search': 'operational', 
                'delivery': 'operational',
                'analytics': 'operational'
            },
            'capabilities': [
                'intent_analysis',
                'spatio_temporal_search',
                'multi_criteria_ranking',
                'personalized_delivery',
                'business_analytics'
            ],
            'ai_engine_status': await self.ai_engine.get_status()
        }
