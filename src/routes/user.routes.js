import { Router } from "express";
import {
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
} from "../controllers/user.controller.js"
import {verifyJWT} from "../middleware/auth.middleware.js"
import {uploadProfilePicture} from "../middleware/multer.middleware.js"

const router = Router()

//? registerUser
router.route("/register").post(registerUser)

//? verifyEmail
router.route("/verify-email/:token").get(verifyEmail)

//? resendVerificationEmail
router.route("/resend-verfication-email").post(resendVerificationEmail)

//? loggedInUser
router.route("/login").post(loggedInUser)

//? updateUser
router.route("/update-user").put(verifyJWT,updateUser)

//? refreshAccessToken
router.route("/refresh-token").post(verifyJWT,refreshAccessToken)

//? getUser
router.route("/get-user/:username").get(getUser)

//? addProfile
router.route("/add-profile").post(verifyJWT,uploadProfilePicture.single("profilePicture"),addProfile)

//? updateProfile
router.route("/update-profile").put(verifyJWT,uploadProfilePicture.single("profilePicture"),updateProfile)

//? deleteUser
router.route("/delete-account").delete(verifyJWT,deleteUser)

//? forgotPassword

router.route("/forget-password").post(forgotPassword) 

//? resetPassword
router.route("/reset-password/:token").post(resetPassword)

//? followUser

router.route("/follow-user/:userId").post(verifyJWT,followUser)

export default router