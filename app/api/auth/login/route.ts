import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const ADMIN_EMAILS = ["fk123456@gmail.com"];

export async function POST(req: Request) {
    
  try {
    const { email, password } = await req.json();
    
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Please provide both email and password" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 401 }
      );
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const role =
      user.role === "admin" || ADMIN_EMAILS.includes(user.email.toLowerCase())
        ? "admin"
        : user.role;

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role,
        },
      },
      { status: 200 }
    );
    console.log("Login successful for user:", user.email);
    
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge:  24 * 60 * 60,
      path: "/",
      
    });
    
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
  const body = await req.json();
  
  console.log("Received JSON:", body);
  
  return NextResponse.json({
    success: true,
    message: "Login request received",
    data: body,
  });
}

