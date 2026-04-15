import mongoose from "mongoose";

const contactRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

// Prevent duplicate pending/accepted requests between same users
contactRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);
export default ContactRequest;
