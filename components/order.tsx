"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
type OrderItem = {
  productId: string;
  tracking_number: number; // keep if needed per item, but not used
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type Order = {
  _id: string;
  userId?: string | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  shipping: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
  };
  paymentMethod: string;
  status: Status;
  createdAt: string;
  tracking_number?: string | number; // ✅ added
};

type Status =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

const STATUS_OPTIONS: Status[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_STYLES: Record<
  Status,
  { badge: string; dot: string }
> = {
  pending: {
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
  },
  processing: {
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    dot: "bg-blue-500",
  },
  shipped: {
    badge: "bg-violet-50 text-violet-700 ring-violet-200",
    dot: "bg-violet-500",
  },
  delivered: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    badge: "bg-red-50 text-red-700 ring-red-200",
    dot: "bg-red-500",
  },
};

const formatCurrency = (value: number) => {
  return `Rs ${Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // --------------------------------------------------
  // FETCH ORDERS
  // --------------------------------------------------

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await fetch("/api/orders", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch orders");
      }

      setOrders(data.orders || []);
      setError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load orders";

      setError(message);

      if (isRefresh) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --------------------------------------------------
  // FILTER + SEARCH
  // --------------------------------------------------

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        if (filterStatus === "all") return true;
        return order.status === filterStatus;
      })
      .filter((order) => {
        if (!term) return true;

        return (
          order._id.toLowerCase().includes(term) ||
          (order.tracking_number &&
            String(order.tracking_number).toLowerCase().includes(term)) || // search by tracking
          order.shipping.name.toLowerCase().includes(term) ||
          order.shipping.email.toLowerCase().includes(term) ||
          order.shipping.phone.toLowerCase().includes(term) ||
          order.shipping.city.toLowerCase().includes(term)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
  }, [orders, filterStatus, searchTerm]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / pageSize)
  );

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // --------------------------------------------------
  // STATS
  // --------------------------------------------------

  const stats = useMemo(() => {
    const validOrders = orders.filter(
      (order) => order.status !== "cancelled"
    );

    const revenue = validOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const pending = orders.filter(
      (order) => order.status === "pending"
    ).length;

    const processing = orders.filter(
      (order) => order.status === "processing"
    ).length;

    const shipped = orders.filter(
      (order) => order.status === "shipped"
    ).length;

    const delivered = orders.filter(
      (order) => order.status === "delivered"
    ).length;

    const cancelled = orders.filter(
      (order) => order.status === "cancelled"
    ).length;

    return {
      total: orders.length,
      revenue,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
    };
  }, [orders]);

  // --------------------------------------------------
  // STATUS UPDATE
  // --------------------------------------------------

  const handleStatusUpdate = async (orderId: string, newStatus: Status) => {
    setUpdating(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      toast.success(`Order marked as ${getStatusLabel(newStatus)}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update order"
      );
    } finally {
      setUpdating(null);
    }
  };

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/orders/${deleteId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete order");
      }

      setOrders((prev) =>
        prev.filter((order) => order._id !== deleteId)
      );

      setDeleteId(null);
      toast.success("Order deleted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to delete order"
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-xl bg-slate-200" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-white ring-1 ring-slate-200"
                />
              ))}
            </div>

            <div className="h-20 rounded-2xl bg-white ring-1 ring-slate-200" />

            <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <div className="h-14 bg-slate-100" />

              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-20 border-t border-slate-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* HEADER */}
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold text-amber-600">
                Store Management
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Orders
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage customer orders, payments and fulfillment.
              </p>
            </div>

            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshIcon spinning={refreshing} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-blue-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
 href='/messages'>messages</Link>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-red-800">
                  Unable to load orders
                </p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
              <button
                onClick={() => fetchOrders()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Try again
              </button>
            </div>
          )}

          {/* KPI CARDS */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Orders"
              value={stats.total.toLocaleString()}
              description="All orders"
              icon={<OrdersIcon />}
              iconClass="bg-slate-100 text-slate-700"
            />

            <StatCard
              title="Revenue"
              value={formatCurrency(stats.revenue)}
              description="Excluding cancelled orders"
              icon={<RevenueIcon />}
              iconClass="bg-amber-50 text-amber-600"
            />

            <StatCard
              title="Pending"
              value={stats.pending.toLocaleString()}
              description="Awaiting processing"
              icon={<ClockIcon />}
              iconClass="bg-amber-50 text-amber-600"
            />

            <StatCard
              title="Delivered"
              value={stats.delivered.toLocaleString()}
              description={`${stats.shipped} currently shipped`}
              icon={<CheckIcon />}
              iconClass="bg-emerald-50 text-emerald-600"
            />
          </div>

          {/* STATUS OVERVIEW */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <MiniStatus
              label="Pending"
              value={stats.pending}
              status="pending"
            />
            <MiniStatus
              label="Processing"
              value={stats.processing}
              status="processing"
            />
            <MiniStatus
              label="Shipped"
              value={stats.shipped}
              status="shipped"
            />
            <MiniStatus
              label="Delivered"
              value={stats.delivered}
              status="delivered"
            />
            <MiniStatus
              label="Cancelled"
              value={stats.cancelled}
              status="cancelled"
            />
          </div>

          {/* FILTER TOOLBAR */}
          <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <SearchIcon />

                <input
                  type="text"
                  placeholder="Search order, customer, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-50"
                />

                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-slate-500">
                  Status
                </span>

                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as "all" | Status)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50"
                >
                  <option value="all">All orders</option>

                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {getStatusLabel(status)}
                    </option>
                  ))}
                </select>

                <span className="text-sm text-slate-400">
                  {filteredOrders.length} result
                  {filteredOrders.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE */}
          <div className="mt-6 hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Order
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Items
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Payment
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/70"
                    >
                      {/* ORDER column – now includes tracking number */}
                      <td className="px-5 py-5">
                        <div>
                          <p className="font-semibold text-slate-900">
                            #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(order.createdAt)} ·{" "}
                            {formatTime(order.createdAt)}
                          </p>
                          {order.tracking_number && (
                            <p className="mt-1 text-xs text-slate-400">
                              Track: {order.tracking_number}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                            {order.shipping.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">
                              {order.shipping.name}
                            </p>
                            <p className="max-w-[180px] truncate text-xs text-slate-400">
                              {order.shipping.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ITEMS */}
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {order.items.slice(0, 3).map((item, index) =>
                              item.image ? (
                                <Image
                                  key={`${item.productId}-${index}`}
                                  src={item.image}
                                  alt={item.name}
                                  width={36}
                                  height={36}
                                  unoptimized
                                  className="h-9 w-9 rounded-lg border-2 border-white object-cover"
                                />
                              ) : (
                                <div
                                  key={`${item.productId}-${index}`}
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white bg-slate-100 text-xs font-semibold text-slate-500"
                                >
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                              )
                            )}
                          </div>

                          <span className="text-sm text-slate-600">
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}{" "}
                            unit
                            {order.items.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            ) !== 1
                              ? "s"
                              : ""}
                          </span>
                        </div>
                      </td>

                      {/* PAYMENT */}
                      <td className="px-5 py-5">
                        <p className="text-sm font-medium capitalize text-slate-700">
                          {order.paymentMethod === "cod"
                            ? "Cash on Delivery"
                            : order.paymentMethod}
                        </p>
                      </td>

                      {/* TOTAL */}
                      <td className="px-5 py-5">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(order.total)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatCurrency(order.subtotal)} subtotal
                        </p>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-5">
                        <StatusSelect
                          order={order}
                          updating={updating === order._id}
                          onChange={handleStatusUpdate}
                        />
                      </td>

                      {/* ACTION */}
                      <td className="px-5 py-5 text-right">
                        <button
                          onClick={() =>
                            setExpandedOrder(
                              expandedOrder === order._id ? null : order._id
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          {expandedOrder === order._id ? "Close" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* EXPANDED ORDER */}
            {expandedOrder && (
              <ExpandedOrder
                order={orders.find((order) => order._id === expandedOrder)}
                onDelete={() => setDeleteId(expandedOrder)}
              />
            )}
          </div>

          {/* MOBILE ORDERS */}
          <div className="mt-6 space-y-4 lg:hidden">
            {paginatedOrders.map((order) => (
              <div
                key={order._id}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                      {order.shipping.name.charAt(0).toUpperCase()}
                    </div>

                    <div>
                      {/* ✅ Fixed: tracking number now comes from order.tracking_number */}
                      <p className="font-semibold text-slate-900">
                        {order.tracking_number || "—"}
                      </p>
                      <p className="font-semibold text-slate-900">
                        {order.shipping.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <StatusBadge status={order.status} />
                </div>

                <div className="my-4 border-t border-slate-100" />

                <div className="grid grid-cols-2 gap-4">
                  <Info label="Total">
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(order.total)}
                    </span>
                  </Info>

                  <Info label="Payment">
                    <span className="capitalize">
                      {order.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : order.paymentMethod}
                    </span>
                  </Info>

                  <Info label="Date">{formatDate(order.createdAt)}</Info>

                  <Info label="Items">
                    {order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}{" "}
                    units
                  </Info>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Update status
                  </label>

                  <StatusSelect
                    order={order}
                    updating={updating === order._id}
                    onChange={handleStatusUpdate}
                    fullWidth
                  />
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() =>
                      setExpandedOrder(
                        expandedOrder === order._id ? null : order._id
                      )
                    }
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    {expandedOrder === order._id ? "Hide details" : "View details"}
                  </button>

                  <button
                    onClick={() => setDeleteId(order._id)}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>

                {expandedOrder === order._id && (
                  <ExpandedOrder
                    order={order}
                    onDelete={() => setDeleteId(order._id)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* EMPTY */}
          {paginatedOrders.length === 0 && (
            <div className="mt-6 rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <SearchIcon size={22} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No orders found
              </h3>

              <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                Try changing your search term or status filter.
              </p>

              {(searchTerm || filterStatus !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterStatus("all");
                  }}
                  className="mt-5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* PAGINATION */}
          {filteredOrders.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-medium text-slate-700">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-700">
                  {Math.min(currentPage * pageSize, filteredOrders.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-700">
                  {filteredOrders.length}
                </span>{" "}
                orders
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white">
                    {currentPage}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
        <DeleteModal
          loading={deleting}
          onCancel={() => {
            if (!deleting) setDeleteId(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}

/* ========================================================= */
/* STAT CARD */
/* ========================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">{description}</p>
    </div>
  );
}

/* ========================================================= */
/* MINI STATUS */
/* ========================================================= */

function MiniStatus({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: Status;
}) {
  const style = STATUS_STYLES[status];

  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

/* ========================================================= */
/* STATUS BADGE */
/* ========================================================= */

function StatusBadge({ status }: { status: Status }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

/* ========================================================= */
/* STATUS SELECT */
/* ========================================================= */

function StatusSelect({
  order,
  updating,
  onChange,
  fullWidth = false,
}: {
  order: Order;
  updating: boolean;
  onChange: (orderId: string, status: Status) => void;
  fullWidth?: boolean;
}) {
  const style = STATUS_STYLES[order.status];

  return (
    <div className={`relative ${fullWidth ? "w-full" : "inline-block"}`}>
      <select
        value={order.status}
        disabled={updating}
        onChange={(e) => onChange(order._id, e.target.value as Status)}
        className={`w-full appearance-none rounded-full border-0 py-2 pl-3 pr-8 text-xs font-semibold capitalize outline-none ring-1 transition disabled:cursor-wait disabled:opacity-60 ${style.badge}`}
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status} className="bg-white text-slate-800">
            {status}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs">
        {updating ? "..." : "⌄"}
      </span>
    </div>
  );
}

/* ========================================================= */
/* EXPANDED ORDER */
/* ========================================================= */

function ExpandedOrder({
  order,
  onDelete,
}: {
  order?: Order;
  onDelete: () => void;
}) {
  if (!order) return null;

  return (
    <div className="border-t border-slate-200 bg-slate-50/70 p-5">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* CUSTOMER */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer
          </p>

          <div className="space-y-2 text-sm">
            {/* ✅ Fixed: tracking number from order root */}
            <p>{order.tracking_number || "No tracking"}</p>
            <p className="font-semibold text-slate-900">
              {order.shipping.name}
            </p>

            <p className="text-slate-600">{order.shipping.email}</p>

            <p className="text-slate-600">{order.shipping.phone}</p>

            <p className="leading-6 text-slate-600">
              {order.shipping.address}
              <br />
              {order.shipping.city}
            </p>
          </div>
        </div>

        {/* PRODUCTS */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Products
          </p>

          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={`${item.productId}-${index}`} className="flex items-center gap-3">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={44}
                    height={44}
                    unoptimized
                    className="h-11 w-11 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-400 ring-1 ring-slate-200">
                    {item.name.charAt(0)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Order Summary
          </p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-700">
                {formatCurrency(order.subtotal)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Delivery</span>
              <span className="font-medium text-slate-700">
                {formatCurrency(order.deliveryFee)}
              </span>
            </div>

            <div className="my-3 border-t border-slate-200" />

            <div className="flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(order.total)}
              </span>
            </div>

            <div className="pt-2">
              <p className="text-xs text-slate-400">Payment</p>
              <p className="mt-1 font-medium capitalize text-slate-700">
                {order.paymentMethod === "cod"
                  ? "Cash on Delivery"
                  : order.paymentMethod}
              </p>
            </div>
          </div>

          <button
            onClick={onDelete}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <TrashIcon />
            Delete order
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* INFO */
/* ========================================================= */

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-600">{children}</p>
    </div>
  );
}

/* ========================================================= */
/* DELETE MODAL */
/* ========================================================= */

function DeleteModal({
  loading,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <TrashIcon size={21} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">
          Delete this order?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          This action permanently removes the order from your system. You should
          only do this if you are certain the order should no longer exist.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Deleting..." : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* ICONS */
/* ========================================================= */

function OrdersIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2h9l3 3v17H6z" />
      <path d="M15 2v4h4" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
      <path d="M9 9h2" />
    </svg>
  );
}

function RevenueIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20" />
      <path d="M17 5.5A5 5 0 0 0 12 3c-2.8 0-5 1.5-5 3.5S9.2 10 12 10s5 1.5 5 3.5-2.2 3.5-5 3.5a5 5 0 0 1-5-2.5" />
    </svg>
  );
}

function ClockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function RefreshIcon({
  size = 17,
  spinning = false,
}: {
  size?: number;
  spinning?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "animate-spin" : ""}
    >
      <path d="M20 11a8.1 8.1 0 0 0-14.8-4L3 10" />
      <path d="M3 4v6h6" />
      <path d="M4 13a8.1 8.1 0 0 0 14.8 4L21 14" />
      <path d="M21 20v-6h-6" />
    </svg>
  );
}

function TrashIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}