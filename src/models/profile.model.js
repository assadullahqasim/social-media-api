import mongoose,{ Schema } from "mongoose";

const profileSchema = new Schema(
    {
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required : true
        },
        bio:{
            type: String
        },
        profilePicture:{
            type: String 
        },
        location:{
            type: String
        },
        website:{
            type: String
        }
    },
    {
        timestamps: true
    }
)

export const Profile = mongoose.model("Profile",profileSchema)