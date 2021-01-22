import express from "express"
import cors from 'cors'

import authRoutes from  './routes/auth.js'
import projectRoutes from './routes/project.js'

const app = express()

app.use( cors() )
app.use( express.json() )
app.use( express.urlencoded({extended: true}) )
app.use( authRoutes )
app.use( projectRoutes )

const port = 3300;
app.listen( port, () =>{
    console.log("\n--> Servidor ativo na porta " + port + " <--")
} )