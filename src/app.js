import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import {initSocket,server} from "./socket.js"
const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.get("/",(req,res)=>{
    res.status(200).json({message:"Hello World"})
})

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//*---> import routes
import userRouter from "./routes/user.routes.js"
import postRouter from "./routes/post.routes.js"
import notificationRouter from "./routes/notification.routes.js"

//*---> use routes
app.use("/api/v1/user",userRouter)
app.use("/api/v1/post",postRouter)
app.use("/api/v1/notification",notificationRouter)

initSocket(server)
export {app}