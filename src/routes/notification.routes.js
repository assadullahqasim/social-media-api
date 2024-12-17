import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    getNotifications,
    markAsRead
} from "../controllers/notification.controller.js"

const router = Router()

//? getNotifications

router.route("/get-notification").get(verifyJWT,getNotifications)

//? markAsRead

router.route("/mark-read/:notificationId").post(markAsRead)

export default router