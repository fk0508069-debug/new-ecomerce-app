"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Form state for checkout
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    paymentMethod: "cod",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- Computed checkout values (reactive) ----------
  const subtotal = product?.price ? product.price * quantity : 0;
  const shipping = subtotal > 0 ? (subtotal >= 500 ? 0 : 50) : 0; // free shipping above ₹500
  const taxRate = 0.05;
  const tax = subtotal * taxRate;
  const total = subtotal + shipping + tax;

  const formatPrice = (amount: number) => `₹${amount.toFixed(2)}`;
  // ---------------------------------------------------------

  // Fetch product
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

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle order submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        userId: user?.id || null,
        items: [
          {
            productId: String(product._id || product.id),
            quantity: Number(quantity),
          },
        ],
        shipping: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
        },
        paymentMethod: formData.paymentMethod,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      router.push(
        `/order-confirmation?orderId=${data.orderId}&tracking_number=${data.tracking_number}`
      );
    } catch (err: any) {
      console.error("Order submission error:", err);
      alert(err.message || "Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Render: Loading ----------
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

  // ---------- Render: Not authenticated ----------
  if (!user) {
    const redirectPath = `/login?redirect=${encodeURIComponent(
      `/product/${productId}`
    )}`;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white  rounded-2xl shadow-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold dark:text-white mb-2">
            Sign in to view details
          </h2>
          <p className="mb-6">
            This product page is restricted. Please log in to access product
            information and make a purchase.
          </p>

          <div className="space-y-3">
            <Link
              href={redirectPath}
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200"
            >
              Log in
            </Link>
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              ← Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Render: Error ----------
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

  // ---------- Render: Main product page ----------
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

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* ---------- LEFT COLUMN: Product details (2 cols) ---------- */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
                {/* Image and basic info */}
                <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-8">
                  {/* Image */}
                  <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={
                        Array.isArray(product.images)
                          ? product.images[0]
                          : product.image ||
                            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex flex-col">
                    {/* Brand & rating */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {product.brand && (
                        <span className="font-medium text-slate-600">
                          Brand: {product.brand}
                        </span>
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

                    {/* Price */}
                    <div className="mt-4 flex items-end gap-3">
                      <span className="text-3xl font-bold text-amber-600">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-lg text-slate-400 line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                      {product.discount && (
                        <span className="rounded bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-700">
                          -{product.discount}%
                        </span>
                      )}
                    </div>

                    {/* Color */}
                    {product.colors?.length > 0 && (
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

                    {/* Size */}
                    {product.sizes?.length > 0 && (
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
                      {/* Stock indicator */}
                      {product.stock !== undefined && (
                        <span
                          className={`text-sm ${
                            product.stock > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {product.stock > 0 ? `In stock (${product.stock})` : "Out of stock"}
                        </span>
                      )}
                    </div>

                 
                  </div>
                </div>

                {/* Description (optional) */}
                {product.description && (
                  <div className="border-t border-slate-200 p-6 md:p-8">
                    <h3 className="font-semibold text-slate-700">Description</h3>
                    <p className="mt-2 text-slate-600">{product.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ---------- RIGHT COLUMN: Checkout Summary & Form (1 col) ---------- */}
            <div className="lg:col-span-1">
              <div
                id="checkout"
                className="sticky top-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200"
              >
                <h2 className="text-xl font-bold text-slate-800">Order Summary</h2>

                {/* Selected item */}
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">{product.name}</span>
                    <span className="font-medium">{formatPrice(product.price)}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    <span>Qty: {quantity}</span>
                    {selectedColor && <span className="ml-2">Color: {selectedColor}</span>}
                    {selectedSize && <span className="ml-2">Size: {selectedSize}</span>}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Shipping</span>
                    <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax (5%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
                    <span>Total</span>
                    <span className="text-amber-600">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Checkout form */}
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <h3 className="font-semibold text-slate-700">Shipping Details</h3>
                  <form onSubmit={handleSubmit} className="mt-2 space-y-3">
                    <div>
                      <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="address"
                        placeholder="Address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="cod">Cash on Delivery</option>
                        <option value="online">Online Payment</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-full bg-amber-500 py-2.5 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
                    >
                      {isSubmitting ? "Placing Order..." : `Place Order • ${formatPrice(total)}`}
                    </button>
                    <p className="text-center text-xs text-slate-400">
                      Secure checkout • Your order is saved
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}