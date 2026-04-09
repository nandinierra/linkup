import {Router} from "express"
import {getUsers, uploadProfilePic, updateProfile, updatePassword, getUserById} from "../controller/userController.js"
import {getMe} from "../controller/authController.js"
import {verifyToken} from "../middleware/middleware.js"
import multer from "multer"
import path from "path"
import fs from "fs"

const userRoute=Router() 

// Ensure uploads folder exists so Multer does not crash
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, "uploads/"); },
    filename: function (req, file, cb) {
        cb(null, req.user.id + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Not an image!"), false);
    }
});

userRoute.get("/db", verifyToken, getUsers) 
userRoute.get("/me", verifyToken, getMe)
userRoute.get("/:id", verifyToken, getUserById)
userRoute.put("/update", verifyToken, updateProfile)
userRoute.put("/password", verifyToken, updatePassword)
userRoute.post("/upload-avatar", verifyToken, upload.single("profilePic"), uploadProfilePic)

export default userRoute;



