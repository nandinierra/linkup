import {z} from "zod"     
import userModel from "../model/userModel.js"
import bcrypt from "bcrypt" 
import jwt from "jsonwebtoken" 

const normalizePhone = (phone) => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, "");
    cleaned = cleaned.replace(/^0+/, "");
    // Default to Indian country code (91) if it's a plain 10-digit number
    if (cleaned.length === 10) {
        cleaned = "91" + cleaned;
    }
    return cleaned;
};

export async function registerUser(req,res){
  
     const {name, email, password, phoneNumber}=req.body;
     const userRules=z.object({
        name:z.string().min(3, "name should contain atleast 3 characters")
        .max(15, "name should not exeed more than 15 characters").trim(),
        email:z.string().toLowerCase().trim(),
        phoneNumber:z.string().min(10, "Phone number is required"),
        password:z.string().min(4, "password should contain atleast 4 letters").max(100, "password should contain atmost 100 characters").trim()
     })
    const result= userRules.safeParse({name, email, phoneNumber, password}); 
    if(!result.success){
        return res.status(400).json({
            message:"validation error",
            error:result.error
        })
    }

    try{
    const normalizedPhone = normalizePhone(phoneNumber);

    const existingUser=await userModel.findOne({
        $or: [{ email }, { phoneNumber: normalizedPhone }]
    });

     if(existingUser){
        return res.status(409).json({
            message: existingUser.email === email ? "Email already exists" : "Phone number already exists"
        })
     } 

     const hashedPassword=await bcrypt.hash(password, 10);
     const userDetails=await userModel.create({
        name,
        email,
        phoneNumber: normalizedPhone,
        password:hashedPassword
     })
     const secretCode=process.env.SECRETCODE
     const payload={
        id:userDetails._id
     }
     const jwtToken=jwt.sign(payload, secretCode, {expiresIn:"30d"})
      res.cookie("jwt_token", jwtToken,{
        httpOnly:true,
        secure:true,
        sameSite:"none",
        maxAge:30*24*60*60*1000
      })
    
      return  res.status(200).json({
        message:"user registered successfully"
      })

    }catch(e){
        return res.status(500).json({
            message:"Internal server Error"
        })
    }
}

export async function logoutUser(req, res){
   
    res.clearCookie("jwt_token",{
        httpOnly:true,
        secure:true,
        sameSite:"none"
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
        secure:true,
        sameSite:"none",
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

export async function updateMe(req, res) {
    try {
        const { phoneNumber } = req.body;
        const normalized = normalizePhone(phoneNumber);
        
        await userModel.findByIdAndUpdate(req.user.id, { 
            phoneNumber: normalized 
        });

        return res.status(200).json({ message: "Profile updated successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Update failed", error: err.message });
    }
}


