"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import ChatBot from "@/components/chatBot";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products?limit=8"); // adjust query as needed
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

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

      setProducts((currentProducts) =>
        currentProducts.filter((product) => product._id !== productId)
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Failed to delete product");
    }
  };

  const isAdmin = user?.role === "admin";

  return (
  <>
  <Navbar />
  <main className="min-h-screen bg-slate-50">
    {/* Hero */}
    <HeroSection />

    {/* Quick Action Buttons - Constrained Width */}
    <div className="mx-auto max-w-6xl -mt-6 px-4 relative z-20">
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/search"
          className="rounded-full bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-colors hover:bg-slate-700"
        >
          🔥 Trending Now
        </Link>
      </div>
    </div>

    {/* Compact Product Grid Section */}
    <section className="mx-auto max-w-6xl px-4 py-10">
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
        </div>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>

    {/* ChatBot */}
    <ChatBot />
  </main>
</>
  );
}