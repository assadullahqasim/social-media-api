import { Server } from "socket.io";
import http from "http"
import express from "express"

const app = express()
const server = http.createServer(app)
let io

const initSocket = (server)=>{

    io = new Server(server,{
        cors:{
            origin:"*",
            methods: ["GET","POST"]
        }
    })

    io.on("connect",(socket)=>{
        console.log(`User connected: ${socket.id}`);

        socket.on("join",(userId)=>{
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        })

        socket.on("disconnect",()=>{
            console.log(`User disconnected: ${socket.id}`)
        })
    })

    console.log("Socket.IO initialized");
}


const getIO = ()=>{

    if(!io){
        throw new Error("Socket.IO not initialized!")
    }

    return io
}


export{
    server,
    initSocket,
    getIO
}