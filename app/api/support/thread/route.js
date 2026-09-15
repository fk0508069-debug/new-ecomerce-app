import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import SupportMessage from "@/models/SupportMessage";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const convo = await Conversation.findOne({ userId }).lean();
  if (!convo) return NextResponse.json({ ok: true, messages: [] });

  const messages = await SupportMessage.find({ conversationId: convo._id })
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