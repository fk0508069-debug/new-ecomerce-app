import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import SupportMessage from "@/models/SupportMessage";

export async function GET() {
  await connectDB();

  return NextResponse.json({
    ok: true,
    message: "Support API is running.",
  });
}

export async function POST(req) {
  await connectDB();
  const { userId, text } = await req.json().catch(() => ({}));

  if (!userId || !text?.trim()) {
    return NextResponse.json({ error: "userId and text required" }, { status: 400 });
  }

  const conversation = await Conversation.findOne({ userId }).lean();
  if (!conversation) {
    return NextResponse.json({ ok: true, messages: [] });
  }

  const messages = await SupportMessage.find({ conversationId: conversation._id })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({
    ok: true,
    messages: messages.map((m) => ({
      _id: m._id,
      text: m.text,
      senderRole: m.senderRole,
      senderName: m.senderName,
      createdAt: m.createdAt,
      mine: m.senderRole === "customer",
    })),
  });
}