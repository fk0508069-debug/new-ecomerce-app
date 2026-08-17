import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret";

// ==============================
// AUTH
// ==============================
function getUserFromToken(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) return null;

    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ==============================
// GET PRODUCTS
// Supports:
// /api/products
// /api/products?category=Fashion
// /api/products?category=Fashion&subcategory=Men
// /api/products?category=Fashion&subcategory=Men&subsubcategory=Shirts
// ==============================
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const subsubcategory = searchParams.get("subsubcategory");

    const limit = Math.min(
      Math.max(
        1,
        parseInt(searchParams.get("limit") || "20", 10)
      ),
      100
    );

    const filter = {};

    if (category) {
      filter.category = {
        $regex: `^${escapeRegex(category)}$`,
        $options: "i",
      };
    }

    if (subcategory) {
      filter.subcategory = {
        $regex: `^${escapeRegex(subcategory)}$`,
        $options: "i",
      };
    }

    if (subsubcategory) {
      filter.subsubcategory = {
        $regex: `^${escapeRegex(subsubcategory)}$`,
        $options: "i",
      };
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        products,
        count: products.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get products error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

// ==============================
// CREATE PRODUCT
// ==============================
export async function POST(req) {
  try {
    const user = getUserFromToken(req);

    if (!user || user.role !== "admin") {
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

    if (
      !name?.trim() ||
      !description?.trim() ||
      !category?.trim() ||
      !subcategory?.trim() ||
      !subsubcategory?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Name, description, category, subcategory, and product type are required",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one product image is required" },
        { status: 400 }
      );
    }

    const productPrice = Number(price);

    if (!Number.isFinite(productPrice) || productPrice <= 0) {
      return NextResponse.json(
        { error: "Valid product price is required" },
        { status: 400 }
      );
    }

    const productStock = Number(stock ?? 0);

    if (!Number.isFinite(productStock) || productStock < 0) {
      return NextResponse.json(
        {
          error:
            "Stock must be a valid number greater than or equal to 0",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: productPrice,
      category: category.trim(),
      subcategory: subcategory.trim(),
      subsubcategory: subsubcategory.trim(),
      stock: productStock,
      images,
    });

    return NextResponse.json(
      {
        message: "Product created successfully",
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);

    return NextResponse.json(
      {
        error:
          error?.message || "Failed to create product",
      },
      { status: 500 }
    );
  }
}

// ==============================
// ESCAPE REGEX
// ==============================
function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}