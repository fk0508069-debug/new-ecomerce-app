"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id;
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Fetch all products and find the one matching the ID
  useEffect(() => {
    if (!productId) {
      setError("No product ID provided");
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch products");
        const products = data.products || [];
        const found = products.find((p: any) => (p._id || p.id) === productId);
        if (!found) throw new Error("Product not found");
        setProduct(found);
        if (found.colors?.length) setSelectedColor(found.colors[0]);
        if (found.sizes?.length) setSelectedSize(found.sizes[0]);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err?.message || "Unable to load product");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productId]);

  // Handle add to cart
  const handleAddToCart = () => {
    if (!product) return;
    const item = {
      id: String(product._id || product.id),
      name: product.name,
      price: Number(product.price || 0),
      image: Array.isArray(product.images) ? product.images[0] : product.image || "",
    };
    for (let i = 0; i < quantity; i++) {
      addToCart(item);
    }
    alert(`Added ${quantity} × ${product.name} to cart!`);
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            <p className="mt-4 text-slate-600">Loading product...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-red-600">Oops!</h2>
            <p className="mt-2 text-slate-600">{error || "Product not found"}</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-full bg-amber-500 px-6 py-2 text-white transition hover:bg-amber-600"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Main content – Daraz‑style spacious layout
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-slate-500">
            <Link href="/" className="hover:text-amber-500">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/" className="hover:text-amber-500">Products</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-700">{product.name}</span>
          </nav>

          {/* Product main card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
            <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-8 lg:gap-12">
              {/* Image */}
              <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={Array.isArray(product.images) ? product.images[0] : product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex flex-col">
                {/* Brand and ratings */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {product.brand && (
                    <span className="font-medium text-slate-600">Brand: {product.brand}</span>
                  )}
                  {product.rating && (
                    <span className="ml-2 flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-amber-700">
                      ⭐ {product.rating} ({product.reviews || 0} reviews)
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
                  {product.name}
                </h1>

                {/* Price with discount */}
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-3xl font-bold text-amber-600">
                    ₹{product.price?.toFixed(2) || "0.00"}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-slate-400 line-through">
                      ₹{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  {product.discount && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-700">
                      -{product.discount}%
                    </span>
                  )}
                </div>

                {/* Color selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700">Color:</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {product.colors.map((color: string) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`rounded-full border-2 px-4 py-1 text-sm transition ${
                            selectedColor === color
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700">Size:</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {product.sizes.map((size: string) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-md border-2 px-4 py-1 text-sm transition ${
                            selectedSize === size
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mt-6 flex items-center gap-4">
                  <label htmlFor="quantity" className="text-sm font-medium text-slate-700">
                    Quantity
                  </label>
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1 text-slate-600 hover:bg-slate-100"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 rounded-full bg-amber-500 py-3 font-semibold text-white transition hover:bg-amber-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                  >
                    Add to Cart
                  </button>
                  <Link href={`/checkout/${product._id || product.id}`} className="flex-1 rounded-full border-2 border-amber-500 py-3 font-semibold text-amber-600 transition hover:bg-amber-50">
                    Buy Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Extended info */}
            <div className="border-t border-slate-200 p-6 md:p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Delivery */}
                <div>
                  <h3 className="font-semibold text-slate-800">Delivery Options</h3>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                   
                    <p className="mt-1 text-xs text-green-600">✓ Cash on Delivery available</p>
                  </div>
                </div>

                {/* Returns */}
                <div>
                  <h3 className="font-semibold text-slate-800">Return & Warranty</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>• 14 days easy return</li>
                    <li>• Change of mind accepted</li>
                    <li className="text-amber-600">• Warranty not available</li>
                  </ul>
                </div>

                {/* Product details */}
                <div>
                  <h3 className="font-semibold text-slate-800">Product Details</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {product.category && <li>• Category: {product.category}</li>}
                    {product.material && <li>• Material: {product.material}</li>}
                    {product.careInstructions && <li>• Care: {product.careInstructions}</li>}
                    {!product.material && !product.careInstructions && (
                      <li className="text-slate-400">No additional details</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="font-semibold text-slate-800">Description</h3>
                  <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}