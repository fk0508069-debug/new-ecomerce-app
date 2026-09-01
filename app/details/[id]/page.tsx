"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import Recommendations from "@/components/CategoryProducts";

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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
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
    if (product?.subsubcategory) {
      return `${product.category}/${product.subcategory}/${product.subsubcategory}`;
    }
    if (product?.subcategory) {
      return `${product.category}/${product.subcategory}`;
    }
    if (product?.category) {
      return product.category;
    }
    return null;
  };

  // Render Skeleton while loading
  if (loading) {
    return (
      <>
        <Navbar />
        <ProductDetailSkeleton />
      </>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <>
        <Navbar />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-slate-50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-2xl font-bold text-red-600">Oops!</h2>
            <p className="mt-2 text-slate-600">{error || "Product not found"}</p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
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

      <main className="min-h-screen bg-slate-50 py-6 sm:py-8 md:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 sm:mb-6 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-slate-500">
            <Link href="/" className="transition hover:text-amber-500">
              Home
            </Link>
            <span>/</span>
            <Link href="/" className="transition hover:text-amber-500">
              Products
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <span className="text-slate-600">{product.category}</span>
              </>
            )}
            <span>/</span>
            <span className="truncate max-w-[150px] sm:max-w-xs text-slate-800 font-medium">
              {product.name}
            </span>
          </nav>

          {/* Main Product Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
            <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 md:grid-cols-2 md:p-8 lg:gap-12">
              {/* Image Gallery */}
              <div>
                <div className="relative aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                  {currentImage ? (
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      unoptimized
                      className="h-full w-full object-cover transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                      <div className="text-5xl">📦</div>
                      <p className="mt-3 text-sm">No image available</p>
                    </div>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="mt-4 flex gap-2.5 sm:gap-3 overflow-x-auto pb-2">
                    {images.map((image: string, index: number) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                          selectedImageIndex === index
                            ? "ring-amber-500"
                            : "ring-slate-200 hover:ring-slate-300"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-between">
                <div>
                  {product.brand && (
                    <div className="text-xs sm:text-sm font-medium text-slate-500">
                      Brand: <span className="text-slate-700 font-semibold">{product.brand}</span>
                    </div>
                  )}

                  <h1 className="mt-1 text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {product.name}
                  </h1>

                  {/* Category hierarchy pills */}
                  {(product.category || product.subcategory || product.subsubcategory) && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
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
  <div className="mt-4">
    <p
      className={`text-xs sm:text-sm leading-relaxed text-slate-600 ${
        isDescriptionExpanded ? "" : "line-clamp-3"
      }`}
    >
      {product.description}
    </p>

    {/* Only show the toggle button if the description is long enough */}
    {product.description.length > 120 && (
      <button
        type="button"
        onClick={() => setIsDescriptionExpanded((prev) => !prev)}
        className="mt-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
      >
        {isDescriptionExpanded ? "See less" : "See more"}
      </button>
    )}
  </div>
)}

                  {product.rating && (
                    <div className="mt-3.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/70 px-2.5 py-1 text-xs sm:text-sm font-medium text-amber-800">
                        ⭐ {product.rating}
                        <span className="text-amber-700/80">
                          ({product.reviews || 0} reviews)
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-5 flex flex-wrap items-baseline gap-2.5 border-t border-slate-100 pt-5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-amber-600">
                      Rs. {Number(product.price || 0).toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-base sm:text-lg text-slate-400 line-through">
                        Rs. {Number(product.originalPrice).toFixed(2)}
                      </span>
                    )}
                    {product.discount && (
                      <span className="rounded-md bg-green-100 px-2 py-0.5 text-xs sm:text-sm font-bold text-green-700">
                        -{product.discount}%
                      </span>
                    )}
                  </div>

                  {/* Stock */}
                  {product.stock !== undefined && (
                    <div className="mt-2.5">
                      {Number(product.stock) > 0 ? (
                        <p className="text-xs sm:text-sm font-medium text-green-600">
                          ✓ In Stock{" "}
                          <span className="font-normal text-slate-500">
                            ({product.stock} available)
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm font-semibold text-red-600">
                          Out of Stock
                        </p>
                      )}
                    </div>
                  )}

                  {/* Color */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">Color:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.colors.map((color: string) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`rounded-full border px-3.5 py-1 text-xs sm:text-sm transition ${
                              selectedColor === color
                                ? "border-amber-500 bg-amber-50 font-semibold text-amber-700 shadow-sm"
                                : "border-slate-200 text-slate-700 hover:border-slate-300"
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
                    <div className="mt-4">
                      <p className="text-xs sm:text-sm font-medium text-slate-700">Size:</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.sizes.map((size: string) => (
                          <button
                            type="button"
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`rounded-lg border px-3.5 py-1 text-xs sm:text-sm transition ${
                              selectedSize === size
                                ? "border-amber-500 bg-amber-50 font-semibold text-amber-700 shadow-sm"
                                : "border-slate-200 text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mt-5 flex items-center gap-3">
                    <label htmlFor="quantity" className="text-xs sm:text-sm font-medium text-slate-700">
                      Quantity:
                    </label>
                    <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="px-3 py-1.5 text-slate-600 transition hover:bg-slate-200 active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-slate-800">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) =>
                            product.stock ? Math.min(product.stock, q + 1) : q + 1
                          )
                        }
                        className="px-3 py-1.5 text-slate-600 transition hover:bg-slate-200 active:scale-95"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={product.stock !== undefined && Number(product.stock) <= 0}
                    className="flex-1 rounded-full bg-amber-500 py-3 text-xs sm:text-sm md:text-base font-semibold text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {product.stock !== undefined && Number(product.stock) <= 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>
                  <Link
                    href={`/checkout/${product._id || product.id}`}
                    className={`flex-1 rounded-full border-2 border-amber-500 py-3 text-center text-xs sm:text-sm md:text-base font-semibold text-amber-600 transition hover:bg-amber-50 active:scale-[0.98] ${
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
            <div className="border-t border-slate-200/80 bg-slate-50/50 p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Delivery Options</h3>
                  <div className="mt-2 space-y-1.5 text-xs sm:text-sm text-slate-600">
                    <p className="text-green-600 font-medium">✓ Cash on Delivery available</p>
                    <p>Fast and secure standard delivery</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Return & Warranty</h3>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-slate-600">
                    <li>• 14 days easy return policy</li>
                    <li>• Change of mind accepted</li>
                    <li className="text-amber-600 font-medium">• Warranty not available</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">Product Details</h3>
                  <ul className="mt-2 space-y-1.5 text-xs sm:text-sm text-slate-600">
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

          {/* Recommendations Section */}
          {categoryPath && (
            <section className="mt-10 sm:mt-14">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                You May Also Like
              </h2>
              <div className="mt-4 sm:mt-6">
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

// Dedicated Skeleton Component for Product Detail Page
export function ProductDetailSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 py-6 sm:py-8 md:py-10 animate-pulse">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-4 sm:mb-6 flex gap-2">
          <div className="h-4 w-16 rounded bg-slate-200" />
          <div className="h-4 w-4 rounded bg-slate-200" />
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-4 w-4 rounded bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>

        {/* Main Card Skeleton */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
          <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 md:grid-cols-2 md:p-8 lg:gap-12">
            {/* Gallery Skeleton */}
            <div>
              <div className="aspect-square w-full rounded-xl bg-slate-200" />
              <div className="mt-4 flex gap-2.5 sm:gap-3">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-slate-200" />
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-slate-200" />
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-slate-200" />
              </div>
            </div>

            {/* Info Skeleton */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-3.5">
                <div className="h-3.5 w-24 rounded bg-slate-200" />
                <div className="h-8 w-3/4 rounded bg-slate-200" />

                {/* Pills Skeleton */}
                <div className="flex gap-2 pt-1">
                  <div className="h-6 w-20 rounded-full bg-slate-200" />
                  <div className="h-6 w-24 rounded-full bg-slate-200" />
                </div>

                {/* Description lines */}
                <div className="space-y-2 pt-2">
                  <div className="h-3.5 w-full rounded bg-slate-200" />
                  <div className="h-3.5 w-5/6 rounded bg-slate-200" />
                </div>

                {/* Price block Skeleton */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="h-8 w-36 rounded bg-slate-200" />
                  <div className="h-4 w-28 rounded bg-slate-200" />
                </div>

                {/* Variant Options Skeleton */}
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-16 rounded bg-slate-200" />
                  <div className="flex gap-2">
                    <div className="h-8 w-16 rounded-full bg-slate-200" />
                    <div className="h-8 w-16 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <div className="h-11 sm:h-12 flex-1 rounded-full bg-slate-200" />
                <div className="h-11 sm:h-12 flex-1 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>

          {/* Extended Info Skeleton */}
          <div className="border-t border-slate-200/80 bg-slate-50/50 p-4 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-3 w-44 rounded bg-slate-200" />
                <div className="h-3 w-36 rounded bg-slate-200" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-slate-200" />
                <div className="h-3 w-40 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-200" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-3 w-36 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section Skeleton */}
        <div className="mt-10 sm:mt-14 space-y-4">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3 space-y-2"
              >
                <div className="aspect-square w-full rounded bg-slate-200" />
                <div className="h-3 w-1/3 rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}