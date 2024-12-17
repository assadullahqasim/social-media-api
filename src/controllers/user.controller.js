import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { sendVerificationEmail, sendPasswordResetEmail } from "../middleware/nodemailer.middleware.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { Profile } from "../models/profile.model.js"
import bcrypt from "bcryptjs"
import { Post } from "../models/post.model.js"
import mongoose from "mongoose";
import {createNotification} from "./notification.controller.js"

//? generateAccessAndRefreshToken

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRfreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

//? register

const registerUser = asyncHandler(async (req, res) => {

    const { firstname, lastname, username, email, password } = req.body

    if (
        ["firstname", "lastname", "username", "email", "password"].some((field) => field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with this email and username already present")
    }

    const user = await User.create({
        firstname,
        lastname,
        username,
        email,
        password
    })

    const emailVerificationToken = user.generateEmailVerficationToken()

    await sendVerificationEmail(user, emailVerificationToken)


    return res.status(200).json(
        new ApiResponse(200, { user: user }, "User created successfully")
    )
})

//?email verification

const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params

    const decoded = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET)

    if (!decoded) {
        throw new ApiError(400, "Invalid or expire token")
    }

    const user = await User.findById(decoded?._id)
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.isEmailVerified) {
        return res.status(200).json(
            new ApiResponse(200, null, "email is aready verified")
        )
    }

    user.isEmailVerified = true
    await user.save()

    return res.status(200).json(
        new ApiResponse(200, null, "Email verify successfully")
    )
})

//? resend email verification

const resendVerificationEmail = asyncHandler(async (req, res) => {

    const { email } = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.isEmailVerified) {
        return res.status(200).json(
            new ApiResponse(200, null, "email is aready verified")
        )
    }

    const emailVerificationToken = user.generateEmailVerficationToken(
        {
            _id: user._id
        },
        process.env.EMAIL_TOKEN_SECRET,
        { expiresIn: "15m" }
    )

    await sendVerificationEmail(user, emailVerificationToken)

    return res.status(200).json(
        new ApiResponse(200, null, "Verification email resent successfully")
    )
})

//? login user

const loggedInUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email are required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not found")
    }

    if (!user.isEmailVerified) {
        throw new ApiError(400, "verify email first")
    }

    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200, { user: user }, "User loggedIn successfully")
    )

})

//? update User

const updateUser = asyncHandler(async (req, res) => {

    const loggedIn = await User.findById(req.user._id)

    if (!loggedIn) {
        throw new ApiError(400, "User not found")
    }

    const { firstname, lastname, username, password } = req.body

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            ...(firstname && { firstname }),
            ...(lastname && { lastname }),
            ...(username && { username }),
        },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, { user: user }, "User details update successfully")
    )
})

//? generate new access and refresh token

const refreshAccessToken = asyncHandler(async (req, res) => {

    const { refreshToken } = req.cookies || req.headers["authorization"]?.split(" ")[1]

    if (!refreshToken) {
        throw new ApiError(400, "Refreh token not found")
    }

    const user = await User.findById(req.user?._id)

    if (user.refreshToken !== refreshToken) {
        throw new ApiError(401, "Invalid refresh token")
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)

    user.refreshToken = newRefreshToken

    await user.save()

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("refreshToken", newRefreshToken, options).json(
        new ApiResponse(200, { accessToken }, "Access token refresh successfully")
    )
})

//? getUser

const getUser = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username) {
        throw new ApiError(400, "enter the username first")
    }

    const user = await User.findOne({ username }).select("-password -email -_id -refreshToken -isEmailVerified ")

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    return res.status(200).json(
        new ApiResponse(200, { user: user }, "user fetched successfully")
    )
})

//? add profile

const addProfile = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(400, "login first to add profile")
    }

    const existedProfile = await Profile.findOne({ user: user._id })

    if (existedProfile) {
        throw new ApiError(409, "Profile is already exists")
    }

    const { bio, location, website } = req.body
    const imageLocalPath = req.file?.path

    if (!imageLocalPath) {
        throw new ApiError(400, "image file is required")
    }
    const image = await uploadOnCloudinary(imageLocalPath)

    const profile = new Profile(
        {
            user: user._id,
            bio,
            location,
            website,
            profilePicture: image.url
        }
    )

    await profile.save()

    return res.status(200).json(
        new ApiResponse(200, { profile: profile }, "profile created successfully")
    )
})

