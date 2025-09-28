from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Dict
from datetime import datetime, timedelta
from models import Booking, Hotel, Restaurant, User, UserType, BookingStatus, PaymentStatus
from schemas import BookingAnalytics, DashboardData
from routers.auth import get_current_user

router = APIRouter()

@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.now().date()
    
    if current_user.user_type == UserType.HOTEL_OWNER:
        # Get hotels owned by user
        hotels = db.query(Hotel).filter(Hotel.owner_id == current_user.id).all()
        hotel_ids = [hotel.id for hotel in hotels]
        
        # Today's bookings
        today_bookings = db.query(Booking).filter(
            Booking.hotel_id.in_(hotel_ids),
            func.date(Booking.created_at) == today
        ).count()
        
        # Pending bookings
        pending_bookings = db.query(Booking).filter(
            Booking.hotel_id.in_(hotel_ids),
            Booking.status == BookingStatus.PENDING
        ).count()
        
        # Today's revenue
        today_revenue = db.query(func.sum(Booking.total_amount)).filter(
            Booking.hotel_id.in_(hotel_ids),
            func.date(Booking.created_at) == today,
            Booking.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        # Occupancy rate (simplified calculation)
        total_rooms = db.query(func.count(Room.id)).filter(
            Room.hotel_id.in_(hotel_ids)
        ).scalar() or 1
        
        occupied_rooms = db.query(func.count(Booking.id)).filter(
            Booking.hotel_id.in_(hotel_ids),
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
            Booking.check_in_date <= datetime.now(),
            Booking.check_out_date >= datetime.now()
        ).scalar() or 0
        
        occupancy_rate = (occupied_rooms / total_rooms) * 100
        
        # Recent bookings
        recent_bookings = db.query(Booking).filter(
            Booking.hotel_id.in_(hotel_ids)
        ).order_by(Booking.created_at.desc()).limit(5).all()
        
    elif current_user.user_type == UserType.RESTAURANT_OWNER:
        # Get restaurants owned by user
        restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
        restaurant_ids = [restaurant.id for restaurant in restaurants]
        
        # Today's bookings
        today_bookings = db.query(Booking).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            func.date(Booking.created_at) == today
        ).count()
        
        # Pending bookings
        pending_bookings = db.query(Booking).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            Booking.status == BookingStatus.PENDING
        ).count()
        
        # Today's revenue
        today_revenue = db.query(func.sum(Booking.total_amount)).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            func.date(Booking.created_at) == today,
            Booking.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
        # Occupancy rate (simplified calculation)
        total_tables = db.query(func.count(Table.id)).filter(
            Table.restaurant_id.in_(restaurant_ids)
        ).scalar() or 1
        
        occupied_tables = db.query(func.count(Booking.id)).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.COMPLETED]),
            Booking.booking_date == today
        ).scalar() or 0
        
        occupancy_rate = (occupied_tables / total_tables) * 100
        
        # Recent bookings
        recent_bookings = db.query(Booking).filter(
            Booking.restaurant_id.in_(restaurant_ids)
        ).order_by(Booking.created_at.desc()).limit(5).all()
        
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return DashboardData(
        today_bookings=today_bookings,
        pending_bookings=pending_bookings,
        total_revenue_today=today_revenue,
        occupancy_rate=occupancy_rate,
        recent_bookings=recent_bookings
    )

