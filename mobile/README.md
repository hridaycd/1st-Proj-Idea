# Mobile App (Expo React Native)

This is the mobile client for the project, built with Expo + React Native. It reuses the same FastAPI backend.

## Prerequisites
- Node.js 18+
- Expo CLI (npm i -g expo)
- Android Studio or Xcode (or Expo Go)

## Configure API base URL
Default: http://localhost:8000 (see app.json → expo.extra.apiBaseUrl).
- Real device: use your computer LAN IP, e.g. http://192.168.1.10:8000
- Android emulator: http://10.0.2.2:8000

## Run
```
npm install
npm run start
# press: a (Android) or i (iOS)
```

## Structure
- App.js – entry
- src/contexts/AuthContext.js – auth state
- src/services/api.js – Axios client
- src/navigation/ – stacks and tabs
- src/screens/ – Login, Register, Dashboard, Hotels, Restaurants, Bookings, Profile

## Notes
Auth endpoints used: POST /auth/register, POST /auth/login, GET /auth/me
