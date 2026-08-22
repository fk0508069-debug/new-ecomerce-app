"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
}

export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        // Get products sorted by creation date (or any trending logic)
        const res = await fetch("/api/products?limit=12");
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to fetch trending products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="text-slate-400">No products available.</p>;
  }

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {products.map((product) => (
          <Link
            key={product._id}
            href={`/details/${product._id}`}
            className="group min-w-[180px] max-w-[200px] flex-shrink-0"
          >
            <div className="overflow-hidden rounded-xl bg-slate-800 transition hover:scale-105">
              <div className="aspect-[2/3] bg-slate-700">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">
                    No image
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="truncate text-sm font-semibold text-white">
                  {product.name}
                </h3>
                <p className="text-sm text-amber-400">Rs. {product.price}</p>
                <p className="text-xs text-slate-400">{product.category}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}