//? update profile

const updateProfile = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(400, "login first to update profile")
    }

    const { bio, location, website, profilePicture } = req.body
    const imageLocalPath = req.file?.path
    const image = await uploadOnCloudinary(imageLocalPath)

    const profile = await Profile.findOneAndUpdate(
        { user: user._id },
        {
            ...(bio && { bio }),
            ...(location && { location }),
            ...(website && { website }),
            ...(profilePicture && { profilePicture: image.url })
        },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, { profile: profile }, "profile updated successfully")
    )
})

//? delete User

const deleteUser = asyncHandler(async (req, res) => {

    const loggedInUser = await User.findById(req.user?._id)
    if (!loggedInUser) {
        throw new ApiError(400, "login first to delete account")
    }

    await Profile.findOneAndDelete({ user: loggedInUser._id })
    await Post.deleteMany({ user: loggedInUser._id })
    const user = await User.findByIdAndDelete(loggedInUser._id)

    return res.status(200).json(
        new ApiResponse(200, { user: user._id }, "user deleted successfully")
    )
})

//? forgotPassword

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const resetToken = jwt.sign(
        { _id: user._id },
        process.env.FORGET_PASSWORD,
        { expiresIn: "15m" }
    )

    await sendPasswordResetEmail(user, resetToken)

    return res.status(200).json(
        new ApiResponse(200, null, "Password reset link has been sent to your email")
    )
})

//? resetPassword

const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params
    const { newPassword, confirmNewPassword } = req.body

    if (!(newPassword || confirmNewPassword)) {
        throw new ApiResponse("Password or confirm password are required")
    }

    const decoded = jwt.verify(token, process.env.FORGET_PASSWORD)
    if (!decoded) {
        throw new ApiError(400, "Invalid or expire token")
    }

    const user = await User.findById(decoded._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()

    return res.status(200).json(
        new ApiResponse(200, null, "Password has been reset successfully")
    )
})

//? followUser

const followUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const loggedId = req.user._id;

    const existedUser = await User.findById(userId);
    if (!existedUser) {
        throw new ApiError(404, "User not found");
    }

    const isAlreadyFollowing = existedUser.followers.includes(loggedId);

    if (!isAlreadyFollowing) {

        await User.findByIdAndUpdate(
            userId,
            { $addToSet: { followers: loggedId } },
            { new: true }
        );
        await User.findByIdAndUpdate(
            loggedId,
            { $addToSet: { following: userId } },
            { new: true }
        );

        await createNotification("follow",loggedId,userId)

    } else {


        await User.findByIdAndUpdate(
            userId,
            { $pull: { followers: loggedId } },
            { new: true }
        );
        await User.findByIdAndUpdate(
            loggedId,
            { $pull: { following: userId } },
            { new: true }
        );
    }

    const updatedUser = await User.aggregate([
        {$match:{_id: new mongoose.Types.ObjectId(userId)}},
        {
            $project:{
                firstname:1,
                lastname:1,
                username:1,
                countFollowers:{$size :"$followers"},
                countFollowing:{$size : "$following"}
            }
        }
    ])

    const updatedLoggedInUser = await User.aggregate([
        {$match:{_id: new mongoose.Types.ObjectId(loggedId)}},
        {
            $project:{
                firstname:1,
                lastname:1,
                username:1,
                countFollowers:{$size :"$followers"},
                countFollowing:{$size : "$following"}
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200,{
            user: updatedUser[0],
            loggedInUser: updatedLoggedInUser[0]
        },isAlreadyFollowing? "Unfollow user successfully":"follow user successfully")
    )
});

export {
    registerUser,
    verifyEmail,
    resendVerificationEmail,
    loggedInUser,
    updateUser,
    refreshAccessToken,
    getUser,
    addProfile,
    updateProfile,
    deleteUser,
    forgotPassword,
    resetPassword,
    followUser
}