import { Router } from "express";
import {
    createPost,
    getPosts,
    updatePost,
    deletePost,
    likepost,
    addComment,
    getPostWithCounts,
    deleteComment,
    getFeed
} from "../controllers/post.controller.js"
import { verifyJWT } from "../middleware/auth.middleware.js";
import { uploadPostImages } from "../middleware/multer.middleware.js";

const router = Router()

//? createPost

router.route("/create-post").post(verifyJWT,uploadPostImages.fields([{name:"images"}]),createPost)

//? getPosts

router.route("/get-posts").get(verifyJWT,getPosts)

//? updatePost

router.route("/update-post/:postId").put(verifyJWT,uploadPostImages.none(),updatePost)

//? deletePost

router.route("/delete-post/:postId").delete(verifyJWT,deletePost)

//? postLike

router.route("/post-like/:postId").post(verifyJWT,likepost)

//? addComment

router.route("/add-comment/:postId").post(verifyJWT,addComment)

//? getPostWithCounts

router.route("/post-count/:postId").get(getPostWithCounts)

//? deleteComment

router.route("/delete-comment/:postId/:commentId").delete(verifyJWT,deleteComment)

//? getFeed

router.route("/get-feed/:sortBy").get(verifyJWT,getFeed)

export default router