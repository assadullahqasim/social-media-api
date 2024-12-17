import { Post } from "../models/post.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { createNotification } from "./notification.controller.js"

//? create post

const createPost = asyncHandler(async (req, res) => {

    const userId = req.user._id

    if (!userId) {
        throw new ApiError(400, "Only logged in User can create post")
    }

    const { title, content, tags } = req.body

    if(!title || !content){
        throw new ApiError(400,"title and content are required")
    }

    if (!tags) {
        throw new ApiError(400, "At least one valid tag is required");
    }

    const imageLocalPath = req.files?.images?.map((file) => file.path)

    let images = []
    if(imageLocalPath){
        try {
            images = await Promise.all(
                imageLocalPath.map((path)=> uploadOnCloudinary(path))
            )
        } catch (error) {
            throw new ApiError(500,"Failed to upload images")
        }
    }

    const post = new Post(
        {
            author: userId,
            title,
            content,
            tags,
            images: images.map((img) => img.url)
        }
    )

    await post.save()

    return res.status(200).json(
        new ApiResponse(200, { post: post }, "post created successfully")
    )
})

//? getPosts

const getPosts = asyncHandler(async(req,res)=>{
    
    const {user,tags,page=1,limit=10} = req.query

    const filter = {}

    if(user){
        filter.author = user
    }

    if(tags){
        const tagsArray = tags.split(",")
        filter.tags = {$in:tagsArray}
    }

    const skip = (page-1) * limit

    const posts = await Post.find(filter)
        .sort({createdAt : -1})
        .skip(skip)
        .limit(Number(limit)) 
        .populate("author","first lastname username")
        .exec()

    const totalPosts = await Post.countDocuments(filter)
    const totalPages = Math.ceil(totalPosts/limit)

    return res.status(200).json(
        new ApiResponse(200,{
            posts,
            pagination:{
                totalPosts,
                totalPages,
                currentPage: Number(page),
                limit: Number(limit)
            }
        },"Posts retrieved successfully")
    )
})

//? Update Post

const updatePost = asyncHandler(async(req,res)=>{
    
    const {postId} = req.params
    const userId = req.user._id
    if(!userId){
        throw new ApiError(400,"Only logged In user can update this post")
    }

    const { title, content, tags } = req.body

    const existedPost = await Post.findById(postId)

    if(!existedPost){
        throw new ApiError(404,"Post not found")
    }

    if (existedPost.author.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to update this post");
    }
    

    const post = await Post.findByIdAndUpdate(
        postId,
        {
            ...(title && {title}),
            ...(content && {content}), 
            ...(tags && {tags})
        },
        {new: true}
    )

    return res.status(200).json(
        new ApiResponse(200,{post:post},"post update successfully")
    )

})

//? Delete Post

const deletePost = asyncHandler(async(req,res)=>{
    const {postId} = req.params
    const userId = req.user._id
    if(!userId){
        throw new ApiError(400,"Only logged In user can delete this post")
    }

    const post = await Post.findByIdAndDelete(postId)

    return res.status(200).json(
        new ApiResponse(200,{postId},"post deleted successfully")
    )
})

//? post like

const likepost = asyncHandler(async(req,res)=>{

    const {postId} = req.params
    const userId = req.user._id

    const post = await Post.findById(postId)

    if(!post){
        throw new ApiError(404,"post not found")
    }

    const index = post.likes.indexOf(userId)

    if(index === -1){
        post.likes.push(userId)
        await post.save()
        return res.status(200).json(
            new ApiResponse(200,{post},"post liked successfully")
        )

        await createNotification("like",userId,post.author,postId)

    }else{
        post.likes.splice(index, 1)
        await post.save()
        return res.status(200).json(
            new ApiResponse(200,{post},"post unlike successfully")
        )
    }
})

//? add comment

const addComment = asyncHandler(async(req,res)=>{
    const {postId} = req.params
    const userId = req.user._id
    const {comment} = req.body

    if(!comment || comment.trim() === ""){
        throw new ApiError(400,"'Comment cannot be empty")
    }

    const post = await Post.findById(postId)
    
    if(!post){
        throw new ApiError(404,"post not found")
    }

    post.comments.push(
        {
            user: userId,
            comment: comment.trim()
        }
    )

    await post.save()
    await createNotification("comment",userId,post.author,postId)

    return res.status(200).json(
        new ApiResponse(200,{post},"add comment successfully")
    )
})

//? getPostWithCounts

const getPostWithCounts = asyncHandler(async(req,res)=>{
    const {postId} = req.params

    const post = await Post.findById(postId).populate("author","name").exec()

    if(!post){
        throw new ApiError(404,"post not found")
    }

    return res.status(200).json(
        new ApiResponse(200,{
            post,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount
        })
    )
})

//? deleteComment

const deleteComment = asyncHandler(async(req,res)=>{
    const {postId,commentId} = req.params
    const userId = req.user._id

    const post = await Post.findById(postId)

    if(!post){
        throw new ApiError(404,"post not found")
    }

    const commentIndex = post.comments.findIndex((comment)=> comment._id.toString() === commentId && comment.user.toString() === userId)

    if(!commentIndex){
        throw new ApiError(403, "You are not authorized to delete this comment or comment not found");
    }

    post.comments.splice(commentIndex,1)

    await post.save()

    return res.status(200).json(
        new ApiResponse(200, { post }, "Comment deleted successfully")
    );
})


//? getFeed

const getFeed = asyncHandler(async(req,res)=>{
    const loggedInUser = req.user._id
    const {sortBy, page=1,limit=10} = req.query

    const user = await User.findById(loggedInUser).populate("following")

    if(!user){
        throw new ApiError(404,"user not found")
    }

    let posts;
    const skip = (page - 1) * limit
    if(sortBy === "recent"){
        posts = await Post.find({author:{$in: user.following}})
        .skip(skip)
        .limit(limit)
        .sort({createdAt: -1}).
        populate("author","name")
        .exec()
    }else{
        posts = await Post.find({author:{$in: user.following}})
        .skip(skip)
        .limit(limit)
        .sort({likesCount: -1})
        .populate("author","name")
        .exec()
    }

    return res.status(200).json(
        new ApiResponse(200,{posts},"feed fetched successfully")
    )
})

export {
    createPost,
    getPosts,
    updatePost,
    deletePost,
    likepost,
    addComment,
    getPostWithCounts,
    deleteComment,
    getFeed
}