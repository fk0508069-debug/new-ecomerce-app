"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  subsubcategory: string;
  images: string[];
  isHero: boolean;
}

export default function HeroSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchHeroProducts() {
      try {
        const res = await fetch("/api/products?hero=true&limit=5");
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to fetch hero products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchHeroProducts();
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [products.length]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <section className="relative h-96 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl font-bold text-white md:text-6xl">
            Welcome to Nova Store
          </h1>
          <p className="mt-3 text-lg text-slate-300">
            Discover the latest trends and exclusive deals.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-block rounded-full bg-amber-500 px-8 py-3 font-semibold text-white hover:bg-amber-600"
          >
            Start Shopping →
          </Link>
        </div>
      </section>
    );
  }

  const product = products[currentIndex];

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${product.images?.[0] || ""})` }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-amber-500/20 px-4 py-1 text-sm font-medium text-amber-400 backdrop-blur-sm">
              {product.category} • {product.subcategory}
            </span>
            <h1 className="mt-4 text-4xl font-bold text-white md:text-6xl">
              {product.name}
            </h1>
            <p className="mt-2 text-lg text-slate-300">
              {product.subsubcategory}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <span className="text-2xl font-bold text-amber-400">
                Rs. {product.price}
              </span>
              <span className="text-sm text-slate-400">★ 4.8 (120)</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href={`/details/${product._id}`}
                className="rounded-full bg-amber-500 px-8 py-3 font-semibold text-white transition hover:bg-amber-600 hover:scale-105"
              >
                Shop Now →
              </Link>
              <button
                onClick={() => {
                  const next = (currentIndex + 1) % products.length;
                  setCurrentIndex(next);
                }}
                className="rounded-full border border-white/30 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
        {products.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition ${
              idx === currentIndex
                ? "w-8 bg-amber-400"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}