import {Router} from "express"
import {verifyToken} from "../middleware/middleware.js" 
import { storeMessages, fetchMessages, markMessagesAsRead, deleteMessageForMe, deleteMessageForEveryone, clearChat } from "../controller/messagesController.js"
const messageRouter=Router() 

messageRouter.post("/messages", verifyToken, storeMessages)
messageRouter.put("/messages/read/:conversationId", verifyToken, markMessagesAsRead)
messageRouter.delete("/messages/clear/:conversationId", verifyToken, clearChat)
messageRouter.delete("/messages/:messageId/me", verifyToken, deleteMessageForMe)
messageRouter.delete("/messages/:messageId/everyone", verifyToken, deleteMessageForEveryone)
messageRouter.get("/messages/:conversationId", verifyToken, fetchMessages)

export default messageRouter



