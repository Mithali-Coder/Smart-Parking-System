# IoT Sensor Integration Guide

## Overview
Complete IoT sensor integration module for Smart Parking System with real-time monitoring and configuration dashboard.

---

## Backend Implementation

### 1. Server Configuration
✅ Server now listens on `0.0.0.0` for local network access
```javascript
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Slot Model Updates
✅ Added `sensorConnected` field to track sensor health
```javascript
{
  sensorConnected: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now }
}
```

### 3. API Endpoints

#### ESP32 Sensor Endpoints (No Authentication)
```
POST /api/sensor/update
Body: {
  "sensorId": "SENSOR_001",
  "distance": 45,
  "status": "OCCUPIED",
  "apiKey": "sps_sensor_secret_2024"
}

GET /api/sensor/ping
Response: { "success": true, "message": "SPS Sensor API online" }

GET /api/sensor/status/:sensorId?apiKey=xxx
Response: { "success": true, "sensorId": "...", "status": "FREE" }
```

#### Config Module Endpoints
```
GET /api/sensor/slots
Response: {
  "success": true,
  "count": 25,
  "slots": [...]
}

POST /api/sensor/simulate
Body: {
  "slotId": "A1",
  "status": "OCCUPIED"
}
```

### 4. Sensor Health Monitoring
✅ Background job runs every 10 seconds
- Marks sensors as disconnected if no update for 30 seconds
- Automatic timeout detection

### 5. Features
- ✅ Idempotent updates (prevents duplicate processing)
- ✅ Status change detection
- ✅ Automatic booking info clearing when car leaves
- ✅ Sensor connectivity tracking
- ✅ Health timeout system

---

## Frontend Implementation

### 1. SuperAdmin Sidebar
✅ Added "Config Module" menu item with Settings icon

### 2. Config Module Dashboard (`/superadmin/config-module`)

#### Features:
- **Real-time monitoring** - Auto-refresh every 3 seconds
- **Stats cards** - Total slots, connected sensors, free/occupied counts
- **Sensor status table** with:
  - Slot ID
  - Parking/Level info
  - Color-coded status (Green=FREE, Red=OCCUPIED, Blue=RESERVED)
  - Sensor connectivity (Connected/Disconnected)
  - Last update timestamp
  - Simulate buttons

#### Color Coding:
- 🟢 **Green** → FREE/AVAILABLE
- 🔴 **Red** → OCCUPIED/BOOKED
- 🔵 **Blue** → RESERVED/PENDING
- ⚫ **Gray** → BLOCKED

#### Simulation:
- "Occupied" button - Simulates car arrival
- "Free" button - Simulates car departure
- Instant feedback with loading states

---

## Testing Without Hardware

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Login as Super Admin
- Navigate to `http://localhost:5173`
- Login with super admin credentials
- Go to "Config Module" in sidebar

### 4. Simulate Sensor Updates
Click "Occupied" or "Free" buttons to test real-time updates

### 5. Test API Directly
```bash
# Simulate sensor update
curl -X POST http://localhost:5000/api/sensor/simulate \
  -H "Content-Type: application/json" \
  -d '{"slotId":"A1","status":"OCCUPIED"}'

# Get all slots
curl http://localhost:5000/api/sensor/slots
```

---

## ESP32 Integration

### 1. Configure ESP32
Update your Arduino code with:
```cpp
const char* serverIP = "YOUR_COMPUTER_IP"; // e.g., "192.168.1.100"
const int serverPort = 5000;
const char* sensorId = "SENSOR_001";
const char* apiKey = "sps_sensor_secret_2024";
```

### 2. Map Sensor to Slot
In MongoDB, update a slot document:
```javascript
db.slots.updateOne(
  { slotId: "A1" },
  { $set: { sensorId: "SENSOR_001" } }
)
```

### 3. ESP32 Sends Updates
```cpp
// POST to http://YOUR_IP:5000/api/sensor/update
{
  "sensorId": "SENSOR_001",
  "distance": 45,
  "apiKey": "sps_sensor_secret_2024"
}
```

### 4. Distance Logic
- **< 50cm** → OCCUPIED (car detected)
- **> 70cm** → FREE (no car)
- **50-70cm** → Hysteresis zone (keep current status)

---

## Environment Variables

Add to `backend/.env`:
```env
PORT=5000
SENSOR_API_KEY=sps_sensor_secret_2024
RELEASE_CHECK_MINUTES=1
```

---

## Architecture

```
┌─────────────┐
│   ESP32     │ ──POST──> /api/sensor/update
│  (Sensor)   │
└─────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Express Server              │
│  - Validates API key                │
│  - Updates slot status              │
│  - Sets sensorConnected = true      │
│  - Updates lastUpdated timestamp    │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│      MongoDB (Slot Model)           │
│  - status: FREE/OCCUPIED            │
│  - sensorConnected: true/false      │
│  - lastUpdated: Date                │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Background Job (every 10s)        │
│  - Checks lastUpdated               │
│  - If > 30s → sensorConnected=false │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   React Config Module               │
│  - Fetches /api/sensor/slots        │
│  - Auto-refresh every 3s            │
│  - Shows real-time status           │
│  - Simulate buttons for testing     │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### Sensor Not Connecting
1. Check ESP32 has correct server IP
2. Verify API key matches `.env` file
3. Ensure slot has `sensorId` field set
4. Check firewall allows port 5000

### Sensor Shows Disconnected
1. Check if ESP32 is sending updates
2. Verify updates are within 30-second window
3. Check MongoDB `lastUpdated` field
4. Review server logs for errors

### Simulation Not Working
1. Verify backend is running
2. Check browser console for errors
3. Ensure slot exists with correct `slotId`
4. Check network tab for API responses

---

## Security Notes

- ✅ Sensor endpoints require API key
- ✅ Config Module requires Super Admin role
- ✅ Simulation endpoint for testing only
- ⚠️ In production, consider:
  - HTTPS for sensor communication
  - Rate limiting on sensor endpoints
  - IP whitelisting for sensors
  - Disable simulation endpoint

---

## Next Steps

1. ✅ Backend sensor API - DONE
2. ✅ Frontend Config Module - DONE
3. ✅ Sensor health monitoring - DONE
4. ✅ Simulation for testing - DONE
5. 🔄 Deploy ESP32 sensors
6. 🔄 Map sensors to slots
7. 🔄 Monitor in production

---

## Support

For issues or questions:
1. Check server logs: `npm run dev`
2. Check browser console
3. Review MongoDB slot documents
4. Test with simulation buttons first
