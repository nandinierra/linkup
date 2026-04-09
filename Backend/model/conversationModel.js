

import mongoose from "mongoose" 


const conversationSchema=new mongoose.Schema({
     isGroupChat: {
        type: Boolean,
        default: false
    },
    groupName: {
        type: String,
        trim: true
    },
    groupPic: {
        type: String,
        default: ""
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    participants:[
        {
          type:mongoose.Schema.Types.ObjectId,
          ref:"user"
        }
    ],
    lastMessage: {
        text: {
            type: String,
            default: ""
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user"
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            }
        ],
        createdAt: {
            type: Date
        }
    },
    conversationKey:{
        type:String,
        unique:true

    }
}, {timestamps:true})
export default mongoose.model("conversation", conversationSchema)