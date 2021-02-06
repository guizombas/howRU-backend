import express, { json } from "express"
import http from 'http'
import {Server as socketIO} from 'socket.io'
import cors from 'cors'
import onlineUsers from './temp/onlineUsers.js'
import authRoutes from  './routes/auth.js'
import projectRoutes from './routes/project.js'
import sendMessage from "./utils/message.js"

const app = express()
const server = http.createServer(app)
const io = new socketIO(server, {
    cors:{
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

//socket
io.on( 'connection', (skt)=>{
    console.log(skt.id + ' conectou');
    const userId = skt.handshake.auth.token
    onlineUsers[userId] = {
        typingFor: 0,
        socket: skt.id
    }

    skt.on('newMessage', async (texto, friendId)=>{/*
        await sendMessage(texto, userId, friendId)*/
        const friendStatus = onlineUsers[friendId]
        const newMessage = {
            id: new Date().getTime(),
            text: texto,
            sender: "you"
        }
        skt.emit('receivedMessage', newMessage)
        if (friendStatus){
            newMessage.sender = "friend"
            skt.to(friendStatus.socket).emit('receivedMessage', newMessage)
        }
    })
    skt.on( 'disconnect', ()=>{
        onlineUsers[userId] = null
        console.log(skt.id + ' desconectou');
    })
})

//midlewares
app.use( cors() )
app.use( express.json() )
app.use( express.urlencoded({extended: true}) )
app.use( authRoutes )
app.use( projectRoutes )

const port = 3300;
server.listen( port, () =>{
    console.log("\n--> Servidor ativo na porta " + port + " <--")
} )