import express from "express";
import Call from "../model/Call.js";
import { verifyToken } from "../middleware/middleware.js";

const router = express.Router();

/**
 * GET /api/calls
 * Returns call history for the logged-in user (most recent first).
 */
router.get("/calls", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        if (!userId) return res.status(401).json({ error: "User identity not found" });

        const calls = await Call.find({
            $or: [{ caller: userId }, { receiver: userId }]
        })
            .populate("caller",   "name profilePic")
            .populate("receiver", "name profilePic")
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(calls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/calls/:id
 * Fetch a single call record by ID (for CallDetailView).
 */
router.get("/calls/:id", verifyToken, async (req, res) => {
    try {
        const call = await Call.findById(req.params.id)
            .populate("caller",   "name profilePic")
            .populate("receiver", "name profilePic");
        if (!call) return res.status(404).json({ error: "Not found" });
        res.json(call);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/calls
 * Create a call record when a call is initiated.
 */
router.post("/calls", verifyToken, async (req, res) => {
    try {
        const { receiverId, conversationId } = req.body;
        const userId = req.user.id || req.user._id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const call = await Call.create({
            caller: userId,
            receiver: receiverId,
            conversationId,
            status: "missed", // default; updated when completed or rejected
        });
        res.status(201).json(call);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * PUT /api/calls/:id
 * Update a call record (status: completed | rejected | missed, duration).
 */
router.put("/calls/:id", verifyToken, async (req, res) => {
    try {
        const { status, duration } = req.body;
        const call = await Call.findByIdAndUpdate(
            req.params.id,
            { status, duration, endedAt: new Date() },
            { new: true }
        );
        if (!call) return res.status(404).json({ error: "Call not found" });
        res.json(call);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
