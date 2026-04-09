import {registerUser, logoutUser, loginUser, getMe} from "../controller/authController.js" 
import {verifyToken}  from "../middleware/middleware.js"
import {Router} from "express" 



const authRoute=Router() 

authRoute.post("/register", registerUser)
authRoute.post("/logout", logoutUser)
authRoute.post("/login", loginUser)
authRoute.get("/me", verifyToken, getMe)
export default authRoute 


