import mongoose from "mongoose";

const callSchema = new mongoose.Schema({
    caller:   { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    // completed | rejected | missed
    status:   { type: String, enum: ["completed", "rejected", "missed"], default: "missed" },
    duration: { type: Number, default: 0 }, // seconds
    startedAt: { type: Date, default: Date.now },
    endedAt:   { type: Date },
}, { timestamps: true });

export default mongoose.model("Call", callSchema);
