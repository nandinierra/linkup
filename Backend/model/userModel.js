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
    }]
}, { timestamps: true });

const userModel = mongoose.model("user", userSchema);
export default userModel;