import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const generateToken = (user) => {
  const payload = { id: user._id, role: user.role };
  const secret = process.env.JWT_SECRET || "dev_secret";
  const expiresIn = "7d";
  return jwt.sign(payload, secret, { expiresIn });
};

export const login = async (req, res) => {
  console.log("\n🔐 ========== LOGIN REQUEST ==========");
  const { email, password } = req.body;
  
  console.log("📧 Email received:", email);
  console.log("🔑 Password received:", password ? "***" : "MISSING");
  
  if (!email || !password) {
    console.log("❌ Missing email or password");
    console.log("📤 Sending 400 response: Email and password are required");
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    console.log("🔍 Searching for user in database...");
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log("❌ User not found in database for email:", email);
      console.log("📤 Sending 401 response: Invalid email or password");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("✅ User found:", {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    console.log("🔐 Comparing password...");
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log("❌ Password does not match for user:", email);
      console.log("📤 Sending 401 response: Invalid email or password");
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("✅ Password matches!");
    console.log("🎫 Generating JWT token...");
    const token = generateToken(user);
    console.log("✅ Token generated successfully");
    
    console.log("📤 Sending 200 response with token and user data");
    console.log("👤 User role:", user.role);
    console.log("=====================================\n");
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("\n❌ ========== LOGIN ERROR ==========");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=====================================\n");
    res.status(500).json({ message: "Server error during login" });
  }
};

