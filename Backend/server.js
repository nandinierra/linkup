import express from "express";
import connectDb from "./config/db.js";
import dotenv from "dotenv";
import authRoute from "./routes/authRoute.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoute.js";
import conversationRouter from "./routes/conversationRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import callRouter from "./routes/callRoutes.js";
import contactRouter from "./routes/contactRoutes.js";
import googleRouter from "./routes/googleRoutes.js";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import userModel from "./model/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000", "https://linkup-blond.vercel.app"];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── REST API Routes ──────────────────────────────────────────────
app.get("/", (req, res) => res.send("Server is running"));
app.use("/api/auth", authRoute);
app.use("/api/users", userRouter);
app.use("/api", conversationRouter);
app.use("/api", messageRouter);
app.use("/api", callRouter);
app.use("/api/contacts", contactRouter);
app.use("/api/google", googleRouter);

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

app.set("io", io);

// WebRTC Production Signaling State
const users = {}; // userId -> socketId
const socketToUserId = {}; // socketId -> userId

io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("register_socket", async (userId) => {
        if (!userId) return;
        users[userId] = socket.id;
        socketToUserId[socket.id] = userId;
        console.log(`User Registered: ${userId} on socket ${socket.id}`);
        
        // UPDATE DATABASE: Set user as online
        try {
            const user = await userModel.findByIdAndUpdate(userId, { isOnline: true }, { new: true }).populate("contacts", "_id");
            
            // Notify only "ACCEPTED" friends that this user is now online
            const onlineFriends = user.contacts
                .map(f => f._id.toString())
                .filter(fid => users[fid]);

            onlineFriends.forEach(friendId => {
                io.to(users[friendId]).emit("UPDATE_USER_STATUS", { userId, status: "online" });
            });
        } catch (err) {
            console.error("Presence update failed (Register):", err);
        }

        // Send the list of all currently online users to the newly connected user
        socket.emit("online_users_list", Object.keys(users));
    });

    socket.on("join_room", (conversationId) => {
        socket.join(conversationId);
    });

    socket.on("send_msg", (data) => {
        socket.to(data.conversationId).emit("receive_msg", data);
    });

    socket.on("typing", ({ conversationId, userId }) => {
        socket.to(conversationId).emit("typing", { conversationId, userId });
    });

    socket.on("stop_typing", ({ conversationId, userId }) => {
        socket.to(conversationId).emit("stop_typing", { conversationId, userId });
    });

    // ── 1-to-1 Voice/Video Signaling ───────────────────────────────
    socket.on("userOnlineCheck", ({ targetUserId }) => {
        const online = !!users[targetUserId];
        socket.emit("userOnlineResult", { online, targetUserId });
    });

    // ── Contacts Events ──────────────────────────────────────────
    socket.on("send_contact_request", ({ targetUserId, senderData }) => {
        const targetSocketId = users[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("receive_contact_request", { senderData });
        }
    });

    socket.on("accept_contact_request", ({ targetUserId, accepterData }) => {
        const targetSocketId = users[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("contact_request_accepted", { accepterData });
        }
        // Also notify the accepter themselves (to refresh their own sidebar/contacts)
        socket.emit("contact_request_accepted", { accepterData });
    });

    // ── Call Events ──────────────────────────────────────────────
    socket.on("callUser", ({ receiverId, callerId, callerName, callerPic, conversationId, signal, callRecordId, isVideo }) => {
        const receiverSocketId = users[receiverId];
        if (!receiverSocketId) {
            socket.emit("userOffline");
            return;
        }
        io.to(receiverSocketId).emit("incomingCall", {
            callerId,
            callerName,
            callerPic,
            conversationId,
            signal,
            callRecordId,
            isVideo,
        });
    });

    socket.on("ringing_notify", ({ callerId }) => {
        const callerSocketId = users[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("ringing_received");
        }
    });

    socket.on("acceptCall", ({ callerId, signal }) => {
        const callerSocketId = users[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("callAccepted", { signal });
        }
    });

    socket.on("iceCandidate", ({ to, candidate }) => {
        const targetSocketId = users[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("iceCandidate", { candidate });
        }
    });

    socket.on("rejectCall", ({ callerId }) => {
        const callerSocketId = users[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("callRejected");
        }
    });

    socket.on("endCall", ({ receiverId, conversationId }) => {
        if (receiverId) {
            const targetSocketId = users[receiverId];
            if (targetSocketId) io.to(targetSocketId).emit("callEnded");
        }
        if (conversationId) {
            socket.to(conversationId).emit("callEnded");
        }
    });

    // ── Contact Requests Real-time ────────────────────────────────


    socket.on("disconnect", async () => {
        const userId = socketToUserId[socket.id];
        if (userId) {
            delete users[userId];
            delete socketToUserId[socket.id];
            try {
                // UPDATE DATABASE: Set user as offline
                const user = await userModel.findByIdAndUpdate(userId, { 
                    isOnline: false, 
                    lastSeen: new Date() 
                }, { new: true }).populate("contacts", "_id");

                if (user) {
                    // Notify only friends that this user is now offline
                    const onlineFriends = user.contacts
                        .map(f => f._id.toString())
                        .filter(fid => users[fid]);

                    onlineFriends.forEach(friendId => {
                        io.to(users[friendId]).emit("UPDATE_USER_STATUS", { userId, status: "offline" });
                    });
                }
                
                io.emit("status_change", { userId, status: "offline" }); 
            } catch (err) {
                console.error("Presence update failed (Disconnect):", err);
            }
        }
        console.log("User Disconnected:", socket.id);
    });
});

const startServer = async () => {
    await connectDb();
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
};

startServer();
