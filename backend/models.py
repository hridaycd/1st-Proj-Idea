from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserType(enum.Enum):
    CUSTOMER = "customer"
    HOTEL_OWNER = "hotel_owner"
    RESTAURANT_OWNER = "restaurant_owner"
    ADMIN = "admin"

class BookingStatus(enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class PaymentStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    user_type = Column(Enum(UserType), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    hotels = relationship("Hotel", back_populates="owner")
    restaurants = relationship("Restaurant", back_populates="owner")
    bookings = relationship("Booking", back_populates="customer")

class Hotel(Base):
    __tablename__ = "hotels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    phone = Column(String, nullable=False)
    email = Column(String)
    website = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="hotels")
    rooms = relationship("Room", back_populates="hotel")
    bookings = relationship("Booking", back_populates="hotel")

class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    phone = Column(String, nullable=False)
    email = Column(String)
    website = Column(String)
    cuisine_type = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="restaurants")
    tables = relationship("Table", back_populates="restaurant")
    bookings = relationship("Booking", back_populates="restaurant")

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, nullable=False)
    room_type = Column(String, nullable=False)  # Single, Double, Suite, etc.
    capacity = Column(Integer, nullable=False)
    price_per_night = Column(Float, nullable=False)
    amenities = Column(Text)  # JSON string of amenities
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    hotel = relationship("Hotel", back_populates="rooms")
    bookings = relationship("Booking", back_populates="room")

class Table(Base):
    __tablename__ = "tables"
    
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    location = Column(String)  # Indoor, Outdoor, VIP, etc.
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    restaurant = relationship("Restaurant", back_populates="tables")
    bookings = relationship("Booking", back_populates="table")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    
    # Booking details
    check_in_date = Column(DateTime, nullable=True)  # For hotels
    check_out_date = Column(DateTime, nullable=True)  # For hotels
    booking_date = Column(DateTime, nullable=True)  # For restaurants
    booking_time = Column(DateTime, nullable=True)  # For restaurants
    duration_hours = Column(Integer, nullable=True)  # For restaurants
    
    # Guest details
    guest_count = Column(Integer, nullable=False)
    guest_name = Column(String, nullable=False)
    guest_phone = Column(String, nullable=False)
    special_requests = Column(Text)
    
    # Status and pricing
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    total_amount = Column(Float, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    customer = relationship("User", back_populates="bookings")
    hotel = relationship("Hotel", back_populates="bookings")
    restaurant = relationship("Restaurant", back_populates="bookings")
    room = relationship("Room", back_populates="bookings")
    table = relationship("Table", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    razorpay_payment_id = Column(String, unique=True, index=True)
    razorpay_order_id = Column(String, unique=True, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_method = Column(String)  # UPI, Card, Net Banking, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    booking = relationship("Booking", back_populates="payments")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, nullable=False)  # SMS, WhatsApp, Email, Push
    status = Column(String, default="pending")  # pending, sent, failed
    sent_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    booking = relationship("Booking")
