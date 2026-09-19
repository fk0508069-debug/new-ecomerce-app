"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import ChatBot from "@/components/chatBot";
import ProfileSidebar from "../../../components/profileSibeBar";
import {
  Package,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  BarChart3,
  Plus,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";

/* ---------------- types ---------------- */
type OrderItem = {
  name?: string;
  quantity?: number;
};

type Order = {
  id?: string;
  _id?: string;
  status?: string;
  tracking_number?: string;
  createdAt?: string;
  total?: number | string;
  items?: OrderItem[];
};

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tone?: "slate" | "amber" | "emerald";
};

/* ---------------- status helpers ---------------- */
const getStatusStyles = (status = "") => {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "processing":
    case "shipped":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "cancelled":
    case "failed":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const getStatusIcon = (status = "") => {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "processing":
    case "shipped":
      return <Truck className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
};

const getStatusAccent = (status = "") => {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return "bg-emerald-400";
    case "processing":
    case "shipped":
      return "bg-blue-400";
    case "cancelled":
    case "failed":
      return "bg-rose-400";
    default:
      return "bg-amber-400";
  }
};

/* orders with these statuses are considered "done" and hidden from the user */
const HIDDEN_STATUSES = ["delivered", "completed"];

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, logout, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [showAllOrders, setShowAllOrders] = useState(false);

  const requestedUserId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.id !== requestedUserId) {
      router.replace("/");
    }
  }, [loading, user, requestedUserId, router]);

  useEffect(() => {
    if (!requestedUserId || !user || user.id !== requestedUserId) return;

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError("");

        const response = await fetch(
          `/api/orders?userId=${encodeURIComponent(requestedUserId)}`
        );
        if (!response.ok) throw new Error("Unable to fetch orders");

        const payload = (await response.json()) as
          | Order[]
          | { orders?: Order[] };

        const list: Order[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.orders)
            ? payload.orders
            : [];

        setOrders(list);
      } catch (error) {
        console.error("Failed to load orders:", error);
        setOrders([]);
        setOrdersError("Could not load your orders right now.");
      } finally {
        setOrdersLoading(false);
      }
    };

    loadOrders();
  }, [requestedUserId, user]);

  /* ---- filter out delivered / completed orders ---- */
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o: Order) =>
          !HIDDEN_STATUSES.includes((o.status || "pending").toLowerCase())
      ),
    [orders]
  );

  if (loading || !user || user.id !== requestedUserId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        Loading profile...
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isAdmin = user.email === "admin@example.com" || user.role === "admin";

  const displayedOrders = showAllOrders
    ? activeOrders
    : activeOrders.slice(0, 2);

  const totalOrders = activeOrders.length;
  const processing = activeOrders.filter((o: Order) =>
    ["processing", "shipped"].includes((o.status || "").toLowerCase())
  ).length;
  const pending = totalOrders - processing;
  const totalSpent = activeOrders.reduce(
    (s: number, o: Order) => s + Number(o.total || 0),
    0
  );
  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Page title */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              My Account
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Profile Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your account and keep an eye on your orders.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            {/* ---------- Sidebar (visible on all screens) ---------- */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <ProfileSidebar />
            </aside>

            {/* ---------- Main column ---------- */}
            <div className="space-y-6">
              {/* Hero */}
              <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white shadow-sm">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                          {user.name || user.email}
                        </h2>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isAdmin && (
                      <>
                        <Link
                          href="/addProduct"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50"
                        >
                          <Plus className="h-4 w-4" />
                          Add Product
                        </Link>
                        <Link
                          href="/admin/analytics"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600"
                        >
                          <BarChart3 className="h-4 w-4" />
                          Analytics
                        </Link>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </section>

              {/* Stat cards */}
              <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                  icon={<ShoppingBag className="h-5 w-5" />}
                  label="Active Orders"
                  value={totalOrders}
                  tone="slate"
                />
                <StatCard
                  icon={<Truck className="h-5 w-5" />}
                  label="In Transit"
                  value={processing}
                  tone="emerald"
                />
                <StatCard
                  icon={<Clock className="h-5 w-5" />}
                  label="Pending"
                  value={pending}
                  tone="amber"
                />
                <StatCard
                  icon={<Package className="h-5 w-5" />}
                  label="Active Total"
                  value={`Rs ${totalSpent.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`}
                  tone="slate"
                />
              </section>

              {/* Orders */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
                  <div>
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Package className="h-4 w-4 text-slate-500" />
                      Your Orders
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Delivered orders are hidden automatically
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    {activeOrders.length}{" "}
                    {activeOrders.length === 1 ? "order" : "orders"}
                  </span>
                </div>

                <div className="p-6">
                  {ordersLoading ? (
                    <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-12">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                        Loading orders...
                      </div>
                    </div>
                  ) : ordersError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600">
                      {ordersError}
                    </div>
                  ) : activeOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 py-14 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-2xs">
                        <ShoppingBag className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No active orders
                      </p>
                      <p className="mt-1 max-w-xs text-xs text-slate-400">
                        You&apos;re all caught up. New orders will show up here.
                      </p>
                      <Link
                        href="/"
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {displayedOrders.map((order: Order, idx: number) => {
                        const orderKey =
                          order.id || order._id || `order-${idx}`;
                        const status = order.status || "Pending";
                        return (
                          <div
                            key={orderKey}
                            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm"
                          >
                            <span
                              className={`absolute inset-y-0 left-0 w-1 ${getStatusAccent(
                                status
                              )}`}
                            />

                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="min-w-0">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                  Tracking ID
                                </span>
                                <p className="text-sm font-semibold text-slate-900">
                                  #{order.tracking_number || "—"}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {order.createdAt
                                    ? new Date(
                                        order.createdAt
                                      ).toLocaleDateString(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Date not available"}
                                </p>
                              </div>

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${getStatusStyles(
                                  status
                                )}`}
                              >
                                {getStatusIcon(status)}
                                {status}
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-4">
                              <div className="min-w-[200px] flex-1">
                                <span className="text-xs font-medium text-slate-500">
                                  Items
                                </span>
                                {order.items && order.items.length > 0 ? (
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {order.items.map(
                                      (item: OrderItem, itemIdx: number) => (
                                        <span
                                          key={`${orderKey}-${itemIdx}`}
                                          className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                                        >
                                          {item.name || "Product"}
                                          <span className="ml-1 font-semibold text-slate-900">
                                            ×{item.quantity || 1}
                                          </span>
                                        </span>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p className="mt-1 text-xs text-slate-400">
                                    No item details available
                                  </p>
                                )}
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-medium text-slate-400">
                                  Total
                                </span>
                                <p className="text-lg font-bold text-slate-900">
                                  Rs{" "}
                                  {Number(order.total || 0).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {activeOrders.length > 2 && (
                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllOrders((p) => !p)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            {showAllOrders
                              ? "Show Less"
                              : `See More (${activeOrders.length - 2} more)`}
                            <span className="text-[10px]">
                              {showAllOrders ? "▲" : "▼"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <ChatBot />
    </>
  );
}

/* ---------------- StatCard helper ---------------- */
function StatCard({ icon, label, value, tone = "slate" }: StatCardProps) {
  const tones: Record<"slate" | "amber" | "emerald", string> = {
    slate: "bg-slate-100 text-slate-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="truncate text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}