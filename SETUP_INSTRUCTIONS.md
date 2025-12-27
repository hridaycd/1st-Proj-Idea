# Quick Setup Instructions

## ✅ Critical Fixes Completed

All critical issues have been fixed:
1. ✅ Created 6 missing frontend page components
2. ✅ Fixed backend Dockerfile (added curl)
3. ✅ Fixed frontend Dockerfile (npm install and wget for health check)

## 📝 Required Setup Steps

### 1. Create .env File

The `.env` file was not created automatically (it's in .gitignore). You need to create it manually:

```bash
# Copy from example
cp env.example .env

# Or create manually with these minimum required values:
```

Minimum required `.env` file content:
```env
# Database Configuration (use Docker Compose defaults)
DATABASE_URL=postgresql://booking_user:booking_password@postgres:5432/booking_db

# JWT Configuration (IMPORTANT: Change SECRET_KEY!)
SECRET_KEY=your-secret-key-here-change-this-in-production-use-a-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis Configuration (use Docker Compose defaults)
REDIS_URL=redis://redis:6379

# Environment
ENVIRONMENT=development
DEBUG=True

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional (for prototype, can use dummy values):
RAZORPAY_KEY_ID=test-key-id
RAZORPAY_KEY_SECRET=test-key-secret
TWILIO_ACCOUNT_SID=dummy
TWILIO_AUTH_TOKEN=dummy
TWILIO_PHONE_NUMBER=dummy
WHATSAPP_TOKEN=dummy
WHATSAPP_PHONE_NUMBER_ID=dummy
```

**Important**: Generate a secure random string for `SECRET_KEY`. You can use:
```bash
# On Linux/Mac:
openssl rand -hex 32

# On Windows (PowerShell):
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 2. Start the Application

#### Option A: Using Docker Compose (Recommended)
```bash
# Make sure you're in the project root directory
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Access the application:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

#### Option B: Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
# Create .env file in backend directory
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**Database & Redis:**
- Start PostgreSQL and Redis using Docker Compose or install locally
- Update DATABASE_URL and REDIS_URL in .env accordingly

### 3. Verify Installation

1. **Check Backend Health:**
   ```bash
   curl http://localhost:8000/api/health
   # Should return: {"status":"healthy","message":"API is running"}
   ```

2. **Check Database Health:**
   ```bash
   curl http://localhost:8000/api/db-health
   # Should return: {"status":"ok"}
   ```

3. **Access Frontend:**
   - Open http://localhost:3000 in your browser
   - You should see the login page

## 🎯 What's Now Working

✅ All frontend routes are functional (no more missing page errors)
✅ Docker builds will complete successfully
✅ Health checks will work properly
✅ Application can start and run

## ⚠️ Known Limitations (For Prototype)

- **Payments**: Will fail without real Razorpay keys (use test mode keys)
- **Notifications**: SMS/WhatsApp won't work without real API keys (will fail gracefully)
- **Database**: Empty database - you'll need to register users and add hotels/restaurants

## 🚀 Next Steps

1. Create `.env` file` with proper SECRET_KEY
2. Start services using Docker Compose
3. Register a test user
4. Add some hotels/restaurants (via API or create seed data)
5. Test the booking flow

## 📚 Additional Resources

- See `README.md` for full documentation
- API documentation available at http://localhost:8000/docs when backend is running
- Check `docker-compose.yml` for service configuration

