"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import Recommendations from "@/components/CategoryProducts"; // <-- imported

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch products");
        }

        const products = data.products || [];
        const found = products.find(
          (p: any) => String(p._id || p.id) === String(productId)
        );

        if (!found) {
          throw new Error("Product not found");
        }

        setProduct(found);

        if (found.colors?.length) {
          setSelectedColor(found.colors[0]);
        }

        if (found.sizes?.length) {
          setSelectedSize(found.sizes[0]);
        }
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

  // Add to cart
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

  // Build category path for recommendations
  const getCategoryPath = (product: any) => {
    if (product.subsubcategory) {
      return `${product.category}/${product.subcategory}/${product.subsubcategory}`;
    }
    if (product.subcategory) {
      return `${product.category}/${product.subcategory}`;
    }
    if (product.category) {
      return product.category;
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
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

  const images = Array.isArray(product.images) ? product.images : [];
  const currentImage = images[selectedImageIndex] || images[0] || "";
  const categoryPath = getCategoryPath(product);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-slate-500">
            <Link href="/" className="transition hover:text-amber-500">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/" className="transition hover:text-amber-500">
              Products
            </Link>
            {product.category && (
              <>
                <span className="mx-2">/</span>
                <span className="text-slate-600">{product.category}</span>
              </>
            )}
            <span className="mx-2">/</span>
            <span className="text-slate-700">{product.name}</span>
          </nav>

          {/* Main Product Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
            <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-8 lg:gap-12">
              {/* Image Gallery */}
              <div>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <div className="text-5xl">📦</div>
                      <p className="mt-3 text-sm">No image available</p>
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {images.map((image: string, index: number) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                          selectedImageIndex === index
                            ? "ring-amber-500"
                            : "ring-slate-200 hover:ring-slate-300"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-16 w-16 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col">
                {product.brand && (
                  <div className="text-sm font-medium text-slate-500">
                    Brand: <span className="text-slate-700">{product.brand}</span>
                  </div>
                )}

                <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
                  {product.name}
                </h1>

                {/* Category hierarchy pills */}
                {(product.category || product.subcategory || product.subsubcategory) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    {product.category && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        {product.category}
                      </span>
                    )}
                    {product.subcategory && (
                      <>
                        <span className="text-slate-300">/</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                          {product.subcategory}
                        </span>
                      </>
                    )}
                    {product.subsubcategory && (
                      <>
                        <span className="text-slate-300">/</span>
                        <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700 ring-1 ring-amber-200">
                          {product.subsubcategory}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Description under name */}
                {product.description && (
                  <div className="mt-5">
                    <p className="text-sm leading-6 text-slate-600">
                      {product.description}
                    </p>
                  </div>
                )}

                {product.rating && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-sm font-medium text-amber-700">
                      ⭐ {product.rating}
                      <span className="text-amber-600">
                        ({product.reviews || 0} reviews)
                      </span>
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5">
                  <span className="text-3xl font-bold text-amber-600">
                    Rs. {Number(product.price || 0).toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-slate-400 line-through">
                      Rs. {Number(product.originalPrice).toFixed(2)}
                    </span>
                  )}
                  {product.discount && (
                    <span className="rounded bg-green-100 px-2 py-0.5 text-sm font-semibold text-green-700">
                      -{product.discount}%
                    </span>
                  )}
                </div>

                {/* Stock */}
                {product.stock !== undefined && (
                  <div className="mt-3">
                    {Number(product.stock) > 0 ? (
                      <p className="text-sm font-medium text-green-600">
                        ✓ In Stock{" "}
                        <span className="font-normal text-slate-500">
                          ({product.stock} available)
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-red-600">Out of Stock</p>
                    )}
                  </div>
                )}

                {/* Color */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-700">Color:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.colors.map((color: string) => (
                        <button
                          type="button"
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`rounded-full border-2 px-4 py-1 text-sm transition ${
                            selectedColor === color
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-slate-300 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-700">Size:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.sizes.map((size: string) => (
                        <button
                          type="button"
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-md border-2 px-4 py-1 text-sm transition ${
                            selectedSize === size
                              ? "border-amber-500 bg-amber-50 text-amber-700"
                              : "border-slate-300 text-slate-700 hover:border-slate-400"
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
                  <div className="flex items-center overflow-hidden rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-slate-600 transition hover:bg-slate-100"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity((q) =>
                          product.stock ? Math.min(product.stock, q + 1) : q + 1
                        )
                      }
                      className="px-3 py-2 text-slate-600 transition hover:bg-slate-100"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock !== undefined && Number(product.stock) <= 0}
                    className="flex-1 rounded-full bg-amber-500 py-3 font-semibold text-white transition hover:bg-amber-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {product.stock !== undefined && Number(product.stock) <= 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>
                  <Link
                    href={`/checkout/${product._id || product.id}`}
                    className={`flex-1 rounded-full border-2 border-amber-500 py-3 text-center font-semibold text-amber-600 transition hover:bg-amber-50 ${
                      product.stock !== undefined && Number(product.stock) <= 0
                        ? "pointer-events-none border-slate-300 text-slate-400"
                        : ""
                    }`}
                  >
                    Buy Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Extended Information */}
            <div className="border-t border-slate-200 p-6 md:p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="font-semibold text-slate-800">Delivery Options</h3>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    <p className="text-green-600">✓ Cash on Delivery available</p>
                    <p>Fast and secure delivery</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Return & Warranty</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>• 14 days easy return</li>
                    <li>• Change of mind accepted</li>
                    <li className="text-amber-600">• Warranty not available</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Product Details</h3>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {product.category && <li>• Category: {product.category}</li>}
                    {product.subcategory && <li>• Subcategory: {product.subcategory}</li>}
                    {product.subsubcategory && <li>• Product Type: {product.subsubcategory}</li>}
                    {product.material && <li>• Material: {product.material}</li>}
                    {product.careInstructions && <li>• Care: {product.careInstructions}</li>}
                    {!product.category &&
                      !product.subcategory &&
                      !product.subsubcategory &&
                      !product.material &&
                      !product.careInstructions && (
                        <li className="text-slate-400">No additional details</li>
                      )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RECOMMENDATIONS SECTION */}
          {/* ============================================================ */}
          {categoryPath && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-slate-800">You May Also Like</h2>
              <div className="mt-4">
                <Recommendations
                  category={categoryPath}
                  excludeId={String(product._id || product.id)}
                  limit={4}
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}