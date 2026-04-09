

import conversation from "../model/conversationModel.js"
import userModel from "../model/userModel.js";
import Message from "../model/messageModel.js";

export async function startConversation(req, res){

    const {receiverId}=req.body; 
    const senderId=req.user.id; 
    //  console.log(senderId)
     const participants=[receiverId,senderId].sort(); 
     const conversationKey=  participants.join("_")

  let Conversation = await  conversation.findOne({conversationKey })
   
    if(!Conversation){
        Conversation=await conversation.create({
                participants,conversationKey,
                isGroupChat: false

         })
    }
  Conversation =await  Conversation.populate("participants", "name profilePic")
    // console.log(Conversation)
     res.json(Conversation) 


}

export async function getConversation(req,res){
   try {
       const conversationId=req.params.id; 
       let conversationObj=await conversation.findById(conversationId).populate("participants", "name profilePic")
       if (!conversationObj) return res.status(404).json({ message: "Not found" });
       res.status(200).json(conversationObj);
   } catch (err) {
       res.status(400).json({ message: "Invalid ID Format" });
   }
}

// --- ADD THIS NEW FUNCTION FOR GROUPS ---
export async function createGroupConversation(req, res) {
    // Expecting an array of user IDs and a string groupName
    let { participantIds, groupName } = req.body; 
    const adminId = req.user.id; // The person creating the group
    // Make sure the admin is included in the group
    if (!participantIds.includes(adminId)) {
        participantIds.push(adminId);
    }
    if (participantIds.length < 2) {
        return res.status(400).send("More than 2 users are required to form a group chat");
    }
    try {
        // Generate a random unique string for the conversationKey
        const uniqueGroupKey = `group_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const groupConversation = await conversation.create({
            groupName,
            isGroupChat: true,
            participants: participantIds,
            admin: adminId,
            conversationKey: uniqueGroupKey // <--- FIX: This satisfies MongoDB's unique key constraint!
        });
        const fullGroupConversation = await groupConversation.populate("participants", "name profilePic");
        res.status(200).json(fullGroupConversation);
    } catch (err) {
        res.status(500).json(err);
    }
}

// --- ADD THIS NEW FUNCTION FOR RECENT CHATS ---
export async function getUserConversations(req, res) {
    try {
        const userId = req.user.id;
        
        // Find any conversation where this user's ID exists in the participants array
        const userConvos = await conversation.find({
            participants: { $in: [userId] }
        })
        .populate("participants", "name profilePic") // Populate names and pics for UI display
        .populate("lastMessage.sender", "name profilePic") // Support fetching the name and pic of whoever sent the last message
        .sort({ "lastMessage.createdAt": -1 })
        .lean(); // Use lean so we can append properties to the result if needed
        
        // Automatically backfill any older conversations that don't have a lastMessage saved!
        // Also: Unread Message calculation per conversation!
        for (let convo of userConvos) {
             // 1. Calculate Unseen Badges for this specific userId
            convo.unseenCount = await Message.countDocuments({ 
                conversationId: convo._id, 
                readBy: { $ne: userId },
                deletedFor: { $ne: userId }
            });

            // 2. Fetch the absolute true latest message that hasn't been scrubbed by this user
            const latestMsg = await Message.findOne({ 
                conversationId: convo._id,
                deletedFor: { $ne: userId }
            }).sort({ createdAt: -1 }).populate("senderId", "name profilePic").lean();
            
            if (latestMsg) {
                convo.lastMessage = {
                    text: latestMsg.isDeletedForEveryone ? "🚫 This message was deleted" : latestMsg.text,
                    sender: latestMsg.senderId,
                    createdAt: latestMsg.createdAt,
                    readBy: latestMsg.readBy 
                };
            } else {
                convo.lastMessage = null; // Blank chat
            }
        }
        
        res.status(200).json(userConvos);
    } catch (err) {
        res.status(500).json(err);
    }
}

export async function uploadGroupPic(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const { id } = req.params;
        const groupPicUrl = `http://localhost:4000/uploads/${req.file.filename}`;
        
        const updatedChat = await conversation.findByIdAndUpdate(
            id,
            { groupPic: groupPicUrl },
            { new: true }
        );
        
        const io = req.app.get("io");
        if (io) {
             io.to(id).emit("sidebar_update", { conversationId: id });
        }

        res.status(200).json({ success: true, conversation: updatedChat });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}