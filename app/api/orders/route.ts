import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { randomInt } from "crypto";

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, items, shipping, paymentMethod } = body;

    // Validation
    if (!items?.length || !shipping?.name || !shipping?.address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch products from DB to get accurate prices
    const productIds = items.map((item: any) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(
      products.map((p) => [p._id.toString(), p])
    );

    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      const price = Number(product.price);
      const quantity = Number(item.quantity);
      orderItems.push({
        productId: product._id.toString(),
         quantity: Number(quantity),
        name : product.name,
        price,
        image: product.images?.[0] || "",
      });
      subtotal += price * quantity;
    }

    const deliveryFee = 50;
    const total = subtotal + deliveryFee;

    let trackingNumber = "";
    do {
      const digits = randomInt(8, 10);
      const firstDigit = randomInt(1, 10);
      const remainingDigits = randomInt(0, 10 ** (digits - 1))
        .toString()
        .padStart(digits - 1, "0");
      trackingNumber = `${firstDigit}${remainingDigits}`;
    } while (await Order.exists({ tracking_number: trackingNumber }));

    const order = await Order.create({
      userId: userId || null,
      tracking_number: trackingNumber,
      items: orderItems,

      subtotal,
      deliveryFee,
      total,
      shipping,
      paymentMethod: paymentMethod || "cod",
      status: "pending",
    });

    return NextResponse.json(
      {
        message: "Order placed successfully",
        orderId: order._id,
        tracking_number: order.tracking_number,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}