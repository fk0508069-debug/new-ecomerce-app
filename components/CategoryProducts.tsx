"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subcategory: string;
  subsubcategory: string;
  stock: number;
  images: string[];
}

interface CategoryProductsProps {
  category: string;
  subcategory?: string;
  subsubcategory?: string;
  title?: string;
  limit?: number;
  excludeId?: string; // ✅ Added to support excluding current product
}

export default function CategoryProducts({
  category,
  subcategory,
  subsubcategory,
  title,
  limit = 8,
  excludeId, // ✅ Destructure excludeId
}: CategoryProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();

        let cat = category;
        let subcat = subcategory;
        let subsubcat = subsubcategory;

        // If category is a slash-separated path, split it
        if (category && category.includes("/")) {
          const parts = category.split("/");
          cat = parts[0] || "";
          subcat = parts[1] || "";
          subsubcat = parts[2] || "";
        }

        if (cat) params.set("category", cat);
        if (subcat) params.set("subcategory", subcat);
        if (subsubcat) params.set("subsubcategory", subsubcat);
        params.set("limit", String(limit));

        const url = `/api/products?${params.toString()}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch products");
        }

        // ✅ Filter out the product with the given excludeId
        const fetchedProducts = data.products || [];
        const filteredProducts = excludeId
          ? fetchedProducts.filter(
              (p: Product) => String(p._id) !== excludeId
            )
          : fetchedProducts;

        setProducts(filteredProducts);
      } catch (err: any) {
        console.error("Category products error:", err);
        setError(err?.message || "Unable to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, subcategory, subsubcategory, limit, excludeId]); // ✅ Added excludeId to dependency array

  const heading = title || subsubcategory || subcategory || category;

  const viewAllParams = new URLSearchParams();
  if (category) viewAllParams.set("category", category);
  if (subcategory) viewAllParams.set("subcategory", subcategory);
  if (subsubcategory) viewAllParams.set("subsubcategory", subsubcategory);

  // ─── LOADING ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="mb-2 h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <div className="aspect-square animate-pulse bg-slate-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ─── ERROR ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <section className="py-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-red-100 px-5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  // ─── EMPTY ──────────────────────────────────────────────────────────
  if (!products.length) {
    return (
      <section className="py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="text-6xl">📦</div>
          <h3 className="mt-4 text-2xl font-semibold text-slate-800">
            No products found
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            We couldn’t find any products in this category.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-amber-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
          >
            Browse All Products
          </Link>
        </div>
      </section>
    );
  }

  // ─── RENDER ────────────────────────────────────────────────────────
  return (
    <section className="py-10">
      {/* Header (commented out as per original) */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>{/* header content omitted */}</div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product._id}
            className="transition duration-300 hover:-translate-y-1.5 hover:shadow-xl"
          >
            <ProductCard product={product} isRecommendation />
          </div>
        ))}
      </div>
    </section>
  );
}