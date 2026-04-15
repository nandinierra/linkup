import userModel from "../model/userModel.js";
import ContactRequest from "../model/ContactRequest.js";

// ── Send Contact Request ─────────────────────────────────────
export const sendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const myId = req.user.id;

        if (!myId) return res.status(401).json({ message: "Unauthorized. User ID missing." });
        if (myId.toString() === targetUserId) return res.status(400).json({ message: "Cannot add yourself." });

        // Check if a relationship already exists in the Friendship table (ContactRequest)
        const existingRequest = await ContactRequest.findOne({
            $or: [
                { sender: myId, receiver: targetUserId },
                { sender: targetUserId, receiver: myId }
            ]
        });

        if (existingRequest) {
            if (existingRequest.status === "pending") {
                return res.status(400).json({ message: "A request is already pending." });
            }
            if (existingRequest.status === "accepted") {
                return res.status(400).json({ message: "User is already in your contacts." });
            }
            if (existingRequest.status === "rejected") {
                // Prevent duplicate spam: If rejected by the OTHER person, allow re-send after 24h?
                // For now, adhere to "don't allow User B to send another one immediately"
                const hourDiff = (new Date() - new Date(existingRequest.updatedAt)) / (1000 * 60 * 60);
                if (hourDiff < 24) {
                    return res.status(403).json({ message: "Request was recently declined. Please try again later." });
                }
                // Reset to pending if enough time passed
                existingRequest.status = "pending";
                existingRequest.sender = myId;
                existingRequest.receiver = targetUserId;
                await existingRequest.save();
                
                // Update user arrays for active UI tracking
                await Promise.all([
                    userModel.findByIdAndUpdate(myId, { $addToSet: { outgoingRequests: targetUserId } }),
                    userModel.findByIdAndUpdate(targetUserId, { $addToSet: { incomingRequests: myId } })
                ]);

                return res.status(200).json({ message: "Request re-sent." });
            }
        }

        // Create new request
        await ContactRequest.create({ sender: myId, receiver: targetUserId, status: "pending" });

        // Update User models for active tracking
        const [sender, receiver] = await Promise.all([
            userModel.findByIdAndUpdate(myId, { $addToSet: { outgoingRequests: targetUserId } }, { new: true }),
            userModel.findByIdAndUpdate(targetUserId, { $addToSet: { incomingRequests: myId } })
        ]);

        res.status(200).json({ message: "Request sent successfully.", outgoingRequests: sender.outgoingRequests });
    } catch (err) {
        console.error("sendRequest error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ── Accept Contact Request ───────────────────────────────────
export const acceptRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const myId = req.user.id;

        // 1. Update the Friendship Table status
        const request = await ContactRequest.findOneAndUpdate(
            { sender: targetUserId, receiver: myId, status: "pending" },
            { status: "accepted" },
            { new: true }
        );

        if (!request) return res.status(404).json({ message: "No pending request found." });

        // 2. Clear from active request arrays and add to contacts
        const [me, other] = await Promise.all([
            userModel.findByIdAndUpdate(myId, {
                $pull: { incomingRequests: targetUserId },
                $addToSet: { contacts: targetUserId }
            }, { new: true }),
            userModel.findByIdAndUpdate(targetUserId, {
                $pull: { outgoingRequests: myId },
                $addToSet: { contacts: myId }
            })
        ]);

        res.status(200).json({ message: "Request accepted.", contacts: me.contacts });
    } catch (err) {
        console.error("acceptRequest error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ── Reject Contact Request ───────────────────────────────────
export const rejectRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const myId = req.user.id;

        // 1. HARD PART: Update rather than Delete
        const request = await ContactRequest.findOneAndUpdate(
            { sender: targetUserId, receiver: myId, status: "pending" },
            { status: "rejected" },
            { new: true }
        );

        if (!request) return res.status(404).json({ message: "Request not found." });

        // 2. Remove from active tracking arrays, but keep the record in ContactRequest
        await Promise.all([
            userModel.findByIdAndUpdate(myId, { $pull: { incomingRequests: targetUserId } }),
            userModel.findByIdAndUpdate(targetUserId, { $pull: { outgoingRequests: myId } })
        ]);

        res.status(200).json({ message: "Request rejected successfully." });
    } catch (err) {
        console.error("rejectRequest error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ── Get Contacts ─────────────────────────────────────────────
export const getContacts = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).populate("contacts", "name email profilePic isOnline lastSeen isBusy");
        res.status(200).json(user.contacts || []);
    } catch (err) {
        console.error("getContacts error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ── Get Requests (Enhanced with History) ─────────────────────
export const getRequests = async (req, res) => {
    try {
        const myId = req.user.id;
        
        // Fetch all records where user is involved
        const allRequests = await ContactRequest.find({
            $or: [{ sender: myId }, { receiver: myId }]
        }).populate("sender receiver", "name email profilePic");

        const incoming = [];
        const outgoing = [];
        const history = [];

        allRequests.forEach(reqDoc => {
            const isSender = reqDoc.sender._id.toString() === myId;
            const otherUser = isSender ? reqDoc.receiver : reqDoc.sender;

            if (reqDoc.status === "pending") {
                if (isSender) outgoing.push(otherUser);
                else incoming.push(otherUser);
            } else {
                // Add to history list with labels
                history.push({
                    user: otherUser,
                    status: reqDoc.status,
                    type: isSender ? "outgoing" : "incoming",
                    at: reqDoc.updatedAt
                });
            }
        });

        res.status(200).json({ incoming, outgoing, history });
    } catch (err) {
        console.error("getRequests error:", err);
        res.status(500).json({ message: err.message });
    }
};

// ── Search Users ─────────────────────────────────────────────
export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json([]);

        const users = await userModel.find({
            $and: [
                { _id: { $ne: req.user.id } },
                {
                    $or: [
                        { name: { $regex: q, $options: "i" } },
                        { email: { $regex: q, $options: "i" } }
                    ]
                }
            ]
        }).select("name email profilePic").limit(10);

        res.status(200).json(users);
    } catch (err) {
        console.error("searchUsers error:", err);
        res.status(500).json({ message: err.message });
    }
};
