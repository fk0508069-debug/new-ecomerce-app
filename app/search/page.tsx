"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  subsubcategory?: string;
  images?: (string | { data?: string })[];
  description?: string;
  stock?: number;
}

interface SearchResponse {
  success: boolean;
  query: string;
  products: Product[];
  suggestions: string[];
  count: number;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80";

function getProductImage(product: Product): string {
  const firstImage = product.images?.[0];

  if (typeof firstImage === "string" && firstImage.trim()) {
    return firstImage;
  }

  if (firstImage && typeof firstImage === "object" && firstImage.data?.trim()) {
    return firstImage.data;
  }

  return fallbackImage;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      setError(null);

      try {
        const url = query.trim()
          ? `/api/products/search?q=${encodeURIComponent(query)}&limit=20`
          : `/api/products/search?limit=12`;

        const res = await fetch(url);
        const data: SearchResponse = await res.json();

        if (data.success) {
          setProducts(data.products || []);
          setSuggestions(query.trim() ? data.suggestions || [] : []);
        } else {
          setError(query.trim() ? "No products found for this search" : "Failed to load recommendations");
        }
      } catch {
        setError("Unable to connect to the catalog. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query]);

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 text-neutral-900 selection:bg-amber-100 selection:text-amber-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header & Meta Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-700 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              {query ? "Search Catalog" : "Curated Picks"}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
              {query ? (
                <>
                  Results for <span className="text-amber-600 font-serif italic font-normal">“{query}”</span>
                </>
              ) : (
                "Trending & Recommended"
              )}
            </h1>
          </div>

          {!loading && !error && (
            <p className="text-sm font-medium text-neutral-500 bg-white px-3.5 py-1.5 rounded-full border border-neutral-200 shadow-sm w-fit">
              Showing <span className="font-semibold text-neutral-800">{products.length}</span> items
            </p>
          )}
        </div>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && !loading && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mr-1">
              Related searches:
            </span>
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="group inline-flex items-center gap-1.5 rounded-full bg-white border border-neutral-200/80 px-3.5 py-1.5 text-xs font-medium text-neutral-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 transition-all duration-150 shadow-xs"
              >
                <svg className="h-3 w-3 text-neutral-400 group-hover:text-amber-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic States */}
        {loading ? (
          /* Modern Skeleton Grid */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-3 border border-neutral-200/80 shadow-xs">
                <div className="aspect-square w-full rounded-xl bg-neutral-200/70" />
                <div className="p-2 space-y-2 mt-2">
                  <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                  <div className="h-3 w-1/2 bg-neutral-200/60 rounded" />
                  <div className="h-5 w-1/3 bg-neutral-200 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-red-200 bg-red-50/50 p-12 text-center">
            <div className="rounded-full bg-red-100 p-3 text-red-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="mt-4 text-base font-semibold text-neutral-800">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition active:scale-95"
            >
              Back to Home
            </button>
          </div>
        ) : products.length > 0 ? (
          /* Product Grid */
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const inStock = product.stock === undefined || product.stock > 0;

              return (
                <Link
                  key={product._id}
                  href={`/details/${product._id}`}
                  className="group relative flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-200/50"
                >
                  {/* Image Frame */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-100">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />

                    {/* Subtle Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Stock Badge Overlay */}
                    <span
                      className={`absolute top-2.5 left-2.5 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-xs ${
                        inStock
                          ? "bg-white/90 text-emerald-800 border border-emerald-200/50"
                          : "bg-white/90 text-rose-700 border border-rose-200/50"
                      }`}
                    >
                      {inStock ? "In Stock" : "Sold Out"}
                    </span>
                  </div>

                  {/* Details Card */}
                  <div className="flex flex-1 flex-col justify-between p-2 pt-3">
                    <div>
                      {product.category && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                          {product.category}
                        </p>
                      )}
                      <h2 className="mt-1 text-sm font-medium text-neutral-800 line-clamp-1 group-hover:text-neutral-950 transition-colors">
                        {product.name}
                      </h2>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between border-t border-neutral-100 pt-3">
                      <div>
                        <span className="text-xs font-medium text-neutral-400 mr-1">Rs.</span>
                        <span className="text-lg font-bold text-neutral-950">
                          {product.price.toLocaleString()}
                        </span>
                      </div>
                      
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-50 text-neutral-400 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty Search Fallback */
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-xs">
            <div className="rounded-full bg-amber-50 p-4 text-amber-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-neutral-900">No matching products found</h3>
            <p className="mt-1 max-w-sm text-sm text-neutral-500">
              We could not find anything matching <span className="font-medium text-neutral-700">"{query}"</span>. Try adjusting your search term or exploring our full range.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 rounded-xl bg-neutral-900 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 transition active:scale-95"
            >
              Browse All Categories
            </button>
          </div>
        )}
      </main>
    </div>
  );
}