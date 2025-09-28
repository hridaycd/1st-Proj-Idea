from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Restaurant, Table, User, UserType
from schemas import RestaurantCreate, RestaurantResponse, TableCreate, TableResponse, RestaurantSearch
from routers.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=RestaurantResponse)
async def create_restaurant(
    restaurant: RestaurantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.RESTAURANT_OWNER:
        raise HTTPException(status_code=403, detail="Only restaurant owners can create restaurants")
    
    db_restaurant = Restaurant(
        **restaurant.dict(),
        owner_id=current_user.id
    )
    
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    
    return db_restaurant

@router.get("/", response_model=List[RestaurantResponse])
async def get_restaurants(
    skip: int = 0,
    limit: int = 100,
    city: Optional[str] = None,
    cuisine_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Restaurant).filter(Restaurant.is_active == True)
    
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))
    
    if cuisine_type:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine_type}%"))
    
    restaurants = query.offset(skip).limit(limit).all()
    return restaurants

@router.get("/search", response_model=List[RestaurantResponse])
async def search_restaurants(
    search: RestaurantSearch,
    db: Session = Depends(get_db)
):
    query = db.query(Restaurant).filter(Restaurant.is_active == True)
    
    if search.city:
        query = query.filter(Restaurant.city.ilike(f"%{search.city}%"))
    
    if search.cuisine_type:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{search.cuisine_type}%"))
    
    restaurants = query.all()
    return restaurants

@router.get("/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    return restaurant

@router.put("/{restaurant_id}", response_model=RestaurantResponse)
async def update_restaurant(
    restaurant_id: int,
    restaurant_update: RestaurantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == current_user.id
    ).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    for field, value in restaurant_update.dict().items():
        setattr(restaurant, field, value)
    
    db.commit()
    db.refresh(restaurant)
    
    return restaurant

@router.delete("/{restaurant_id}")
async def delete_restaurant(
    restaurant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == current_user.id
    ).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    restaurant.is_active = False
    db.commit()
    
    return {"message": "Restaurant deactivated successfully"}

# Table management endpoints
@router.post("/{restaurant_id}/tables", response_model=TableResponse)
async def create_table(
    restaurant_id: int,
    table: TableCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify restaurant ownership
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == current_user.id
    ).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    db_table = Table(
        **table.dict(),
        restaurant_id=restaurant_id
    )
    
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    
    return db_table

@router.get("/{restaurant_id}/tables", response_model=List[TableResponse])
async def get_restaurant_tables(
    restaurant_id: int,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    tables = db.query(Table).filter(Table.restaurant_id == restaurant_id).all()
    return tables

@router.get("/{restaurant_id}/tables/available", response_model=List[TableResponse])
async def get_available_tables(
    restaurant_id: int,
    booking_date: datetime,
    booking_time: datetime,
    duration_hours: int = 2,
    guest_count: int = 1,
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Get all tables for the restaurant
    all_tables = db.query(Table).filter(Table.restaurant_id == restaurant_id).all()
    
    # Filter available tables
    available_tables = []
    booking_end_time = booking_time + timedelta(hours=duration_hours)
    
    for table in all_tables:
        if table.is_available and table.capacity >= guest_count:
            # Check for conflicting bookings
            conflicting_booking = db.query(Booking).filter(
                Booking.table_id == table.id,
                Booking.status.in_(["pending", "confirmed"]),
                Booking.booking_time < booking_end_time,
                Booking.booking_time + timedelta(hours=Booking.duration_hours) > booking_time
            ).first()
            
            if not conflicting_booking:
                available_tables.append(table)
    
    return available_tables

@router.put("/{restaurant_id}/tables/{table_id}", response_model=TableResponse)
async def update_table(
    restaurant_id: int,
    table_id: int,
    table_update: TableCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify restaurant ownership
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == current_user.id
    ).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    table = db.query(Table).filter(
        Table.id == table_id,
        Table.restaurant_id == restaurant_id
    ).first()
    
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    for field, value in table_update.dict().items():
        setattr(table, field, value)
    
    db.commit()
    db.refresh(table)
    
    return table

@router.delete("/{restaurant_id}/tables/{table_id}")
async def delete_table(
    restaurant_id: int,
    table_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify restaurant ownership
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.owner_id == current_user.id
    ).first()
    
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    table = db.query(Table).filter(
        Table.id == table_id,
        Table.restaurant_id == restaurant_id
    ).first()
    
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    table.is_available = False
    db.commit()
    
    return {"message": "Table deactivated successfully"}
