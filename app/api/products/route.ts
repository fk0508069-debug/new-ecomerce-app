import { NextResponse, NextRequest } from "next/server";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

const JWT_SECRET =
  process.env.JWT_SECRET || "default_jwt_secret";

// ============================================================
// CACHE
// ============================================================

type CacheEntry = {
  data: {
    products: any[];
    count: number;
  };
  expiresAt: number;
};

const productCache = new Map<string, CacheEntry>();

// Cache products for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;

// ============================================================
// JWT PAYLOAD INTERFACE
// ============================================================

interface JwtPayloadWithRole extends jwt.JwtPayload {
  role: string;
}

// ============================================================
// AUTH
// ============================================================

function getUserFromToken(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ============================================================
// ESCAPE REGEX
// ============================================================

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================
// CACHE KEY
// ============================================================

function createCacheKey(
  category: string | null,
  subcategory: string | null,
  subsubcategory: string | null,
  hero: string | null,
  limit: number
) {
  return JSON.stringify({
    category,
    subcategory,
    subsubcategory,
    hero,
    limit,
  });
}

// ============================================================
// GET PRODUCTS
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");
    const subsubcategory =
      searchParams.get("subsubcategory");

    const hero = searchParams.get("hero");

    const limit = Math.min(
      Math.max(
        1,
        parseInt(
          searchParams.get("limit") || "20",
          10
        )
      ),
      100
    );

    // ========================================================
    // CREATE CACHE KEY
    // ========================================================

    const cacheKey = createCacheKey(
      category,
      subcategory,
      subsubcategory,
      hero,
      limit
    );

    // ========================================================
    // CHECK CACHE
    // ========================================================

    const cached = productCache.get(cacheKey);

    if (
      cached &&
      cached.expiresAt > Date.now()
    ) {
      console.log(
        "PRODUCT CACHE HIT:",
        cacheKey
      );

      return NextResponse.json(
        cached.data,
        {
          status: 200,
          headers: {
            "X-Product-Cache": "HIT",
          },
        }
      );
    }

    // Remove expired cache
    if (cached) {
      productCache.delete(cacheKey);
    }

    console.log(
      "PRODUCT CACHE MISS:",
      cacheKey
    );

    // ========================================================
    // CONNECT DATABASE
    // ========================================================

    await connectDB();

    // ========================================================
    // BUILD FILTER
    // ========================================================

    const filter: Record<string, any> = {};

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

    // ========================================================
    // HERO PRODUCTS
    // ========================================================

    if (hero === "true") {
      filter.isHero = true;
    }

    // ========================================================
    // MONGODB QUERY
    // ========================================================

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const responseData = {
      products,
      count: products.length,
    };

    // ========================================================
    // STORE IN CACHE
    // ========================================================

    productCache.set(cacheKey, {
      data: responseData,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // ========================================================
    // RETURN
    // ========================================================

    return NextResponse.json(
      responseData,
      {
        status: 200,
        headers: {
          "X-Product-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}

// ============================================================
// CREATE PRODUCT
// ============================================================

export async function POST(req: NextRequest) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const user = getUserFromToken(req) as JwtPayloadWithRole | null;

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        {
          error: "Admin access required",
        },
        {
          status: 403,
        }
      );
    }

    // ========================================================
    // BODY
    // ========================================================

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
      isHero,
    } = body;

    // ========================================================
    // VALIDATION
    // ========================================================

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
        {
          status: 400,
        }
      );
    }

    if (
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one product image is required",
        },
        {
          status: 400,
        }
      );
    }

    const productPrice = Number(price);

    if (
      !Number.isFinite(productPrice) ||
      productPrice <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Valid product price is required",
        },
        {
          status: 400,
        }
      );
    }

    const productStock = Number(
      stock ?? 0
    );

    if (
      !Number.isFinite(productStock) ||
      productStock < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Stock must be a valid number greater than or equal to 0",
        },
        {
          status: 400,
        }
      );
    }

    // ========================================================
    // DATABASE
    // ========================================================

    await connectDB();

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: productPrice,
      category: category.trim(),
      subcategory: subcategory.trim(),
      subsubcategory:
        subsubcategory.trim(),
      stock: productStock,
      images,
      isHero: isHero === true,
    });

    // ========================================================
    // CLEAR CACHE
    // ========================================================

    productCache.clear();

    console.log(
      "PRODUCT CACHE CLEARED AFTER CREATE"
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        message:
          "Product created successfully",
        product,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "Create product error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}