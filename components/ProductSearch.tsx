"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import debounce from "lodash.debounce"; // npm install lodash.debounce @types/lodash.debounce
import Image from "next/image";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  subcategory?: string;
  subsubcategory?: string;
  images?: { data: string }[];
}

interface SearchResponse {
  success: boolean;
  query: string;
  products: Product[];
  suggestions: string[];
  count: number;
}

export default function ProductSearch() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search function
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setProducts([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=6`);
        const data: SearchResponse = await res.json();
        if (data.success) {
          setSuggestions(data.suggestions);
          setProducts(data.products);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  // ✅ Clicking a product goes to /details/[id]
  const handleProductClick = (productId: string) => {
    setIsOpen(false);
    router.push(`/details/${productId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Search products, brands, categories..."
          className="w-full rounded-full border border-gray-200 bg-gray-50/75 py-2 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-amber-500"></div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (suggestions.length > 0 || products.length > 0) && (
        <div className="absolute left-0 right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg max-h-96 overflow-y-auto z-50">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="py-2 border-b border-gray-100">
              <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Suggestions
              </div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-amber-50 transition flex items-center gap-2"
                >
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Product Results */}
          {products.length > 0 && (
            <div className="py-2">
              <div className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Products
              </div>
              {products.map((product) => (
                <button
                  key={product._id}
                  onClick={() => handleProductClick(product._id)}
                  className="w-full px-4 py-2 text-left hover:bg-amber-50 transition flex items-center gap-3"
                >
                  {product.images && product.images[0]?.data && (
                    <Image
                      src={product.images[0].data}
                      alt={product.name}
                      width={32}
                      height={32}
                      unoptimized
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-800">{product.name}</div>
                    <div className="text-xs text-gray-500">Rs. {product.price}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* "View all" link */}
          {query.trim() && products.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 text-center">
              <button
                onClick={() => router.push(`/search?q=${encodeURIComponent(query.trim())}`)}
                className="text-sm text-amber-600 hover:text-amber-800 font-medium"
              >
                See all results for "{query}" →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}