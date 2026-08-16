import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

// Helper for consistent error responses
const errorResponse = (message: string, status: number = 500) =>
  NextResponse.json({ error: message }, { status });

/**
 * GET /api/orders/[id]
 * Fetch a single order by ID
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return errorResponse("Order ID is required", 400);

    await connectDB();
    const order = await Order.findById(id);

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error: any) {
    console.error("❌ GET /api/orders/[id] error:", error);
    return errorResponse(error.message || "Failed to fetch order");
  }
}

/**
 * PUT /api/orders/[id]
 * Update order status (and optionally other fields)
 */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return errorResponse("Order ID is required", 400);

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return errorResponse("Status is required", 400);
    }

    // Validate status against allowed enum
    const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(
        `Invalid status. Must be one of: ${allowedStatuses.join(", ")}`,
        400
      );
    }

    await connectDB();
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return errorResponse("Order not found", 404);
    }

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error: any) {
    console.error("❌ PUT /api/orders/[id] error:", error);
    return errorResponse(error.message || "Failed to update order");
  }
}

/**
 * DELETE /api/orders/[id]
 * Delete an order by ID
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return errorResponse("Order ID is required", 400);

    await connectDB();
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return errorResponse("Order not found", 404);
    }

    return NextResponse.json(
      { message: "Order deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ DELETE /api/orders/[id] error:", error);
    return errorResponse(error.message || "Failed to delete order");
  }
}