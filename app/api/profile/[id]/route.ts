// app/api/profile/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";       // adjust path if needed

type Params = { params: Promise<{ id: string }> };

/* -------------------------------------------------------------------------- */
/*                                   PUT                                      */
/* -------------------------------------------------------------------------- */
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // 1) Connect to DB
    await connectDB();

    // 2) Next 15: params is a Promise
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing user id" },
        { status: 400 }
      );
    }

    // 3) Parse body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { action } = body;

    // 4) Find user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    /* ---------------------------------------------------------------------- */
    /*                              SUPPORT                                   */
    /* ---------------------------------------------------------------------- */
    if (action === "support") {
      const phone = String(body.phone ?? "").trim();
      const message = String(body.message ?? "").trim();

      if (!message) {
        return NextResponse.json(
          { error: "Message is required" },
          { status: 400 }
        );
      }

      // TODO: persist this somewhere (e.g. SupportTicket model or email).
      // For now we just log it so the request succeeds.
      console.log("[SUPPORT TICKET]", {
        userId: user._id.toString(),
        email: user.email,
        phone,
        message,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        message: "Support request submitted successfully",
      });
    }

    /* ---------------------------------------------------------------------- */
    /*                              PASSWORD                                  */
    /* ---------------------------------------------------------------------- */
    if (action === "password") {
      const currentPassword = String(body.currentPassword ?? "");
      const newPassword = String(body.newPassword ?? "");
      const confirmPassword = String(body.confirmPassword ?? "");

      if (!currentPassword || !newPassword || !confirmPassword) {
        return NextResponse.json(
          { error: "All password fields are required" },
          { status: 400 }
        );
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json(
          { error: "New passwords do not match" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      if (await bcrypt.compare(newPassword, user.password)) {
        return NextResponse.json(
          { error: "New password must be different from current password" },
          { status: 400 }
        );
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return NextResponse.json({ message: "Password updated successfully" });
    }

    /* ---------------------------------------------------------------------- */
    /*                              USERNAME                                  */
    /* ---------------------------------------------------------------------- */
    if (action === "username") {
      const newUsername = String(body.newUsername ?? "").trim();

      if (!newUsername) {
        return NextResponse.json(
          { error: "Username cannot be empty" },
          { status: 400 }
        );
      }

      if (newUsername.length < 3 || newUsername.length > 30) {
        return NextResponse.json(
          { error: "Username must be between 3 and 30 characters" },
          { status: 400 }
        );
      }

      // Optional: prevent duplicates (only if name is unique — it isn't in your schema,
      // so remove this block if you don't want case-insensitive uniqueness)
      const existing = await User.findOne({
        name: newUsername,
        _id: { $ne: user._id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }

      user.name = newUsername;
      await user.save();

      return NextResponse.json({
        message: "Username updated successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                   GET                                      */
/* -------------------------------------------------------------------------- */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid or missing user id" },
        { status: 400 }
      );
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      date: user.date,
    });
  } catch (error: any) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}