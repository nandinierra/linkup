import userModel from "../model/userModel.js"
import bcrypt from "bcrypt"

export async function getUsers(req,res){
    try{
      const users= await userModel.find({_id:{$ne:req.user.id}}).select("-password")
      res.status(201).json({
        users:users
      })
    }catch(e){
        console.log(e.message)
    }
} 

export async function getUserById(req, res) {
    try {
        const user = await userModel.findById(req.params.id).select("-password");
        res.status(200).json({ success: true, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function updateProfile(req, res) {
    try {
        const { name, email, settings } = req.body;
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (settings) updateData.settings = settings;

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select("-password");

        res.status(200).json({ success: true, user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function updatePassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await userModel.findById(req.user.id);
        
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid old password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export async function uploadProfilePic(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Host the payload on the static route natively
        const profilePicUrl = `http://localhost:4000/uploads/${req.file.filename}`;
        
        const updatedUser = await userModel.findByIdAndUpdate(
            req.user.id,
            { profilePic: profilePicUrl },
            { new: true }
        ).select("-password");
        
        res.status(200).json({ success: true, user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
