import userModel from "../model/userModel.js";

// ── Send Contact Request ─────────────────────────────────────
export const sendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const myId = req.user.id; // Corrected from _id

        if (!myId) return res.status(401).json({ message: "Unauthorized. User ID missing." });
        if (myId.toString() === targetUserId) return res.status(400).json({ message: "Cannot add yourself." });

        const [sender, receiver] = await Promise.all([
            userModel.findById(myId),
            userModel.findById(targetUserId)
        ]);

        if (!receiver) return res.status(404).json({ message: "User not found." });

        // Ensure fields exist
        if (!sender.contacts) sender.contacts = [];
        if (!sender.outgoingRequests) sender.outgoingRequests = [];
        if (!receiver.incomingRequests) receiver.incomingRequests = [];

        if (sender.contacts.includes(targetUserId)) return res.status(400).json({ message: "Already in contacts." });
        if (sender.outgoingRequests.includes(targetUserId)) return res.status(400).json({ message: "Request already pending." });

        // Update both sides
        sender.outgoingRequests.push(targetUserId);
        receiver.incomingRequests.push(myId);

        await Promise.all([sender.save(), receiver.save()]);

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
        const myId = req.user.id; // Corrected from _id

        const [me, other] = await Promise.all([
            userModel.findById(myId),
            userModel.findById(targetUserId)
        ]);

        if (!me.incomingRequests.includes(targetUserId)) return res.status(400).json({ message: "No pending request." });

        // Remove from requests
        me.incomingRequests = me.incomingRequests.filter(id => id.toString() !== targetUserId.toString());
        other.outgoingRequests = other.outgoingRequests.filter(id => id.toString() !== myId.toString());

        // Add to contacts
        if (!me.contacts) me.contacts = [];
        if (!other.contacts) other.contacts = [];
        
        me.contacts.push(targetUserId);
        other.contacts.push(myId);

        await Promise.all([me.save(), other.save()]);

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
        const myId = req.user.id; // Corrected from _id

        const [me, other] = await Promise.all([
            userModel.findById(myId),
            userModel.findById(targetUserId)
        ]);

        me.incomingRequests = me.incomingRequests.filter(id => id.toString() !== targetUserId.toString());
        other.outgoingRequests = other.outgoingRequests.filter(id => id.toString() !== myId.toString());

        await Promise.all([me.save(), other.save()]);

        res.status(200).json({ message: "Request rejected." });
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

// ── Get Requests ─────────────────────────────────────────────
export const getRequests = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id)
            .populate("incomingRequests", "name email profilePic")
            .populate("outgoingRequests", "name email profilePic");
        
        res.status(200).json({
            incoming: user.incomingRequests || [],
            outgoing: user.outgoingRequests || []
        });
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
        }).select("name email profilePic contacts incomingRequests outgoingRequests").limit(10);

        res.status(200).json(users);
    } catch (err) {
        console.error("searchUsers error:", err);
        res.status(500).json({ message: err.message });
    }
};
