import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one open thread per customer
    },
    status: { type: String, enum: ["open", "closed"], default: "open" },

    lastMessageAt:   { type: Date, default: Date.now },
    lastMessageText: { type: String, default: "" },
    lastSenderRole:  { type: String, enum: ["customer", "agent"], default: "customer" },

    unreadByAgent: { type: Number, default: 0 },
    unreadByUser:  { type: Number, default: 0 },
  },
  { timestamps: true }
);

ConversationSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);