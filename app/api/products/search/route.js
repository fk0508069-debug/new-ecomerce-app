import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

// ======================================================
// ESCAPE REGEX
// Prevents user input from breaking MongoDB regex
// ======================================================

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ======================================================
// NORMALIZE TEXT
// ======================================================

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// ======================================================
// GET SEARCH RESULTS
//
// Example:
//
// /api/products/search?q=iron
//
// Searches:
// name
// description
// category
// subcategory
// subsubcategory
// ======================================================

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const query = normalizeText(searchParams.get("q") || "");

    let limit = parseInt(searchParams.get("limit") || "8", 10);

    if (!Number.isFinite(limit)) {
      limit = 8;
    }

    limit = Math.min(Math.max(limit, 1), 20);

    // ==================================================
    // EMPTY SEARCH
    // Return latest products as recommendations
    // ==================================================

    if (!query) {
      const products = await Product.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return NextResponse.json(
        {
          success: true,
          query: "",
          products,
          suggestions: [],
          count: products.length,
        },
        { status: 200 }
      );
    }

    const safeQuery = escapeRegex(query);

    // ==================================================
    // SEARCH REGEX
    //
    // "iron"
    // matches:
    // Iron Man
    // iron watch
    // Iron category
    // ==================================================

    const regex = new RegExp(safeQuery, "i");

    // ==================================================
    // SEARCH MONGODB
    // ==================================================

    const products = await Product.find({
      $or: [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
        { category: { $regex: regex } },
        { subcategory: { $regex: regex } },
        { subsubcategory: { $regex: regex } },
      ],
    })
      .limit(50)
      .lean();

    // ==================================================
    // SCORE PRODUCTS
    //
    // This makes results smarter.
    //
    // Exact name match > name starts with > category >
    // subcategory > description
    // ==================================================

    const scoredProducts = products.map((product) => {
      const name = normalizeText(product.name);
      const description = normalizeText(product.description);
      const category = normalizeText(product.category);
      const subcategory = normalizeText(product.subcategory);
      const subsubcategory = normalizeText(product.subsubcategory);

      let score = 0;

      // ----------------------------------------------
      // NAME
      // ----------------------------------------------

      if (name === query) {
        score += 1000;
      }

      if (name.startsWith(query)) {
        score += 500;
      }

      if (name.includes(query)) {
        score += 300;
      }

      // ----------------------------------------------
      // CATEGORY
      // ----------------------------------------------

      if (category === query) {
        score += 250;
      }

      if (category.startsWith(query)) {
        score += 180;
      }

      if (category.includes(query)) {
        score += 120;
      }

      // ----------------------------------------------
      // SUBCATEGORY
      // ----------------------------------------------

      if (subcategory === query) {
        score += 220;
      }

      if (subcategory.startsWith(query)) {
        score += 160;
      }

      if (subcategory.includes(query)) {
        score += 100;
      }

      // ----------------------------------------------
      // SUB-SUBCATEGORY
      // ----------------------------------------------

      if (subsubcategory === query) {
        score += 200;
      }

      if (subsubcategory.startsWith(query)) {
        score += 150;
      }

      if (subsubcategory.includes(query)) {
        score += 90;
      }

      // ----------------------------------------------
      // DESCRIPTION
      // ----------------------------------------------

      if (description.includes(query)) {
        score += 50;
      }

      // ----------------------------------------------
      // STOCK
      //
      // Give available products a small advantage.
      // ----------------------------------------------

      if (Number(product.stock || 0) > 0) {
        score += 10;
      }

      return {
        ...product,
        _searchScore: score,
      };
    });

    // ==================================================
    // SORT BY SEARCH SCORE
    // ==================================================

    scoredProducts.sort((a, b) => {
      if (b._searchScore !== a._searchScore) {
        return b._searchScore - a._searchScore;
      }

      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    });

    // ==================================================
    // FINAL PRODUCTS
    // ==================================================

    const finalProducts = scoredProducts
      .slice(0, limit)
      .map((product) => {
        const cleanProduct = { ...product };
        delete cleanProduct._searchScore;

        return cleanProduct;
      });

    // ==================================================
    // BUILD SEARCH SUGGESTIONS
    //
    // Example:
    //
    // q = "iron"
    //
    // suggestions:
    // Iron Man
    // Toys
    // Marvel
    // ==================================================

    const suggestionMap = new Map();

    for (const product of products) {
      const values = [
        product.name,
        product.category,
        product.subcategory,
        product.subsubcategory,
      ];

      for (const value of values) {
        if (!value) continue;

        const text = String(value).trim();

        if (!text) continue;

        if (text.toLowerCase().includes(query)) {
          suggestionMap.set(text.toLowerCase(), text);
        }
      }
    }

    const suggestions = Array.from(suggestionMap.values()).slice(0, 6);

    // ==================================================
    // RESPONSE
    // ==================================================

    return NextResponse.json(
      {
        success: true,
        query,
        products: finalProducts,
        suggestions,
        count: finalProducts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Product search error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search products",
        products: [],
        suggestions: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}