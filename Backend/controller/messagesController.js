
import Message from "../model/messageModel.js" 
import conversation from "../model/conversationModel.js"
import userModel from "../model/userModel.js"
    
export async function storeMessages(req,res){
   
   const {conversationId, text}=req.body;
   console.log(conversationId)
    const message = await Message.create({
        conversationId,
        senderId: req.user.id,
        text,
        readBy: [req.user.id],
    });

    // Update parent conversation
    await conversation.findByIdAndUpdate(conversationId, {
        lastMessage: {
            text,
            sender: req.user.id,
            readBy: [req.user.id],
            createdAt: new Date(),
        },
    });

    const io = req.app.get("io");
    if (io) {
        // Fetch full sender data because req.user only contains the ID from the JWT
        const sender = await userModel.findById(req.user.id).select("name profilePic");
        
        const fullMessage = message.toObject();
        fullMessage.senderId = {
            _id: sender?._id || req.user.id,
            name: sender?.name || "User",
            profilePic: sender?.profilePic
        };
        
        // Emit message to everyone in the room
        io.to(conversationId).emit("receive_msg", fullMessage);
        // Special notify for sidebar update
        io.to(conversationId).emit("sidebar_update", { conversationId });
    }

    res.json(message);
}


export async function fetchMessages(req, res){
    // console.log("id",req.params.conversationId) 
    const {conversationId}=req.params; 
    const {cursor, limit} =req.query; 
    let query={
        conversationId,
        deletedFor: { $ne: req.user.id } // NEVER send messages the user explicitly deleted independently 
    };
    if(cursor) {
        query._id={$lt:cursor}
    }
    console.log("q",query._id)
  const message=await  Message.find(query).sort({_id:-1}).limit(parseInt(limit)).populate("senderId", "name profilePic");
  
    res.json(message)
}    

// --- NEW: Mark Messages as Read Tracker ---
export async function markMessagesAsRead(req, res) {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        // Add the current user's ID to the readBy array on all messages in this conversation where they aren't already included
        const result = await Message.updateMany(
            { conversationId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        // Also update the Conversation's lastMessage snippet
        await conversation.findByIdAndUpdate(conversationId, {
            $addToSet: { "lastMessage.readBy": userId }
        });

        if (result.modifiedCount > 0) {
            const io = req.app.get("io");
            if (io) {
                 io.to(conversationId).emit("messages_read", { conversationId, userId });
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json(err);
    }
}

// --- DELETION LOGIC ---
export async function deleteMessageForMe(req, res) {
    try {
        const { messageId } = req.params;
        const msg = await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: req.user.id } });
        
        const io = req.app.get("io");
        if (io && msg) {
             io.to(msg.conversationId.toString()).emit("sidebar_update", { conversationId: msg.conversationId });
        }

        res.status(200).json({ success: true, message: "Deleted for you" });
    } catch (err) { res.status(500).json(err); }
}

export async function deleteMessageForEveryone(req, res) {
    try {
        const { messageId } = req.params;
        const msg = await Message.findById(messageId);
        
        if (!msg) return res.status(404).json("Message not found");
        if (msg.senderId.toString() !== req.user.id) return res.status(403).json("Not authorized to delete others' messages for everyone");

        msg.isDeletedForEveryone = true;
        msg.text = "🚫 This message was deleted";
        await msg.save();

        const io = req.app.get("io");
        if (io) {
             io.to(msg.conversationId.toString()).emit("message_deleted_everyone", { messageId, text: msg.text });
             io.to(msg.conversationId.toString()).emit("sidebar_update", { conversationId: msg.conversationId });
        }

        res.status(200).json({ success: true, message: "Deleted for everyone" });
    } catch (err) { res.status(500).json(err); }
}

export async function clearChat(req, res) {
    try {
        const { conversationId } = req.params;
        await Message.updateMany({ conversationId }, { $addToSet: { deletedFor: req.user.id } });
        
        const io = req.app.get("io");
        if (io) {
             io.to(conversationId).emit("sidebar_update", { conversationId });
        }

        res.status(200).json({ success: true, message: "Chat cleared" });
    } catch (err) { res.status(500).json(err); }
}