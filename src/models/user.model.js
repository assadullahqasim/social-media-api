import mongoose,{Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        firstname:{
            type: String,
            required: true
        },
        lastname:{
            type: String,
            required: true
        },
        username:{
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        email:{
            type: String,
            required: true,
            unique: true
        },
        isEmailVerified:{
            type: Boolean,
            default: false
        },
        password:{
            type: String,
            required: true
        },
        refreshToken:{
            type: String
        },
        followers:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        following:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]
    },
    {
        timestamps: true,
    }
)

userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
        return next()
    }
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.comparePassword = async function(inputPassword){
    return await bcrypt.compare(inputPassword,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            username: this.username,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    )
}

userSchema.methods.generateRfreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
}

userSchema.methods.verifyRefreshToken = function (token) {
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        return decoded.id === this._id.toString(); 
    } catch (err) {
        return false;
    }
}

userSchema.methods.generateEmailVerficationToken = function(){ 
    return jwt.sign(
        {
            _id:this._id
        }
        ,process.env.EMAIL_TOKEN_SECRET,
        {expiresIn:"1h"}
    )
}

userSchema.virtual("countFollowers").get(function(){
    return this.followers?.length
})

userSchema.virtual("countfollowing").get(function(){
    return this.following?.length
})

export const User = mongoose.model("User",userSchema)