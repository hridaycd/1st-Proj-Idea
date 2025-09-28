from fastapi import WebSocket
from typing import Dict, List
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.room_connections: Dict[str, List[str]] = {}  # room_id -> [client_ids]
        
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        # Remove from room connections
        for room_id, clients in self.room_connections.items():
            if client_id in clients:
                clients.remove(client_id)
                if not clients:
                    del self.room_connections[room_id]
    
    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            websocket = self.active_connections[client_id]
            try:
                await websocket.send_text(message)
            except:
                self.disconnect(client_id)
    
    async def broadcast_to_others(self, message: str, sender_id: str):
        for client_id, websocket in self.active_connections.items():
            if client_id != sender_id:
                try:
                    await websocket.send_text(message)
                except:
                    self.disconnect(client_id)
    
    async def broadcast_to_room(self, message: str, room_id: str, exclude_client: str = None):
        if room_id in self.room_connections:
            for client_id in self.room_connections[room_id]:
                if client_id != exclude_client and client_id in self.active_connections:
                    websocket = self.active_connections[client_id]
                    try:
                        await websocket.send_text(message)
                    except:
                        self.disconnect(client_id)
    
    async def join_room(self, client_id: str, room_id: str):
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        
        if client_id not in self.room_connections[room_id]:
            self.room_connections[room_id].append(client_id)
    
    async def leave_room(self, client_id: str, room_id: str):
        if room_id in self.room_connections and client_id in self.room_connections[room_id]:
            self.room_connections[room_id].remove(client_id)
            if not self.room_connections[room_id]:
                del self.room_connections[room_id]
    
    async def broadcast_booking_update(self, booking_data: dict, hotel_id: int = None, restaurant_id: int = None):
        """Broadcast booking updates to relevant clients"""
        message = json.dumps({
            "type": "booking_update",
            "data": booking_data
        })
        
        if hotel_id:
            await self.broadcast_to_room(message, f"hotel_{hotel_id}")
        
        if restaurant_id:
            await self.broadcast_to_room(message, f"restaurant_{restaurant_id}")
    
    async def broadcast_availability_update(self, availability_data: dict, hotel_id: int = None, restaurant_id: int = None):
        """Broadcast availability updates to relevant clients"""
        message = json.dumps({
            "type": "availability_update",
            "data": availability_data
        })
        
        if hotel_id:
            await self.broadcast_to_room(message, f"hotel_{hotel_id}")
        
        if restaurant_id:
            await self.broadcast_to_room(message, f"restaurant_{restaurant_id}")
