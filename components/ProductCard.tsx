"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

export type Product = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock?: number;
  images?: string[];
};

export default function ProductCard({
  product,
  isRecommendation = false,
  isAdmin = false,
  onDelete,
}: {
  product: Product;
  isRecommendation?: boolean;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}) {
  const { addToCart } = useCart();

  const productId = product._id || product.id || "";

  const imageUrl =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <Link href={`/details/${productId}`} className="block h-full w-full">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            unoptimized
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {isAdmin && (
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex gap-1.5 sm:gap-2">
            <Link
              href={`/admin/products/${productId}/edit`}
              className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white"
            >
              Edit
            </Link>

            <button
              type="button"
              onClick={() => productId && onDelete?.(productId)}
              className="rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-white shadow-md backdrop-blur-sm transition hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 md:p-5">
        <div className="space-y-1.5 sm:space-y-2">
          <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600">
            {product.category}
          </p>

          <Link href={`/details/${productId}`}>
            <h3 className="line-clamp-1 text-base sm:text-lg font-bold text-slate-900 transition hover:text-amber-600">
              {product.name}
            </h3>
          </Link>

          <p className="line-clamp-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            {product.description || "Freshly added product from the catalog."}
          </p>
        </div>

        {/* Pricing & Cart Action */}
        <div className="mt-4 flex flex-col gap-2.5 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900">
            Rs {Number(product.price || 0).toFixed(2)}
          </span>

          {!isRecommendation && (
            <button
              type="button"
              onClick={() =>
                addToCart({
                  id: productId,
                  name: product.name,
                  price: Number(product.price || 0),
                  image: imageUrl,
                })
              }
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl sm:rounded-full bg-amber-500 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 active:scale-95"
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Reusable Skeleton Component for Loading State
export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-0 shadow-sm animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square w-full bg-slate-200" />

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col justify-between p-3 sm:p-4 md:p-5">
        <div className="space-y-2.5">
          <div className="h-3 w-1/4 rounded bg-slate-200" />
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full rounded bg-slate-200" />
            <div className="h-3.5 w-4/5 rounded bg-slate-200" />
          </div>
        </div>

        {/* Price & Action Skeleton */}
        <div className="mt-4 flex flex-col gap-2.5 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="h-6 w-24 rounded bg-slate-200" />
          <div className="h-9 w-full sm:w-28 rounded-xl sm:rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}