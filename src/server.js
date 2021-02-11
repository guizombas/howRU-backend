import express, { json } from "express"
import http from 'http'
import {Server as socketIO} from 'socket.io'
import cors from 'cors'
import socketHandler from './handlers/socket.js'
import authRoutes from  './routes/auth.js'
import projectRoutes from './routes/project.js'

//servidor
const app = express()
const server = http.createServer(app)
const io = new socketIO(server, {
    cors:{
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

//socket
io.on( 'connection', socketHandler)

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