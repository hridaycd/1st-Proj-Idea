from twilio.rest import Client
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from models import Notification, User, Booking
from datetime import datetime
import asyncio
import aiohttp
import json

load_dotenv()

class NotificationService:
    def __init__(self):
        # Twilio configuration for SMS
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        # WhatsApp Business API configuration
        self.whatsapp_token = os.getenv("WHATSAPP_TOKEN")
        self.whatsapp_phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        
        if self.twilio_account_sid and self.twilio_auth_token:
            self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
        else:
            self.twilio_client = None
    
    async def send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS using Twilio"""
        if not self.twilio_client:
            print("Twilio not configured, SMS not sent")
            return False
        
        try:
            message = self.twilio_client.messages.create(
                body=message,
                from_=self.twilio_phone_number,
                to=phone_number
            )
            print(f"SMS sent successfully: {message.sid}")
            return True
        except Exception as e:
            print(f"SMS sending failed: {str(e)}")
            return False
    
    async def send_whatsapp(self, phone_number: str, message: str) -> bool:
        """Send WhatsApp message using WhatsApp Business API"""
        if not self.whatsapp_token or not self.whatsapp_phone_number_id:
            print("WhatsApp not configured, message not sent")
            return False
        
        url = f"https://graph.facebook.com/v17.0/{self.whatsapp_phone_number_id}/messages"
        
        headers = {
            "Authorization": f"Bearer {self.whatsapp_token}",
            "Content-Type": "application/json"
        }
        
        data = {
            "messaging_product": "whatsapp",
            "to": phone_number,
            "type": "text",
            "text": {"body": message}
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, headers=headers, json=data) as response:
                    if response.status == 200:
                        print("WhatsApp message sent successfully")
                        return True
                    else:
                        print(f"WhatsApp sending failed: {response.status}")
                        return False
        except Exception as e:
            print(f"WhatsApp sending failed: {str(e)}")
            return False
    
    async def send_booking_confirmation(self, booking: Booking, user: User):
        """Send booking confirmation notification"""
        if booking.hotel_id:
            # Hotel booking
            message = f"""
🏨 Booking Confirmed!

Reference: {booking.booking_reference}
Hotel: {booking.hotel.name}
Room: {booking.room.room_number}
Check-in: {booking.check_in_date.strftime('%d/%m/%Y')}
Check-out: {booking.check_out_date.strftime('%d/%m/%Y')}
Guests: {booking.guest_count}
Total: ₹{booking.total_amount}

Thank you for choosing us!
            """.strip()
        else:
            # Restaurant booking
            message = f"""
🍽️ Table Reservation Confirmed!

Reference: {booking.booking_reference}
Restaurant: {booking.restaurant.name}
Table: {booking.table.table_number}
Date: {booking.booking_date.strftime('%d/%m/%Y')}
Time: {booking.booking_time.strftime('%H:%M')}
Duration: {booking.duration_hours} hours
Guests: {booking.guest_count}

Thank you for choosing us!
            """.strip()
        
        # Send SMS
        await self.send_sms(booking.guest_phone, message)
        
        # Send WhatsApp
        await self.send_whatsapp(booking.guest_phone, message)
        
        # Store notification in database
        notification = Notification(
            user_id=user.id,
            booking_id=booking.id,
            title="Booking Confirmed",
            message=message,
            notification_type="SMS",
            status="sent"
        )
        # Note: You'll need to add this to your database session
    
    async def send_booking_cancellation(self, booking: Booking, user: User):
        """Send booking cancellation notification"""
        if booking.hotel_id:
            # Hotel booking
            message = f"""
❌ Booking Cancelled

Reference: {booking.booking_reference}
Hotel: {booking.hotel.name}
Room: {booking.room.room_number}
Check-in: {booking.check_in_date.strftime('%d/%m/%Y')}
Check-out: {booking.check_out_date.strftime('%d/%m/%Y')}

Your booking has been cancelled. Refund will be processed within 5-7 business days.
            """.strip()
        else:
            # Restaurant booking
            message = f"""
❌ Table Reservation Cancelled

Reference: {booking.booking_reference}
Restaurant: {booking.restaurant.name}
Table: {booking.table.table_number}
Date: {booking.booking_date.strftime('%d/%m/%Y')}
Time: {booking.booking_time.strftime('%H:%M')}

Your reservation has been cancelled.
            """.strip()
        
        # Send SMS
        await self.send_sms(booking.guest_phone, message)
        
        # Send WhatsApp
        await self.send_whatsapp(booking.guest_phone, message)
    
    async def send_reminder(self, booking: Booking, reminder_type: str = "24h"):
        """Send booking reminder"""
        if reminder_type == "24h":
            if booking.hotel_id:
                message = f"""
⏰ Reminder: Check-in Tomorrow!

Reference: {booking.booking_reference}
Hotel: {booking.hotel.name}
Check-in: {booking.check_in_date.strftime('%d/%m/%Y')}
Check-out: {booking.check_out_date.strftime('%d/%m/%Y')}

We look forward to welcoming you!
                """.strip()
            else:
                message = f"""
⏰ Reminder: Reservation Tomorrow!

Reference: {booking.booking_reference}
Restaurant: {booking.restaurant.name}
Date: {booking.booking_date.strftime('%d/%m/%Y')}
Time: {booking.booking_time.strftime('%H:%M')}

We look forward to serving you!
                """.strip()
        
        # Send SMS
        await self.send_sms(booking.guest_phone, message)
        
        # Send WhatsApp
        await self.send_whatsapp(booking.guest_phone, message)
    
    async def send_payment_confirmation(self, booking: Booking, amount: float):
        """Send payment confirmation"""
        message = f"""
💳 Payment Confirmed!

Reference: {booking.booking_reference}
Amount: ₹{amount}
Payment Method: Online

Your payment has been processed successfully.
        """.strip()
        
        # Send SMS
        await self.send_sms(booking.guest_phone, message)
        
        # Send WhatsApp
        await self.send_whatsapp(booking.guest_phone, message)
