import mongoose from "mongoose";

const SupportMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["customer", "agent"], required: true },
    senderName: { type: String, default: "" }, // denormalized for cheap rendering
    text:       { type: String, required: true, trim: true, maxlength: 4000 },

    readByAgent: { type: Boolean, default: false },
    readByUser:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

SupportMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.SupportMessage ||
  mongoose.model("SupportMessage", SupportMessageSchema);