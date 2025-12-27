from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
import os
from dotenv import load_dotenv
from sqlalchemy import text

from database import get_db, engine
from models import Base
from routers import auth, bookings, hotels, restaurants, payments, analytics
from websocket_manager import ConnectionManager
from ai_recommendations import RecommendationEngine

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Booking Management System",
    description="Real-time booking system for hotels and restaurants",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-frontend.com",
        "https://your-mobile-app.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket manager
manager = ConnectionManager()

# AI Recommendation Engine
recommendation_engine = RecommendationEngine()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(hotels.router, prefix="/api/hotels", tags=["Hotels"])
app.include_router(restaurants.router, prefix="/api/restaurants", tags=["Restaurants"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
async def root():
    return {"message": "Booking Management System API"}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle real-time updates
            await manager.broadcast_to_others(data, client_id)
    except WebSocketDisconnect:
        manager.disconnect(client_id)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

@app.get("/api/db-health")
async def db_health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "detail": str(e)}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
