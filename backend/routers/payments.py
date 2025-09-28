from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import razorpay
import os
from dotenv import load_dotenv

from database import get_db
from models import Booking, Payment, PaymentStatus, BookingStatus, User
from schemas import PaymentCreate, PaymentResponse
from routers.auth import get_current_user

load_dotenv()

router = APIRouter()

# Razorpay configuration
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
else:
    razorpay_client = None

@router.post("/create-order")
async def create_payment_order(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    # Verify booking exists and belongs to user
    booking = db.query(Booking).filter(
        Booking.id == payment_data.booking_id,
        Booking.customer_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.payment_status == PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Payment already completed")
    
    # Create Razorpay order
    order_data = {
        "amount": int(payment_data.amount * 100),  # Convert to paise
        "currency": payment_data.currency,
        "receipt": f"booking_{booking.booking_reference}",
        "notes": {
            "booking_id": booking.id,
            "customer_id": current_user.id
        }
    }
    
    try:
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Create payment record
        db_payment = Payment(
            booking_id=booking.id,
            razorpay_order_id=razorpay_order["id"],
            amount=payment_data.amount,
            currency=payment_data.currency,
            status=PaymentStatus.PENDING
        )
        
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        
        return {
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "payment_id": db_payment.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment order creation failed: {str(e)}")

@router.post("/verify")
async def verify_payment(
    payment_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    # Get payment record
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.razorpay_order_id.isnot(None)
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
    
    # Verify payment signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": payment.razorpay_order_id,
            "razorpay_payment_id": razorpay_payment_id,
            "razorpay_signature": razorpay_signature
        })
        
        # Update payment status
        payment.razorpay_payment_id = razorpay_payment_id
        payment.status = PaymentStatus.COMPLETED
        payment.payment_method = "razorpay"
        
        # Update booking status
        booking = payment.booking
        booking.payment_status = PaymentStatus.COMPLETED
        booking.status = BookingStatus.CONFIRMED
        
        db.commit()
        
        return {"message": "Payment verified successfully", "status": "success"}
        
    except Exception as e:
        # Payment verification failed
        payment.status = PaymentStatus.FAILED
        db.commit()
        
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.booking.has(customer_id=current_user.id)
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return payment

@router.post("/refund/{payment_id}")
async def refund_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment service not configured")
    
    # Get payment record
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.booking.has(customer_id=current_user.id)
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Only completed payments can be refunded")
    
    if not payment.razorpay_payment_id:
        raise HTTPException(status_code=400, detail="Razorpay payment ID not found")
    
    try:
        # Create refund
        refund_data = {
            "amount": int(payment.amount * 100),  # Convert to paise
            "notes": {
                "reason": "Customer requested refund",
                "booking_id": payment.booking_id
            }
        }
        
        refund = razorpay_client.payment.refund(
            payment.razorpay_payment_id,
            refund_data
        )
        
        # Update payment status
        payment.status = PaymentStatus.REFUNDED
        
        # Update booking status
        booking = payment.booking
        booking.status = BookingStatus.CANCELLED
        
        db.commit()
        
        return {
            "message": "Refund processed successfully",
            "refund_id": refund["id"],
            "refund_amount": refund["amount"] / 100
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refund failed: {str(e)}")

@router.get("/booking/{booking_id}/payments", response_model=List[PaymentResponse])
async def get_booking_payments(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify booking belongs to user
    booking = db.query(Booking).filter(
        Booking.id == booking_id,
        Booking.customer_id == current_user.id
    ).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    payments = db.query(Payment).filter(Payment.booking_id == booking_id).all()
    return payments
