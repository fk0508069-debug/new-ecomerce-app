"use client";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import ChatBot from "@/components/chatBot";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/productContext";

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

export default function HomePage() {
  const { user } = useAuth();
  const { products, loading, error, refreshProducts } = useProducts();

  const isAdmin = user?.role === "admin";

  const handleDelete = async (productId: string) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete product");
      }
      await refreshProducts();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Failed to delete product"
      );
    }
  };

  // Skeleton loader for product cards
  const renderSkeletons = () => {
    return Array.from({ length: 8 }).map((_, index) => (
      <div
        key={index}
        className="rounded-2xl bg-slate-800/50 p-4 ring-1 ring-slate-700 animate-pulse"
      >
        <div className="aspect-square w-full rounded-xl bg-slate-700" />
        <div className="mt-3 h-4 w-3/4 rounded bg-slate-700" />
        <div className="mt-2 h-4 w-1/2 rounded bg-slate-700" />
        <div className="mt-3 flex items-center justify-between">
          <div className="h-5 w-1/3 rounded bg-slate-700" />
          <div className="h-8 w-8 rounded-full bg-slate-700" />
        </div>
      </div>
    ));
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen ">
        {/* Hero – has its own skeleton now */}
        <HeroSection />

        {/* Quick Action Buttons */}
        <div className="container relative z-20 mx-auto -mt-6 px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/search"
              className="rounded-full bg-slate-800 px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-slate-700"
            >
              🔥 Trending Now
            </Link>
          </div>
        </div>

        {/* Products */}
        <section className="container mx-auto px-4 py-10">
          {error && (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="mb-4 text-center text-red-400">{error}</p>
              <button
                type="button"
                onClick={refreshProducts}
                className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-medium text-black transition hover:bg-amber-400"
              >
                Try Again
              </button>
            </div>
          )}

          {!error && loading && products.length === 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderSkeletons()}
            </div>
          )}

          {!error && !loading && products.length === 0 && (
            <p className="text-center text-slate-400">No products found.</p>
          )}

          {!error && products.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product as Product}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

        <ChatBot />
      </main>
    </>
  );
}