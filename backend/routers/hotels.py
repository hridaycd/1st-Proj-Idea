from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Hotel, Room, User, UserType
from schemas import HotelCreate, HotelResponse, RoomCreate, RoomResponse, HotelSearch
from routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=HotelResponse)
async def create_hotel(
    hotel: HotelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.HOTEL_OWNER:
        raise HTTPException(status_code=403, detail="Only hotel owners can create hotels")
    
    db_hotel = Hotel(
        **hotel.dict(),
        owner_id=current_user.id
    )
    
    db.add(db_hotel)
    db.commit()
    db.refresh(db_hotel)
    
    return db_hotel

@router.get("/", response_model=List[HotelResponse])
async def get_hotels(
    skip: int = 0,
    limit: int = 100,
    city: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Hotel).filter(Hotel.is_active == True)
    
    if city:
        query = query.filter(Hotel.city.ilike(f"%{city}%"))
    
    hotels = query.offset(skip).limit(limit).all()
    return hotels

@router.get("/search", response_model=List[HotelResponse])
async def search_hotels(
    search: HotelSearch,
    db: Session = Depends(get_db)
):
    query = db.query(Hotel).filter(Hotel.is_active == True)
    
    if search.city:
        query = query.filter(Hotel.city.ilike(f"%{search.city}%"))
    
    if search.min_price or search.max_price:
        # Join with rooms to filter by price
        query = query.join(Room).filter(Room.is_available == True)
        
        if search.min_price:
            query = query.filter(Room.price_per_night >= search.min_price)
        
        if search.max_price:
            query = query.filter(Room.price_per_night <= search.max_price)
    
    hotels = query.distinct().all()
    return hotels

@router.get("/{hotel_id}", response_model=HotelResponse)
async def get_hotel(
    hotel_id: int,
    db: Session = Depends(get_db)
):
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    return hotel

@router.put("/{hotel_id}", response_model=HotelResponse)
async def update_hotel(
    hotel_id: int,
    hotel_update: HotelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hotel = db.query(Hotel).filter(
        Hotel.id == hotel_id,
        Hotel.owner_id == current_user.id
    ).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    for field, value in hotel_update.dict().items():
        setattr(hotel, field, value)
    
    db.commit()
    db.refresh(hotel)
    
    return hotel

@router.delete("/{hotel_id}")
async def delete_hotel(
    hotel_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hotel = db.query(Hotel).filter(
        Hotel.id == hotel_id,
        Hotel.owner_id == current_user.id
    ).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    hotel.is_active = False
    db.commit()
    
    return {"message": "Hotel deactivated successfully"}

# Room management endpoints
@router.post("/{hotel_id}/rooms", response_model=RoomResponse)
async def create_room(
    hotel_id: int,
    room: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify hotel ownership
    hotel = db.query(Hotel).filter(
        Hotel.id == hotel_id,
        Hotel.owner_id == current_user.id
    ).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    db_room = Room(
        **room.dict(),
        hotel_id=hotel_id
    )
    
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    
    return db_room

@router.get("/{hotel_id}/rooms", response_model=List[RoomResponse])
async def get_hotel_rooms(
    hotel_id: int,
    db: Session = Depends(get_db)
):
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    rooms = db.query(Room).filter(Room.hotel_id == hotel_id).all()
    return rooms

@router.get("/{hotel_id}/rooms/available", response_model=List[RoomResponse])
async def get_available_rooms(
    hotel_id: int,
    check_in: datetime,
    check_out: datetime,
    db: Session = Depends(get_db)
):
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Get all rooms for the hotel
    all_rooms = db.query(Room).filter(Room.hotel_id == hotel_id).all()
    
    # Filter available rooms
    available_rooms = []
    for room in all_rooms:
        if room.is_available:
            # Check for conflicting bookings
            conflicting_booking = db.query(Booking).filter(
                Booking.room_id == room.id,
                Booking.status.in_(["pending", "confirmed"]),
                Booking.check_in_date < check_out,
                Booking.check_out_date > check_in
            ).first()
            
            if not conflicting_booking:
                available_rooms.append(room)
    
    return available_rooms

@router.put("/{hotel_id}/rooms/{room_id}", response_model=RoomResponse)
async def update_room(
    hotel_id: int,
    room_id: int,
    room_update: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify hotel ownership
    hotel = db.query(Hotel).filter(
        Hotel.id == hotel_id,
        Hotel.owner_id == current_user.id
    ).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.hotel_id == hotel_id
    ).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    for field, value in room_update.dict().items():
        setattr(room, field, value)
    
    db.commit()
    db.refresh(room)
    
    return room

@router.delete("/{hotel_id}/rooms/{room_id}")
async def delete_room(
    hotel_id: int,
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify hotel ownership
    hotel = db.query(Hotel).filter(
        Hotel.id == hotel_id,
        Hotel.owner_id == current_user.id
    ).first()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.hotel_id == hotel_id
    ).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room.is_available = False
    db.commit()
    
    return {"message": "Room deactivated successfully"}
