"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

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
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch hero products
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

  // Auto-play
  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [products.length]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX - touchEndX > 50) {
      // swipe left → next
      setCurrentIndex((prev) => (prev + 1) % products.length);
    } else if (touchEndX - touchStartX > 50) {
      // swipe right → previous
      setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // Render Skeleton while loading
  if (loading) {
    return <HeroSectionSkeleton />;
  }

  if (products.length === 0) {
    return (
      <section className="relative flex h-[420px] sm:h-[500px] md:h-[600px] items-center bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl md:text-6xl tracking-tight">
              Welcome to Nova Store
            </h1>
            <p className="mt-3 text-sm sm:text-base md:text-lg text-slate-300">
              Discover the latest trends and exclusive deals.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-500 px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-lg transition hover:bg-amber-600"
            >
              Start Shopping →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative h-[420px] sm:h-[500px] md:h-[600px] overflow-hidden bg-slate-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides container */}
      <div
        ref={containerRef}
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {products.map((product) => (
          <div
            key={product._id}
            className="relative h-full w-full flex-shrink-0"
          >
            {/* Background image */}
            <Image
              src={product.images?.[0] || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80"}
              alt=""
              fill
              priority={products.indexOf(product) === 0}
              unoptimized
              className="object-cover object-center"
            />

            {/* Responsive overlay */}
            <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/90 via-black/50 to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex h-full items-center">
              <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-2xl">
                  <span className="inline-block rounded-full bg-amber-500/20 px-3.5 py-1 text-xs sm:text-sm font-medium text-amber-400 backdrop-blur-sm">
                    {product.category} {product.subcategory && `• ${product.subcategory}`}
                  </span>

                  <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-4xl md:text-6xl tracking-tight leading-tight">
                    {product.name}
                  </h1>

                  {product.subsubcategory && (
                    <p className="mt-2 text-sm sm:text-base md:text-lg text-slate-300">
                      {product.subsubcategory}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-3 sm:gap-4">
                    <span className="text-xl sm:text-2xl font-bold text-amber-400">
                      Rs. {product.price}
                    </span>
                    <span className="text-xs sm:text-sm text-slate-400">★ 4.8 (120)</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                    <Link
                      href={`/details/${product._id}`}
                      className="inline-flex items-center justify-center rounded-full bg-amber-500 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm md:text-base font-semibold text-white shadow-lg transition hover:bg-amber-600 active:scale-95"
                    >
                      Shop Now →
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex(
                          (prev) => (prev + 1) % products.length
                        )
                      }
                      className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 sm:px-8 py-2.5 sm:py-3 text-xs sm:text-sm md:text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/10 active:scale-95"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:gap-3">
        {products.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? "w-6 sm:w-8 bg-amber-400"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

// Hero Section Skeleton Component
export function HeroSectionSkeleton() {
  return (
    <section className="relative h-[420px] sm:h-[500px] md:h-[600px] w-full overflow-hidden bg-slate-900">
      {/* Background Pulse Base */}
      <div className="absolute inset-0 bg-slate-800/80 animate-pulse" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Content Skeleton */}
      <div className="relative z-10 flex h-full items-center">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl space-y-4">
            {/* Category Tag Skeleton */}
            <div className="h-6 w-32 sm:w-40 rounded-full bg-slate-700/80 animate-pulse" />

            {/* Title Skeleton */}
            <div className="space-y-2 pt-1">
              <div className="h-8 sm:h-12 md:h-14 w-4/5 rounded-lg bg-slate-700/80 animate-pulse" />
              <div className="h-8 sm:h-12 md:h-14 w-3/5 rounded-lg bg-slate-700/80 animate-pulse" />
            </div>

            {/* Subtitle Skeleton */}
            <div className="h-4 sm:h-5 w-1/2 rounded bg-slate-700/80 animate-pulse pt-1" />

            {/* Price & Rating Skeleton */}
            <div className="flex items-center gap-3 pt-1">
              <div className="h-7 w-24 rounded bg-slate-700/80 animate-pulse" />
              <div className="h-4 w-16 rounded bg-slate-700/80 animate-pulse" />
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-3 pt-3">
              <div className="h-10 sm:h-12 w-32 sm:w-36 rounded-full bg-slate-700/80 animate-pulse" />
              <div className="h-10 sm:h-12 w-24 sm:w-28 rounded-full bg-slate-700/80 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Dots Skeleton */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:gap-3">
        <div className="h-2 w-6 sm:w-8 rounded-full bg-slate-700 animate-pulse" />
        <div className="h-2 w-2 rounded-full bg-slate-700 animate-pulse" />
        <div className="h-2 w-2 rounded-full bg-slate-700 animate-pulse" />
      </div>
    </section>
  );
}