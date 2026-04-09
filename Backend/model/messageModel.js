
import mongoose from "mongoose"    

const messageSchema= new mongoose.Schema({
    conversationId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"conversation",
        required:true
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
         required:true
    },
    text:{
        type:String,
         required:true
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }],
    isDeletedForEveryone: {
        type: Boolean,
        default: false
    },
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }]
}, {timestamps:true})

export default mongoose.model("Message", messageSchema)



