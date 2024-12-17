import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"

const verifyJWT = asyncHandler(async(req,_,next)=>{
    try {
        const token = req.cookies?.accessToken || req.headers["authorization"]?.split(" ")[1]|| req.cookies?.refreshToken;
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(404,"User not found")
        }

        req.user = user
        next()
        
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid token")
    }
})

export {verifyJWT}