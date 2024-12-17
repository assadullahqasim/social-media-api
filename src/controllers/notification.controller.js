import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Notification } from "../models/notification.model.js"
import {getIO} from "../socket.js"
 

const createNotification = async(type,senderId,recipentId,postId=null)=>{

    const notification = new Notification({
        type,
        sender: senderId,
        recipient: recipentId,
        postId
    })

    await notification.save()

    getIO().to(recipentId.toString()).emit("newNotification", {
        message: "You have a new notification",
        notification,
    });
}


//? getNotifications

const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "Only logged-in users can get notifications");
    }

    const notification = await Notification.find({ recipient: userId })
        .populate("sender", "firstname lastname username")
        .populate("postId", "title content")
        .sort({ timestamp: -1 });

    return res.status(200).json(
        new ApiResponse(200, { notification: notification }, "Get notification successfully")
    );
});


//? markedRead

const markAsRead = asyncHandler(async(req,res)=>{

    const {notificationId} = req.params

    if(!notificationId){
        throw new ApiError(404,"Notification not found")
    }

    const notification = await Notification.findById(notificationId)

    notification.isRead = true

    await notification.save()

    return res.status(200).json(
        new ApiResponse(200,{notification:notification},"Notification marked as read")
    )
})

export{
    createNotification,
    getNotifications,
    markAsRead
}