
import {Router} from  "express"
import {startConversation, getConversation, createGroupConversation, getUserConversations, uploadGroupPic} from "../controller/conversationController.js"
import {verifyToken} from "../middleware/middleware.js"
import multer from "multer"
import path from "path"

const conversationRouter=Router()

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, "uploads/"); },
    filename: function (req, file, cb) {
        cb(null, req.user.id + "-group-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Not an image!"), false);
    }
});

conversationRouter.post("/conversation",verifyToken, startConversation) 
conversationRouter.get("/conversation", verifyToken, getUserConversations) 
conversationRouter.get("/conversation/:id",verifyToken, getConversation) 
conversationRouter.post("/conversation/group", verifyToken, createGroupConversation)
conversationRouter.put("/conversation/group-pic/:id", verifyToken, upload.single("groupPic"), uploadGroupPic)

export default conversationRouter