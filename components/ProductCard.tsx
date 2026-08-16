"use client";

import Link from "next/link";
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
  isAdmin = false,
  onDelete,
}: {
  product: Product;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}) {
  const { addToCart } = useCart();
  const productId = product._id || product.id || "";
  const imageUrl = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <Link href={`/details/${productId}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
            loading="lazy"
          />
        </Link>
        {isAdmin && (
          <div className="absolute right-3 top-3 flex gap-2">
            <Link
              href={`/admin/products/${productId}/edit`}
              className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => productId && onDelete?.(productId)}
              className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-500">
            {product.category}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-800">{product.name}</h3>
        </div>

        <p className="line-clamp-2 text-sm text-slate-600">
          {product.description || "Freshly added product from the catalog."}
        </p>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-bold text-slate-900">
            ${Number(product.price || 0).toFixed(2)}
          </span>
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
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}