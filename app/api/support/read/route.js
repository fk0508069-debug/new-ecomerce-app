import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import SupportMessage from "@/models/SupportMessage";

export async function POST(req) {
  await connectDB();
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const convo = await Conversation.findOne({ userId });
  if (!convo) return NextResponse.json({ ok: true });

  await SupportMessage.updateMany(
    { conversationId: convo._id, readByUser: false, senderRole: "agent" },
    { $set: { readByUser: true } }
  );

  convo.unreadByUser = 0;
  await convo.save();

  return NextResponse.json({ ok: true });
}