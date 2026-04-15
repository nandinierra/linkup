import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        unique: true,
        sparse: true, // Users without a phone number can still exist
        index: true
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: ""
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    settings: {
        notifications: {
            type: Boolean,
            default: true
        },
        readReceipts: {
            type: Boolean,
            default: true
        }
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    isBusy: {
        type: Boolean,
        default: false
    },
    contacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    incomingRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    outgoingRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    suggestedContacts: {
        matchedUsers: { type: Array, default: [] },
        unmatchedContacts: { type: Array, default: [] },
        lastSynced: { type: Date }
    },
    requestHistory: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        type: { type: String, enum: ["incoming", "outgoing"] },
        status: { type: String, enum: ["accepted", "rejected"] },
        at: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const userModel = mongoose.model("user", userSchema);
export default userModel;