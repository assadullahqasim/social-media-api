import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
    {
        type:{
            type: String,
            enum: ["like","comment","follow"]
        },
        sender:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recipient:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        postId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false
        },
        isRead:{
            type: Boolean,
            default: false
        },
        timestamp:{
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
)

export const Notification = mongoose.model("Notification",notificationSchema)