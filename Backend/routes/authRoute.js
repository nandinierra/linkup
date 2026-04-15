import {registerUser, logoutUser, loginUser, getMe, updateMe} from "../controller/authController.js" 
import {verifyToken}  from "../middleware/middleware.js"
import {Router} from "express" 

const authRoute=Router() 

authRoute.post("/register", registerUser)
authRoute.post("/logout", logoutUser)
authRoute.post("/login", loginUser)
authRoute.get("/me", verifyToken, getMe)
authRoute.put("/me", verifyToken, updateMe)
export default authRoute 


