import {z} from "zod"     
import userModel from "../model/userModel.js"
import bcrypt from "bcrypt" 
import jwt from "jsonwebtoken" 
export async function registerUser(req,res){
  
    console.log(req)
     const {name, email, password}=req.body;
     const userRules=z.object({
        name:z.string().min(3, "name should contain atleast 3 characters")
        .max(15, "name should not exeed more than 15 characters").trim(),
        email:z.string().toLowerCase().trim(),
        password:z.string().min(4, "password should contain atleast 4 letters").max(100, "password should contain atmost 100 characters").trim()
     })
    const result= userRules.safeParse({name, email, password}); 
    if(!result.success){
        return res.status(400).json({
            message:"validation error",
            error:result.error
        })
    }

    try{
    const existingUser=await userModel.findOne({email})
     if(existingUser){
        return res.status(409).json({
            message:"user already exists"
        })
     } 
     const hashedPassword=await bcrypt.hash(password, 10);
     const userDetails=await userModel.create({
        name,
        email,
        password:hashedPassword
     })
     const secretCode=process.env.SECRETCODE
     console.log("idbro",userDetails._id)
     const payload={
        id:userDetails._id
     }
     const jwtToken=jwt.sign(payload, secretCode, {expiresIn:"30d"})
      res.cookie("jwt_token", jwtToken,{
        httpOnly:true,
        secure:false,
        sameSite:"lax",
        maxAge:30*24*60*60*1000
      })
    
      return  res.status(200).json({
        message:"token created successfully"
      })

    }catch(e){
        console.log(e.message)
        return res.status(500).json({
            message:"Internal server Error"
        })
    }
    

}


export async function logoutUser(req, res){
   
    res.clearCookie("jwt_token",{
        httpOnly:true,
        secure:false,
        sameSite:"lax"
    })

    return res.status(201).json({
        message:"cookie removed successfully"
    })
}




export async function loginUser(req, res){ 
    const {email, password} = req.body;

      const userRules=  z.object({
            email:z.string().trim(),
            password:z.string().min(3, "password must contain atleast 3 characters").max(100, "password should contain atmost 100 characters").trim()
        })
       const result=  userRules.safeParse({email, password}) 
        if(!result.success){
          return res.status(400).json({
            message:"validation error",
            error: result.error
          })
       }

    try{ 
    const existingUser=await userModel.findOne({email}) 
    if(!existingUser){
        return res.status(400).json({
            message:"user not registered"
        }) 
    }

    const correctPassword=await bcrypt.compare(password, existingUser.password) 
    if(!correctPassword){
        return res.status(400).json({
            message:"Invalid Password"
        })
    } 
    const secretCode=process.env.SECRETCODE
    const payload={id:existingUser._id}
    const jwtToken=jwt.sign(payload, secretCode, {expiresIn:"30d"}) 
    res.cookie("jwt_token", jwtToken, {
        httpOnly:true,
        secure:false,
        sameSite:"lax",
        maxAge:30*24*60*60*1000
    }) 
     return res.status(201).json({
        message:"token created successfully"
     }) 
    }catch(e){
        console.log(e.message)
    }
}

export async function getMe(req, res){
   const user=  await userModel.findById(req.user.id).select("-password");
   return res.status(200).json({user:user});
}


