import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret";

// UPDATED: Checks Cookies AND Authorization Headers
function getUserFromToken(req) {
  try {
    // 1. Try to get token from cookies
    let token = req.cookies.get("token")?.value;

    // 2. If not found, try to get it from the Authorization header (Bearer token)
    if (!token) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) return null;

    // 3. Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // DEBUGGING: Check your server terminal to see if role is present!
    console.log("✅ Decoded User Payload:", decoded); 

    return decoded;
  } catch (error) {
    console.error("❌ Token Verification Error:", error.message);
    return null;
  }
}

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams?.id;

    if (!productId) {
      return NextResponse.json(
        { error: "Product id is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { product },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get product error:", error);

    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams?.id;

    if (!productId) {
      return NextResponse.json(
        { error: "Product id is required" },
        { status: 400 }
      );
    }

    const user = getUserFromToken(req);

    // CHECK HERE: If user is null or role is missing, it will throw 403
    if (!user || user.role !== "admin") {
      console.log("❌ Access Denied. User:", user);
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      name,
      description,
      price,
      category,
      subcategory,
      subsubcategory,
      stock,
      images,
    } = body;

    await connectDB();

    const product = await Product.findById(productId);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Basic product information
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);

    // Category hierarchy
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (subsubcategory !== undefined) product.subsubcategory = subsubcategory;

    // Inventory
    if (stock !== undefined) product.stock = Number(stock);

    // Images
    if (Array.isArray(images)) {
      product.images = images;
    }

    await product.save();

    return NextResponse.json(
      {
        message: "Product updated successfully",
        product,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams?.id;

    if (!productId) {
      return NextResponse.json(
        { error: "Product id is required" },
        { status: 400 }
      );
    }

    const user = getUserFromToken(req);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const product =
      await Product.findByIdAndDelete(productId);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Product deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}