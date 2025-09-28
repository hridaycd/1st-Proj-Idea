from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserType(str, Enum):
    CUSTOMER = "customer"
    HOTEL_OWNER = "hotel_owner"
    RESTAURANT_OWNER = "restaurant_owner"
    ADMIN = "admin"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    phone: str
    name: str
    user_type: UserType

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Hotel Schemas
class HotelBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: str
    email: Optional[str] = None
    website: Optional[str] = None

class HotelCreate(HotelBase):
    pass

class HotelResponse(HotelBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Restaurant Schemas
class RestaurantBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: str
    email: Optional[str] = None
    website: Optional[str] = None
    cuisine_type: Optional[str] = None

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantResponse(RestaurantBase):
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Room Schemas
class RoomBase(BaseModel):
    room_number: str
    room_type: str
    capacity: int
    price_per_night: float
    amenities: Optional[str] = None

class RoomCreate(RoomBase):
    hotel_id: int

class RoomResponse(RoomBase):
    id: int
    hotel_id: int
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Table Schemas
class TableBase(BaseModel):
    table_number: str
    capacity: int
    location: Optional[str] = None

class TableCreate(TableBase):
    restaurant_id: int

class TableResponse(TableBase):
    id: int
    restaurant_id: int
    is_available: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Booking Schemas
class BookingBase(BaseModel):
    guest_count: int
    guest_name: str
    guest_phone: str
    special_requests: Optional[str] = None

class HotelBookingCreate(BookingBase):
    hotel_id: int
    room_id: int
    check_in_date: datetime
    check_out_date: datetime

class RestaurantBookingCreate(BookingBase):
    restaurant_id: int
    table_id: int
    booking_date: datetime
    booking_time: datetime
    duration_hours: int

class BookingResponse(BookingBase):
    id: int
    booking_reference: str
    customer_id: int
    hotel_id: Optional[int] = None
    restaurant_id: Optional[int] = None
    room_id: Optional[int] = None
    table_id: Optional[int] = None
    check_in_date: Optional[datetime] = None
    check_out_date: Optional[datetime] = None
    booking_date: Optional[datetime] = None
    booking_time: Optional[datetime] = None
    duration_hours: Optional[int] = None
    status: BookingStatus
    total_amount: float
    payment_status: PaymentStatus
    created_at: datetime
    
    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    booking_id: int
    amount: float
    currency: str = "INR"

class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    amount: float
    currency: str
    status: PaymentStatus
    payment_method: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Search and Filter Schemas
class HotelSearch(BaseModel):
    city: Optional[str] = None
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    guest_count: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None

class RestaurantSearch(BaseModel):
    city: Optional[str] = None
    cuisine_type: Optional[str] = None
    booking_date: Optional[datetime] = None
    booking_time: Optional[datetime] = None
    guest_count: Optional[int] = None

# Analytics Schemas
class BookingAnalytics(BaseModel):
    total_bookings: int
    confirmed_bookings: int
    cancelled_bookings: int
    total_revenue: float
    average_booking_value: float
    booking_trends: List[dict]

class DashboardData(BaseModel):
    today_bookings: int
    pending_bookings: int
    total_revenue_today: float
    occupancy_rate: float
    recent_bookings: List[BookingResponse]
