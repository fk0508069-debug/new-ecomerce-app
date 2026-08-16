"use client";

import Orders from "@/components/order";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Order = {
  _id: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  createdAt: string;
  items: {
    price: number;
    quantity: number;
  }[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const PAYMENT_COLORS = ["#0f172a", "#f59e0b"];

const formatCurrency = (value: number) =>
  `Rs ${value.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
  });

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/orders", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch orders");
        }

        setOrders(data.orders || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load analytics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // -------------------------------------------------------
  // FILTERED ORDERS
  // -------------------------------------------------------

  const filteredOrders = useMemo(() => {
    if (period === "all") return orders;

    const days = Number(period);
    const cutoff = new Date();

    cutoff.setDate(cutoff.getDate() - days);

    return orders.filter(
      (order) => new Date(order.createdAt) >= cutoff
    );
  }, [orders, period]);

  // -------------------------------------------------------
  // KPI DATA
  // -------------------------------------------------------

  const kpis = useMemo(() => {
    /*
      Cancelled orders should not contribute to actual revenue.
      This is much more useful for business analytics.
    */
    const validOrders = filteredOrders.filter(
      (order) => order.status !== "cancelled"
    );

    const revenue = validOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const orderCount = filteredOrders.length;

    const averageOrderValue =
      validOrders.length > 0 ? revenue / validOrders.length : 0;

    const pending = filteredOrders.filter(
      (order) => order.status === "pending"
    ).length;

    const processing = filteredOrders.filter(
      (order) => order.status === "processing"
    ).length;

    const shipped = filteredOrders.filter(
      (order) => order.status === "shipped"
    ).length;

    const delivered = filteredOrders.filter(
      (order) => order.status === "delivered"
    ).length;

    const cancelled = filteredOrders.filter(
      (order) => order.status === "cancelled"
    ).length;

    const cancellationRate =
      orderCount > 0 ? (cancelled / orderCount) * 100 : 0;

    const totalItems = filteredOrders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + Number(item.quantity || 0),
          0
        ),
      0
    );

    return {
      revenue,
      orderCount,
      averageOrderValue,
      pending,
      processing,
      shipped,
      delivered,
      cancelled,
      cancellationRate,
      totalItems,
    };
  }, [filteredOrders]);

  // -------------------------------------------------------
  // REVENUE + ORDERS TREND
  // -------------------------------------------------------

  const trendData = useMemo(() => {
    const map = new Map<
      string,
      {
        revenue: number;
        orders: number;
      }
    >();

    filteredOrders.forEach((order) => {
      if (order.status === "cancelled") return;

      const date = new Date(order.createdAt)
        .toISOString()
        .split("T")[0];

      const current = map.get(date) || {
        revenue: 0,
        orders: 0,
      };

      map.set(date, {
        revenue: current.revenue + Number(order.total || 0),
        orders: current.orders + 1,
      });
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        displayDate: formatDate(date),
        revenue: Math.round(values.revenue),
        orders: values.orders,
      }));
  }, [filteredOrders]);

  // -------------------------------------------------------
  // STATUS
  // -------------------------------------------------------

  const statusData = useMemo(() => {
    const statuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    return statuses
      .map((status) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: filteredOrders.filter(
          (order) => order.status === status
        ).length,
        key: status,
      }))
      .filter((item) => item.value > 0);
  }, [filteredOrders]);

  // -------------------------------------------------------
  // PAYMENT METHODS
  // -------------------------------------------------------

  const paymentData = useMemo(() => {
    const map = new Map<string, number>();

    filteredOrders.forEach((order) => {
      const method =
        order.paymentMethod?.toLowerCase() === "cod"
          ? "Cash on Delivery"
          : "Online Payment";

      map.set(method, (map.get(method) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredOrders]);

  // -------------------------------------------------------
  // TOP PRODUCTS
  // -------------------------------------------------------

  const productStats = useMemo(() => {
    const map = new Map<
      string,
      {
        quantity: number;
        revenue: number;
      }
    >();

    filteredOrders.forEach((order) => {
      if (order.status === "cancelled") return;

      order.items.forEach((item) => {
        const key = "Product";

        const current = map.get(key) || {
          quantity: 0,
          revenue: 0,
        };

        map.set(key, {
          quantity: current.quantity + Number(item.quantity || 0),
          revenue:
            current.revenue +
            Number(item.price || 0) * Number(item.quantity || 0),
        });
      });
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

  // -------------------------------------------------------
  // LOADING
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 rounded-lg bg-slate-200" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl bg-white ring-1 ring-slate-200"
                />
              ))}
            </div>

            <div className="h-[380px] rounded-2xl bg-white ring-1 ring-slate-200" />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="h-[360px] rounded-2xl bg-white ring-1 ring-slate-200" />
              <div className="h-[360px] rounded-2xl bg-white ring-1 ring-slate-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-700">
              Unable to load analytics
            </h2>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* ------------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------------ */}

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-amber-600">
              Store Analytics
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Analytics Dashboard
            </h1>



            <p className="mt-1 text-sm text-slate-500">
              Monitor your store performance and order activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
            <Orders />

        {/* ------------------------------------------------ */}
        {/* KPI CARDS */}
        {/* ------------------------------------------------ */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            title="Total Revenue"
            value={formatCurrency(kpis.revenue)}
            description="Net revenue excluding cancellations"
            accent="amber"
          />

          <MetricCard
            title="Total Orders"
            value={kpis.orderCount.toLocaleString()}
            description={`${kpis.totalItems.toLocaleString()} items sold`}
            accent="blue"
          />

          <MetricCard
            title="Average Order Value"
            value={formatCurrency(kpis.averageOrderValue)}
            description="Average value per valid order"
            accent="violet"
          />

          <MetricCard
            title="Delivered Orders"
            value={kpis.delivered.toLocaleString()}
            description={`${kpis.pending} currently pending`}
            accent="green"
          />
        </div>

        {/* ------------------------------------------------ */}
        {/* REVENUE CHART */}
        {/* ------------------------------------------------ */}

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-900">
                Revenue Performance
              </h2>

              <p className="text-sm text-slate-500">
                Revenue and order volume over time
              </p>
            </div>

            <div className="text-sm text-slate-500">
              {trendData.length} active days
            </div>
          </div>

          {trendData.length === 0 ? (
            <EmptyState message="No sales data available for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart
                data={trendData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "#64748b",
                  }}
                />

                <YAxis
                  yAxisId="revenue"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "#64748b",
                  }}
                  tickFormatter={(value) => `Rs ${value}`}
                />

                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "#64748b",
                  }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow:
                      "0 10px 25px rgba(15, 23, 42, 0.08)",
                  }}
                  formatter={(value, name) => {
                    if (name === "Revenue") {
                      return [formatCurrency(Number(value)), name];
                    }

                    return [value, name];
                  }}
                />

                <Legend />

                <Bar
                  yAxisId="revenue"
                  dataKey="revenue"
                  name="Revenue"
                  fill="#f59e0b"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />

                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="#0f172a"
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* ------------------------------------------------ */}
        {/* DISTRIBUTION */}
        {/* ------------------------------------------------ */}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ORDER STATUS */}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">
                Order Status
              </h2>

              <p className="text-sm text-slate-500">
                Current distribution of your orders
              </p>
            </div>

            {statusData.length === 0 ? (
              <EmptyState message="No order data available." />
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">

                <div className="h-[260px] w-full sm:w-1/2">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {statusData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={STATUS_COLORS[entry.key]}
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-3 sm:w-1/2">
                  {statusData.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              STATUS_COLORS[item.key],
                          }}
                        />

                        <span className="text-sm text-slate-600">
                          {item.name}
                        </span>
                      </div>

                      <span className="text-sm font-semibold text-slate-900">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* PAYMENT */}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">

            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">
                Payment Methods
              </h2>

              <p className="text-sm text-slate-500">
                How customers are paying for orders
              </p>
            </div>

            {paymentData.length === 0 ? (
              <EmptyState message="No payment data available." />
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">

                <div className="h-[260px] w-full sm:w-1/2">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={paymentData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {paymentData.map((_, index) => (
                          <Cell
                            key={index}
                            fill={
                              PAYMENT_COLORS[
                                index % PAYMENT_COLORS.length
                              ]
                            }
                          />
                        ))}
                      </Pie>

                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-4 sm:w-1/2">
                  {paymentData.map((item, index) => {
                    const percentage =
                      kpis.orderCount > 0
                        ? (item.value / kpis.orderCount) * 100
                        : 0;

                    return (
                      <div key={item.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-slate-600">
                            {item.name}
                          </span>

                          <span className="font-semibold text-slate-900">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor:
                                PAYMENT_COLORS[
                                  index % PAYMENT_COLORS.length
                                ],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------------------------ */}
        {/* OPERATIONAL METRICS */}
        {/* ------------------------------------------------ */}

        <section className="mt-6">

          <div className="mb-4">
            <h2 className="font-semibold text-slate-900">
              Operational Overview
            </h2>

            <p className="text-sm text-slate-500">
              Order fulfillment and cancellation metrics
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">

            <SmallMetric
              label="Pending"
              value={kpis.pending}
              color="text-amber-600"
            />

            <SmallMetric
              label="Processing"
              value={kpis.processing}
              color="text-blue-600"
            />

            <SmallMetric
              label="Shipped"
              value={kpis.shipped}
              color="text-violet-600"
            />

            <SmallMetric
              label="Delivered"
              value={kpis.delivered}
              color="text-emerald-600"
            />

            <SmallMetric
              label="Cancelled"
              value={kpis.cancelled}
              color="text-red-600"
            />
          </div>
        </section>

        {/* ------------------------------------------------ */}
        {/* BUSINESS INSIGHTS */}
        {/* ------------------------------------------------ */}

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <InsightCard
            title="Cancellation Rate"
            value={`${kpis.cancellationRate.toFixed(1)}%`}
            description="Percentage of orders cancelled"
          />

          <InsightCard
            title="Items Sold"
            value={kpis.totalItems.toLocaleString()}
            description="Total units across valid orders"
          />

          <InsightCard
            title="Average Order"
            value={formatCurrency(kpis.averageOrderValue)}
            description="Average revenue per valid order"
          />

        </section>

      </div>
    </div>
  );
}

/* ========================================================= */
/* COMPONENTS */
/* ========================================================= */

function MetricCard({
  title,
  value,
  description,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  accent: "amber" | "blue" | "violet" | "green";
}) {
  const accentStyles = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`rounded-xl px-3 py-2 text-xs font-semibold ${accentStyles[accent]}`}
        >
          KPI
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className={`mt-2 text-2xl font-bold ${color}`}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex h-[260px] items-center justify-center">
      <p className="text-sm text-slate-400">
        {message}
      </p>
    </div>
  );
}