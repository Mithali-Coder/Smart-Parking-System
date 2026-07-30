# Quick Start Guide

## ⚠️ IMPORTANT: Use the correct commands!

**✅ RECOMMENDED:** `npm run dev` (auto-restarts on file changes)  
**✅ ALTERNATIVE:** `npm start` or `npm run server` or `node server`

All commands now work! The `server.js` file in the root imports the actual server from `src/server.js`.

---

## Step 1: Make sure MongoDB is running

The server requires MongoDB to be running. If you see "MongoDB connection error", MongoDB is not running.

### On Windows:
1. Open MongoDB Compass or MongoDB Shell
2. Or start MongoDB service:
   ```powershell
   # If MongoDB is installed as a service:
   net start MongoDB
   ```

### Check if MongoDB is running:
- MongoDB should be accessible at: `mongodb://127.0.0.1:27017`
- You can test by opening MongoDB Compass and connecting to `mongodb://127.0.0.1:27017`

---

## Step 2: Start the backend server

```powershell
cd C:\Users\Rushikesh\OneDrive\Desktop\SPS\backend
npm run dev
```

This will:
- Start the server on `http://localhost:5000`
- Auto-restart on file changes (nodemon)
- Show detailed error messages if something fails

---

## Step 3: Seed the database (first time only)

In a new terminal:

```powershell
cd C:\Users\Rushikesh\OneDrive\Desktop\SPS\backend
npm run seed
```

This creates:
- 20 parking slots
- 1 admin user: `admin@example.com` / `admin123`
- 1 attendant: `attendant@example.com` / `attendant123`
- 2 regular users: `user1@example.com` / `user123` and `user2@example.com` / `user123`

---

## Common Errors & Solutions

### Error: "Cannot find module 'server'"
- **Solution:** Use `npm run dev` instead of `node server`

### Error: "MongoDB connection error"
- **Solution:** Start MongoDB first (see Step 1)

### Error: "EADDRINUSE: address already in use"
- **Solution:** Port 5000 is already in use. Either:
  - Stop the other process using port 5000
  - Change PORT in `.env` file

### Nodemon crashes immediately
- **Solution:** Check MongoDB is running and check the error message in the terminal

---

## Verify it's working

Once the server starts, you should see:
```
MongoDB connected
Server running on port 5000
```

Then test it:
- Open browser: `http://localhost:5000`
- You should see: `{"message":"Smart Parking API is running"}`
