import express from "express"
import cors from 'cors'

import routes from  './routes.js'

const app = express()

app.use( cors() )
app.use( express.json() )
app.use( express.urlencoded({extended: true}) )
app.use( routes )

const port = 3300;
app.listen( port, () =>{
    console.log("\n--> Servidor ativo na porta " + port + " <--")
} )