import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from models import Booking, Hotel, Restaurant, User
from datetime import datetime, timedelta
import json

class RecommendationEngine:
    def __init__(self):
        self.hotel_vectorizer = TfidfVectorizer(stop_words='english')
        self.restaurant_vectorizer = TfidfVectorizer(stop_words='english')
        self.hotel_similarity_matrix = None
        self.restaurant_similarity_matrix = None
        
    def build_hotel_recommendations(self, db: Session):
        """Build hotel recommendation matrix based on features"""
        hotels = db.query(Hotel).filter(Hotel.is_active == True).all()
        
        if not hotels:
            return
        
        # Create feature matrix
        hotel_features = []
        hotel_ids = []
        
        for hotel in hotels:
            features = f"{hotel.name} {hotel.description or ''} {hotel.city} {hotel.state}"
            hotel_features.append(features)
            hotel_ids.append(hotel.id)
        
        # Create TF-IDF matrix
        tfidf_matrix = self.hotel_vectorizer.fit_transform(hotel_features)
        
        # Calculate similarity matrix
        self.hotel_similarity_matrix = cosine_similarity(tfidf_matrix)
        self.hotel_ids = hotel_ids
    
    def build_restaurant_recommendations(self, db: Session):
        """Build restaurant recommendation matrix based on features"""
        restaurants = db.query(Restaurant).filter(Restaurant.is_active == True).all()
        
        if not restaurants:
            return
        
        # Create feature matrix
        restaurant_features = []
        restaurant_ids = []
        
        for restaurant in restaurants:
            features = f"{restaurant.name} {restaurant.description or ''} {restaurant.cuisine_type or ''} {restaurant.city} {restaurant.state}"
            restaurant_features.append(features)
            restaurant_ids.append(restaurant.id)
        
        # Create TF-IDF matrix
        tfidf_matrix = self.restaurant_vectorizer.fit_transform(restaurant_features)
        
        # Calculate similarity matrix
        self.restaurant_similarity_matrix = cosine_similarity(tfidf_matrix)
        self.restaurant_ids = restaurant_ids
    
    def get_hotel_recommendations(self, hotel_id: int, num_recommendations: int = 5) -> List[int]:
        """Get similar hotels based on content similarity"""
        if self.hotel_similarity_matrix is None:
            return []
        
        try:
            hotel_index = self.hotel_ids.index(hotel_id)
            similarity_scores = self.hotel_similarity_matrix[hotel_index]
            
            # Get top similar hotels (excluding the hotel itself)
            similar_indices = np.argsort(similarity_scores)[::-1][1:num_recommendations+1]
            
            return [self.hotel_ids[i] for i in similar_indices]
        except ValueError:
            return []
    
    def get_restaurant_recommendations(self, restaurant_id: int, num_recommendations: int = 5) -> List[int]:
        """Get similar restaurants based on content similarity"""
        if self.restaurant_similarity_matrix is None:
            return []
        
        try:
            restaurant_index = self.restaurant_ids.index(restaurant_id)
            similarity_scores = self.restaurant_similarity_matrix[restaurant_index]
            
            # Get top similar restaurants (excluding the restaurant itself)
            similar_indices = np.argsort(similarity_scores)[::-1][1:num_recommendations+1]
            
            return [self.restaurant_ids[i] for i in similar_indices]
        except ValueError:
            return []
    
    def get_user_based_recommendations(self, user_id: int, db: Session, num_recommendations: int = 5) -> Dict:
        """Get personalized recommendations based on user's booking history"""
        # Get user's booking history
        user_bookings = db.query(Booking).filter(
            Booking.customer_id == user_id,
            Booking.status.in_(["confirmed", "completed"])
        ).all()
        
        if not user_bookings:
            return {"hotels": [], "restaurants": []}
        
        # Analyze user preferences
        user_hotels = [b.hotel_id for b in user_bookings if b.hotel_id]
        user_restaurants = [b.restaurant_id for b in user_bookings if b.restaurant_id]
        
        recommendations = {"hotels": [], "restaurants": []}
        
        # Hotel recommendations based on similar users
        if user_hotels:
            # Find users who booked similar hotels
            similar_users = db.query(Booking.customer_id).filter(
                Booking.hotel_id.in_(user_hotels),
                Booking.customer_id != user_id
            ).distinct().all()
            
            if similar_users:
                similar_user_ids = [u[0] for u in similar_users]
                
                # Get hotels booked by similar users
                recommended_hotels = db.query(Booking.hotel_id).filter(
                    Booking.customer_id.in_(similar_user_ids),
                    Booking.hotel_id.notin_(user_hotels),
                    Booking.status.in_(["confirmed", "completed"])
                ).distinct().limit(num_recommendations).all()
                
                recommendations["hotels"] = [h[0] for h in recommended_hotels]
        
        # Restaurant recommendations based on similar users
        if user_restaurants:
            # Find users who booked similar restaurants
            similar_users = db.query(Booking.customer_id).filter(
                Booking.restaurant_id.in_(user_restaurants),
                Booking.customer_id != user_id
            ).distinct().all()
            
            if similar_users:
                similar_user_ids = [u[0] for u in similar_users]
                
                # Get restaurants booked by similar users
                recommended_restaurants = db.query(Booking.restaurant_id).filter(
                    Booking.customer_id.in_(similar_user_ids),
                    Booking.restaurant_id.notin_(user_restaurants),
                    Booking.status.in_(["confirmed", "completed"])
                ).distinct().limit(num_recommendations).all()
                
                recommendations["restaurants"] = [r[0] for r in recommended_restaurants]
        
        return recommendations
    
    def get_trending_hotels(self, db: Session, days: int = 30, limit: int = 10) -> List[int]:
        """Get trending hotels based on recent bookings"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        trending_hotels = db.query(Booking.hotel_id).filter(
            Booking.hotel_id.isnot(None),
            Booking.created_at >= cutoff_date,
            Booking.status.in_(["confirmed", "completed"])
        ).group_by(Booking.hotel_id).order_by(
            db.func.count(Booking.id).desc()
        ).limit(limit).all()
        
        return [h[0] for h in trending_hotels]
    
    def get_trending_restaurants(self, db: Session, days: int = 30, limit: int = 10) -> List[int]:
        """Get trending restaurants based on recent bookings"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        trending_restaurants = db.query(Booking.restaurant_id).filter(
            Booking.restaurant_id.isnot(None),
            Booking.created_at >= cutoff_date,
            Booking.status.in_(["confirmed", "completed"])
        ).group_by(Booking.restaurant_id).order_by(
            db.func.count(Booking.id).desc()
        ).limit(limit).all()
        
        return [r[0] for r in trending_restaurants]
    
    def get_location_based_recommendations(self, latitude: float, longitude: float, 
                                         db: Session, radius_km: float = 10) -> Dict:
        """Get recommendations based on location proximity"""
        # Simple distance calculation (in a real app, use proper geospatial queries)
        hotels = db.query(Hotel).filter(Hotel.is_active == True).all()
        restaurants = db.query(Restaurant).filter(Restaurant.is_active == True).all()
        
        nearby_hotels = []
        nearby_restaurants = []
        
        for hotel in hotels:
            if hotel.latitude and hotel.longitude:
                distance = self._calculate_distance(latitude, longitude, 
                                                  hotel.latitude, hotel.longitude)
                if distance <= radius_km:
                    nearby_hotels.append((hotel.id, distance))
        
        for restaurant in restaurants:
            if restaurant.latitude and restaurant.longitude:
                distance = self._calculate_distance(latitude, longitude, 
                                                  restaurant.latitude, restaurant.longitude)
                if distance <= radius_km:
                    nearby_restaurants.append((restaurant.id, distance))
        
        # Sort by distance
        nearby_hotels.sort(key=lambda x: x[1])
        nearby_restaurants.sort(key=lambda x: x[1])
        
        return {
            "hotels": [h[0] for h in nearby_hotels[:10]],
            "restaurants": [r[0] for r in nearby_restaurants[:10]]
        }
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in kilometers"""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    def get_time_based_recommendations(self, db: Session, current_time: datetime = None) -> Dict:
        """Get recommendations based on time of day and day of week"""
        if current_time is None:
            current_time = datetime.now()
        
        hour = current_time.hour
        day_of_week = current_time.weekday()  # 0 = Monday, 6 = Sunday
        
        recommendations = {"hotels": [], "restaurants": []}
        
        # Restaurant recommendations based on meal times
        if 7 <= hour <= 10:  # Breakfast
            breakfast_restaurants = db.query(Restaurant).filter(
                Restaurant.cuisine_type.ilike("%breakfast%")
            ).limit(5).all()
            recommendations["restaurants"] = [r.id for r in breakfast_restaurants]
        
        elif 12 <= hour <= 14:  # Lunch
            lunch_restaurants = db.query(Restaurant).filter(
                Restaurant.cuisine_type.ilike("%lunch%")
            ).limit(5).all()
            recommendations["restaurants"] = [r.id for r in lunch_restaurants]
        
        elif 19 <= hour <= 22:  # Dinner
            dinner_restaurants = db.query(Restaurant).filter(
                Restaurant.cuisine_type.ilike("%dinner%")
            ).limit(5).all()
            recommendations["restaurants"] = [r.id for r in dinner_restaurants]
        
        # Hotel recommendations based on day of week
        if day_of_week >= 5:  # Weekend
            # Recommend hotels with good weekend amenities
            weekend_hotels = db.query(Hotel).filter(
                Hotel.description.ilike("%weekend%")
            ).limit(5).all()
            recommendations["hotels"] = [h.id for h in weekend_hotels]
        
        return recommendations
