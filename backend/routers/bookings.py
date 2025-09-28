from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import uuid

from database import get_db
from models import Booking, User, Hotel, Restaurant, Room, Table, BookingStatus, PaymentStatus
from schemas import HotelBookingCreate, RestaurantBookingCreate, BookingResponse
from routers.auth import get_current_user, generate_booking_reference
from websocket_manager import ConnectionManager
from notification_service import NotificationService

router = APIRouter()
notification_service = NotificationService()

# This would be injected from main.py in a real application
manager = ConnectionManager()

@router.post("/hotel", response_model=BookingResponse)
async def create_hotel_booking(
    booking: HotelBookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify hotel and room exist
    hotel = db.query(Hotel).filter(Hotel.id == booking.hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    room = db.query(Room).filter(
        Room.id == booking.room_id,
        Room.hotel_id == booking.hotel_id
    ).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Check room availability
    if not room.is_available:
        raise HTTPException(status_code=400, detail="Room not available")
    
    # Check for conflicting bookings
    conflicting_booking = db.query(Booking).filter(
        Booking.room_id == booking.room_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.check_in_date < booking.check_out_date,
        Booking.check_out_date > booking.check_in_date
    ).first()
    
    if conflicting_booking:
        raise HTTPException(status_code=400, detail="Room not available for selected dates")
    
    # Calculate total amount
    nights = (booking.check_out_date - booking.check_in_date).days
    total_amount = room.price_per_night * nights
    
    # Create booking
    booking_reference = generate_booking_reference()
    db_booking = Booking(
        booking_reference=booking_reference,
        customer_id=current_user.id,
        hotel_id=booking.hotel_id,
        room_id=booking.room_id,
        check_in_date=booking.check_in_date,
        check_out_date=booking.check_out_date,
        guest_count=booking.guest_count,
        guest_name=booking.guest_name,
        guest_phone=booking.guest_phone,
        special_requests=booking.special_requests,
        total_amount=total_amount,
        status=BookingStatus.PENDING
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Send notifications
    await notification_service.send_booking_confirmation(db_booking, current_user)
    
    # Broadcast real-time update
    await manager.broadcast_booking_update(
        BookingResponse.from_orm(db_booking).dict(),
        hotel_id=booking.hotel_id
    )
    
    return db_booking

@router.post("/restaurant", response_model=BookingResponse)
async def create_restaurant_booking(
    booking: RestaurantBookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify restaurant and table exist
    restaurant = db.query(Restaurant).filter(Restaurant.id == booking.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    table = db.query(Table).filter(
        Table.id == booking.table_id,
        Table.restaurant_id == booking.restaurant_id
    ).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Check table availability
    if not table.is_available:
        raise HTTPException(status_code=400, detail="Table not available")
    
    # Check for conflicting bookings
    booking_end_time = booking.booking_time + timedelta(hours=booking.duration_hours)
    conflicting_booking = db.query(Booking).filter(
        Booking.table_id == booking.table_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.booking_time < booking_end_time,
        Booking.booking_time + timedelta(hours=Booking.duration_hours) > booking.booking_time
    ).first()
    
    if conflicting_booking:
        raise HTTPException(status_code=400, detail="Table not available for selected time")
    
    # Calculate total amount (you might want to add pricing logic here)
    total_amount = 0.0  # Free booking for now, can be extended
    
    # Create booking
    booking_reference = generate_booking_reference()
    db_booking = Booking(
        booking_reference=booking_reference,
        customer_id=current_user.id,
        restaurant_id=booking.restaurant_id,
        table_id=booking.table_id,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        duration_hours=booking.duration_hours,
        guest_count=booking.guest_count,
        guest_name=booking.guest_name,
        guest_phone=booking.guest_phone,
        special_requests=booking.special_requests,
        total_amount=total_amount,
        status=BookingStatus.PENDING
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    # Send notifications
    await notification_service.send_booking_confirmation(db_booking, current_user)
    
    # Broadcast real-time update
    await manager.broadcast_booking_update(
        BookingResponse.from_orm(db_booking).dict(),
        restaurant_id=booking.restaurant_id
    )
    
    return db_booking

@router.get("/my-bookings", response_model=List[BookingResponse])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bookings = db.query(Booking).filter(
        Booking.customer_id == current_user.id
    ).order_by(Booking.created_at.desc()).all()
    
    return bookings

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.customer_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return booking

@router.put("/{booking_id}/cancel")
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.customer_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status == BookingStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    
    if booking.status == BookingStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel completed booking")
    
    # Check cancellation policy (e.g., can't cancel within 24 hours)
    if booking.check_in_date and booking.check_in_date <= datetime.now() + timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Cannot cancel booking within 24 hours of check-in")
    
    booking.status = BookingStatus.CANCELLED
    db.commit()
    
    # Send cancellation notification
    await notification_service.send_booking_cancellation(booking, current_user)
    
    # Broadcast real-time update
    if booking.hotel_id:
        await manager.broadcast_booking_update(
            BookingResponse.from_orm(booking).dict(),
            hotel_id=booking.hotel_id
        )
    elif booking.restaurant_id:
        await manager.broadcast_booking_update(
            BookingResponse.from_orm(booking).dict(),
            restaurant_id=booking.restaurant_id
        )
    
    return {"message": "Booking cancelled successfully"}

@router.get("/owner/{owner_type}")
async def get_owner_bookings(
    owner_type: str,  # "hotel" or "restaurant"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if owner_type == "hotel":
        if current_user.user_type != UserType.HOTEL_OWNER:
            raise HTTPException(status_code=403, detail="Access denied")
        
        hotels = db.query(Hotel).filter(Hotel.owner_id == current_user.id).all()
        hotel_ids = [hotel.id for hotel in hotels]
        
        bookings = db.query(Booking).filter(
            Booking.hotel_id.in_(hotel_ids)
        ).order_by(Booking.created_at.desc()).all()
        
    elif owner_type == "restaurant":
        if current_user.user_type != UserType.RESTAURANT_OWNER:
            raise HTTPException(status_code=403, detail="Access denied")
        
        restaurants = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).all()
        restaurant_ids = [restaurant.id for restaurant in restaurants]
        
        bookings = db.query(Booking).filter(
            Booking.restaurant_id.in_(restaurant_ids)
        ).order_by(Booking.created_at.desc()).all()
        
    else:
        raise HTTPException(status_code=400, detail="Invalid owner type")
    
    return bookings
