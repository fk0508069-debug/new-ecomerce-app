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
      <main className="min-h-screen bg-slate-950">
        {/* Hero */}
        <HeroSection />

        {/* Quick Action Buttons */}
        <div className="container mx-auto -mt-6 px-4 relative z-20">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/search"
              className="rounded-full bg-slate-800 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-slate-700"
            >
              🔥 Trending Now
            </Link>
            {/* You can add more buttons here if needed */}
          </div>
        </div>

        {/* Simple Product Grid (replaces TrendingProducts) */}
        <section className="container mx-auto px-4 py-10">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-slate-400">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
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