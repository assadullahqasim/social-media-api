import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        content: {
            type: String,
            required: true
        },
        images: {
            type: [String],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        tags: [
            {
                type: String,
                required: true,
                trim: true
            }
        ],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        comments: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },
                comment: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 500 
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

// Index for faster querying by author and tags
postSchema.index({ author: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ createdAt: -1 });

// Virtual fields for aggregated data
postSchema.virtual("likesCount").get(function () {
    return this.likes.length;
});

postSchema.virtual("commentsCount").get(function () {
    return this.comments.length;
});

export const Post = mongoose.model("Post", postSchema);
