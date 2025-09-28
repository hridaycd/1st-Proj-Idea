# Booking Management System

A comprehensive real-time booking management system for hotels and restaurants built with Python FastAPI backend and React frontend.

## 🚀 Features

### For Customers
- **Real-time Availability**: View live availability of rooms and tables
- **Instant Booking**: Book rooms or reserve tables instantly
- **Multi-channel Notifications**: Receive SMS and WhatsApp confirmations
- **User-friendly Interface**: Simple UI designed for all users including elderly
- **Multi-language Support**: English, Hindi, and regional language support
- **Payment Integration**: Secure payment processing with Razorpay

### For Hotel/Restaurant Owners
- **Management Dashboard**: Comprehensive dashboard to manage bookings and cancellations
- **Availability Management**: Set and update availability manually or automatically
- **Analytics & Insights**: Daily/weekly booking overview with detailed analytics
- **Offline Support**: Offline-first functionality with auto-sync when online
- **Staff Management**: Staff management and reminder systems
- **Real-time Updates**: Live updates on booking status and availability

### Technical Features
- **Real-time Communication**: WebSocket-based real-time updates
- **AI-Powered Recommendations**: Collaborative filtering and time-based personalization
- **Fraud Detection**: ML-powered fraud detection for payments
- **Scalable Architecture**: Microservices-ready architecture
- **API Integrations**: Google Maps, TripAdvisor, Razorpay, Firebase, WebEngage

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis
- **Authentication**: JWT with bcrypt
- **Real-time**: WebSockets
- **Payment**: Razorpay integration
- **Notifications**: Twilio (SMS), WhatsApp Business API
- **AI/ML**: scikit-learn for recommendations

### Frontend
- **Framework**: React 18
- **State Management**: React Query
- **Routing**: React Router v6
- **UI Components**: Custom components with Tailwind CSS
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Notifications**: React Toastify

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Cloud**: AWS ready
- **CI/CD**: GitHub Actions ready
- **Monitoring**: Health checks and logging

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd booking-management-system
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Manual Setup

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Set up environment variables
   cp env.example .env
   # Edit .env with your configuration
   
   # Run database migrations
   alembic upgrade head
   
   # Start the backend
   uvicorn main:app --reload
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb booking_db
   
   # Run migrations
   cd backend
   alembic upgrade head
   ```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/booking_db

# JWT
SECRET_KEY=your-secret-key-here

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Twilio (SMS)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# WhatsApp
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id

# Redis
REDIS_URL=redis://localhost:6379
```

## 📱 API Documentation

The API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/hotels` - List hotels
- `GET /api/restaurants` - List restaurants
- `POST /api/bookings/hotel` - Create hotel booking
- `POST /api/bookings/restaurant` - Create restaurant booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment

## 🏗️ Project Structure

```
booking-management-system/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── database.py            # Database configuration
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas
│   ├── routers/               # API routes
│   │   ├── auth.py
│   │   ├── bookings.py
│   │   ├── hotels.py
│   │   ├── restaurants.py
│   │   ├── payments.py
│   │   └── analytics.py
│   ├── websocket_manager.py   # WebSocket handling
│   ├── notification_service.py # SMS/WhatsApp service
│   ├── ai_recommendations.py  # AI recommendation engine
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React contexts
│   │   └── App.js
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### AWS Deployment

1. **EC2 Setup**
   ```bash
   # Launch EC2 instance
   # Install Docker and Docker Compose
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   sudo usermod -a -G docker ec2-user
   ```

2. **RDS Setup**
   - Create PostgreSQL RDS instance
   - Update DATABASE_URL in environment variables

3. **ElastiCache Setup**
   - Create Redis ElastiCache cluster
   - Update REDIS_URL in environment variables

4. **Deploy**
   ```bash
   git clone <repository-url>
   cd booking-management-system
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📊 Monitoring

- Health checks available at `/api/health`
- Application logs in Docker containers
- Database monitoring with PostgreSQL metrics
- Redis monitoring with Redis metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@bookinghub.com or create an issue in the repository.

## 🔮 Future Enhancements

- **Voice Commands**: Voice command bookings for accessibility
- **Local Tourism**: Tourism suggestions based on booking area
- **Advanced Analytics**: Predictive analytics for demand forecasting
- **Mobile Apps**: Native iOS and Android applications
- **Multi-tenant**: Support for multiple business types
- **Blockchain**: Blockchain-based loyalty programs
