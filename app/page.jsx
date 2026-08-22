"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import { useAuth } from "@/context/AuthContext";
import ChatBot from "@/components/chatBot"
export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";
  
  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch products");
      setProducts(data.products || []);
      setError("");
    } catch (err) {
      console.error("Product fetch error:", err);
      setError(err.message || "Unable to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    async function loadProducts() {
      await fetchProducts();
    }

    loadProducts();
  }, []);
  
  // Delete product (admin only)
  const handleDelete = async (productId) => {
    if (!productId || !window.confirm("Delete this product?")) return;
    
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== productId));
   
    } catch (err) {
      alert(err.message || "Unable to delete product");
    }
  };

  // router.refresh();
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* ===== Hero Banner ===== */}
          <HeroSection />

          {/* ===== Product Grid ===== */}
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
              Loading products...
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-8 text-center text-red-600 shadow-sm ring-1 ring-red-200">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm ring-1 ring-slate-200">
              No products available yet.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  isAdmin={isAdmin}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
          <ChatBot />
        </div>
      </main>
    </>
  );
}