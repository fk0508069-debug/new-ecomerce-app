import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Conversation from "@/models/Conversation";
import SupportMessage from "@/models/SupportMessage";

export async function POST(req) {
  await connectDB();
  const { userId, text } = await req.json();

  if (!userId || !text?.trim()) {
    return NextResponse.json({ error: "userId and text required" }, { status: 400 });
  }

  const user = await User.findById(userId).lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // find or create the customer's thread
  let convo = await Conversation.findOne({ userId });
  if (!convo) {
    convo = await Conversation.create({ userId });
  } else if (convo.status === "closed") {
    convo.status = "open";
  }

  const msg = await SupportMessage.create({
    conversationId: convo._id,
    senderId: user._id,
    senderRole: "customer",
    senderName: user.name,
    text: text.trim(),
  });

  convo.lastMessageAt = msg.createdAt;
  convo.lastMessageText = msg.text.slice(0, 120);
  convo.lastSenderRole = "customer";
  convo.unreadByAgent += 1;
  await convo.save();

  return NextResponse.json({ ok: true, messageId: msg._id });
}