import mongoose from "mongoose";
import { Test } from "../models/Test.js";

/**
 * Ensures the MongoDB connection string includes the database name "SPS_database"
 * Handles both Atlas (mongodb+srv://) and local (mongodb://) connection strings
 */
const getConnectionURI = () => {
  const uri = process.env.MONGO_URI;
  const dbName = "SPS_database";

  if (!uri) {
    // Fallback to local MongoDB with explicit database name
    return "mongodb://127.0.0.1:27017/SPS_database";
  }

  // Parse the URI to handle database name correctly
  // MongoDB URI format: mongodb+srv://user:pass@host/dbname?options
  // or: mongodb://user:pass@host:port/dbname?options

  try {
    // Check if URI already has a database name in the path
    const urlPattern = /^(mongodb\+srv:\/\/|mongodb:\/\/)([^\/]+)(\/[^?]*)?(\?.*)?$/;
    const match = uri.match(urlPattern);

    if (match) {
      const protocol = match[1]; // mongodb+srv:// or mongodb://
      const credentialsAndHost = match[2]; // user:pass@host or user:pass@host:port
      const existingDbPath = match[3]; // /existingdb or undefined
      const queryString = match[4] || ""; // ?options or empty

      // Always use our specified database name
      return `${protocol}${credentialsAndHost}/${dbName}${queryString}`;
    }

    // Fallback: if pattern doesn't match, try simple string manipulation
    if (uri.includes("?")) {
      const [baseUri, queryString] = uri.split("?");
      // Remove any existing database path and add our database name
      const baseWithoutDb = baseUri.replace(/\/[^\/]*$/, "");
      return `${baseWithoutDb}/${dbName}?${queryString}`;
    } else {
      // Remove any existing database path and add our database name
      const baseWithoutDb = uri.replace(/\/[^\/]*$/, "");
      return `${baseWithoutDb}/${dbName}`;
    }
  } catch (error) {
    // If parsing fails, append database name (simple fallback)
    console.warn("⚠️  Could not parse MONGO_URI, using simple append method");
    const separator = uri.endsWith("/") ? "" : "/";
    return `${uri}${separator}${dbName}`;
  }
};

/**
 * Check if MongoDB is connected
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Connects to MongoDB Atlas or local MongoDB instance
 * Creates database and collection automatically on first connection
 */
export const connectDB = async () => {
  // Check if already connected
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Check if connection is in progress
  if (mongoose.connection.readyState === 2) {
    return new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
  }

  const uri = getConnectionURI();
  const dbName = "SPS_database";

  const options = {
    dbName: dbName,
    autoIndex: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(uri, options);

    // Connection event handlers
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    // Verify connection
    const connectionState = mongoose.connection.readyState;
    if (connectionState === 1) {
      console.log("✅ MongoDB connected");
    } else {
      throw new Error(`Unexpected connection state: ${connectionState}`);
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(`   Error: ${error.message}`);
    
    // Provide helpful error messages based on error type
    if (error.name === "MongoServerSelectionError") {
      console.error("   💡 Tip: Check if MongoDB is running or if the connection string is correct");
    } else if (error.name === "MongoAuthenticationError") {
      console.error("   💡 Tip: Verify your MongoDB credentials in MONGO_URI");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("   💡 Tip: Check your network connection and MongoDB server address");
    }
    
    console.error("\n🔧 Connection details:");
    console.error(`   URI: ${uri.replace(/:[^:@]+@/, ":****@")}`); // Hide password in logs
    console.error(`   Database: ${dbName}`);
    
    process.exit(1);
  }
};

