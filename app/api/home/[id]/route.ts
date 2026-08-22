import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";

type TokenPayload = {
  userId?: string;
};

function getUserIdFromToken(req: Request) {
  try {
    const token = req.headers.get("cookie")?.match(/(?:^|; )token=([^;]+)/)?.[1];
    if (!token) return null;

    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return payload.userId || null;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authenticatedUserId = getUserIdFromToken(req);

  if (!authenticatedUserId || authenticatedUserId !== id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const [user, products] = await Promise.all([
      User.findById(id).select("_id name email role").lean(),
      Product.find({}).sort({ createdAt: -1 }).limit(20).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      products,
    });
  } catch (error) {
    console.error("Get home data error:", error);
    return NextResponse.json(
      { error: "Failed to load home data" },
      { status: 500 }
    );
  }
}