@router.get("/booking-analytics", response_model=BookingAnalytics)
async def get_booking_analytics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cutoff_date = datetime.now() - timedelta(days=days)
    
    if current_user.user_type == UserType.HOTEL_OWNER:
        # Get hotels owned by user
        hotels = db.query(Hotel).filter(Hotel.owner_id == current_user.id).all()
        hotel_ids = [hotel.id for hotel in hotels]
        
        # Total bookings
        total_bookings = db.query(Booking).filter(
            Booking.hotel_id.in_(hotel_ids),
            Booking.created_at >= cutoff_date
        ).count()
        
        # Confirmed bookings
        confirmed_bookings = db.query(Booking).filter(
            Booking.hotel_id.in_(hotel_ids),
            Booking.created_at >= cutoff_date,
            Booking.status == BookingStatus.CONFIRMED
        ).count()
        
        # Cancelled bookings
        cancelled_bookings = db.query(Booking).filter(
            Booking.hotel_id.in_(hotel_ids),
            Booking.created_at >= cutoff_date,
            Booking.status == BookingStatus.CANCELLED
        ).count()
        
        # Total revenue
        total_revenue = db.query(func.sum(Booking.total_amount)).filter(
            Booking.hotel_id.in_(hotel_ids),
            Booking.created_at >= cutoff_date,
            Booking.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
    elif current_user.user_type == UserType.RESTAURANT_OWNER:
        # Get restaurants owned by user
        restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
        restaurant_ids = [restaurant.id for restaurant in restaurants]
        
        # Total bookings
        total_bookings = db.query(Booking).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            Booking.created_at >= cutoff_date
        ).count()
        
        # Confirmed bookings
        confirmed_bookings = db.query(Booking).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            Booking.created_at >= cutoff_date,
            Booking.status == BookingStatus.CONFIRMED
        ).count()
        
        # Cancelled bookings
        cancelled_bookings = db.query(Booking).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            Booking.created_at >= cutoff_date,
            Booking.status == BookingStatus.CANCELLED
        ).count()
        
        # Total revenue
        total_revenue = db.query(func.sum(Booking.total_amount)).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            Booking.created_at >= cutoff_date,
            Booking.payment_status == PaymentStatus.COMPLETED
        ).scalar() or 0
        
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Average booking value
    average_booking_value = total_revenue / total_bookings if total_bookings > 0 else 0
    
    # Booking trends (daily for the last 30 days)
    booking_trends = []
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).date()
        
        if current_user.user_type == UserType.HOTEL_OWNER:
            daily_bookings = db.query(Booking).filter(
                Booking.hotel_id.in_(hotel_ids),
                func.date(Booking.created_at) == date
            ).count()
        else:
            daily_bookings = db.query(Booking).filter(
                Booking.restaurant_id.in_(restaurant_ids),
                func.date(Booking.created_at) == date
            ).count()
        
        booking_trends.append({
            "date": date.isoformat(),
            "bookings": daily_bookings
        })
    
    booking_trends.reverse()  # Show oldest to newest
    
    return BookingAnalytics(
        total_bookings=total_bookings,
        confirmed_bookings=confirmed_bookings,
        cancelled_bookings=cancelled_bookings,
        total_revenue=total_revenue,
        average_booking_value=average_booking_value,
        booking_trends=booking_trends
    )

@router.get("/popular-times")
async def get_popular_times(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type == UserType.HOTEL_OWNER:
        # Get hotels owned by user
        hotels = db.query(Hotel).filter(Hotel.owner_id == current_user.id).all()
        hotel_ids = [hotel.id for hotel in hotels]
        
        # Popular check-in times
        popular_times = db.query(
            func.extract('hour', Booking.check_in_date).label('hour'),
            func.count(Booking.id).label('count')
        ).filter(
            Booking.hotel_id.in_(hotel_ids),
            Booking.status == BookingStatus.CONFIRMED
        ).group_by(
            func.extract('hour', Booking.check_in_date)
        ).order_by(
            func.count(Booking.id).desc()
        ).limit(10).all()
        
    elif current_user.user_type == UserType.RESTAURANT_OWNER:
        # Get restaurants owned by user
        restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
        restaurant_ids = [restaurant.id for restaurant in restaurants]
        
        # Popular booking times
        popular_times = db.query(
            func.extract('hour', Booking.booking_time).label('hour'),
            func.count(Booking.id).label('count')
        ).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            Booking.status == BookingStatus.CONFIRMED
        ).group_by(
            func.extract('hour', Booking.booking_time)
        ).order_by(
            func.count(Booking.id).desc()
        ).limit(10).all()
        
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "popular_times": [
            {"hour": int(p.hour), "count": p.count} 
            for p in popular_times
        ]
    }

@router.get("/revenue-breakdown")
async def get_revenue_breakdown(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cutoff_date = datetime.now() - timedelta(days=days)
    
    if current_user.user_type == UserType.HOTEL_OWNER:
        # Get hotels owned by user
        hotels = db.query(Hotel).filter(Hotel.owner_id == current_user.id).all()
        hotel_ids = [hotel.id for hotel in hotels]
        
        # Revenue by hotel
        revenue_by_hotel = db.query(
            Hotel.name,
            func.sum(Booking.total_amount).label('revenue')
        ).join(Booking).filter(
            Booking.hotel_id.in_(hotel_ids),
            Booking.created_at >= cutoff_date,
            Booking.payment_status == PaymentStatus.COMPLETED
        ).group_by(Hotel.id, Hotel.name).all()
        
    elif current_user.user_type == UserType.RESTAURANT_OWNER:
        # Get restaurants owned by user
        restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
        restaurant_ids = [restaurant.id for restaurant in restaurants]
        
        # Revenue by restaurant
        revenue_by_hotel = db.query(
            Restaurant.name,
            func.sum(Booking.total_amount).label('revenue')
        ).join(Booking).filter(
            Booking.restaurant_id.in_(restaurant_ids),
            Booking.created_at >= cutoff_date,
            Booking.payment_status == PaymentStatus.COMPLETED
        ).group_by(Restaurant.id, Restaurant.name).all()
        
    else:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "revenue_breakdown": [
            {"name": r.name, "revenue": float(r.revenue or 0)} 
            for r in revenue_by_hotel
        ]
    }
