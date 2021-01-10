import express from "express"
import connection from './database/connection.js'

//rotas
const router = express.Router()

router.post('/register', async (req,res) =>{

    const name = req.body.name
    const email = req.body.email
    const password = req.body.password

    const query = `
        INSERT INTO user( name, email, password)
        VALUES ( ?, ?, ? );
    `
    
    try {

        const db = await connection()
        await db.run( query, [name,email,password] )
        res.status(201).json({ "message": "registration completed" })

    } catch (err) {
        //errno 19 do sqlite é o de violação de constraint
        err.errno == 19 ? 
        res.status(406).json(err) : 
        res.status(500).json(err)
    }
})

router.post( '/login', async (req,res) =>{

    const email = req.body.email
    const password = req.body.password

    const query = `
        SELECT id FROM user
        WHERE email = ? AND password = ?
    `

    try {
        
        const db = await connection()
        const result = await db.get( query, [email, password] )
        result ? 
        res.status(200).json({id: result.id}) :
        res.status( 406 ).json({ err: "fail to login: email or password are wrong" })

    } catch (err) {
        res.status(500).json(err)
    }

} )

router.post( '/addFriend', async (req, res) =>{

    const userID = + req.body.userID
    const newFriendID = + req.body.newFriendID

    const querySelect = `
        SELECT * FROM friend
        WHERE   (id_f1 = :userID AND id_f2 = :newFriendID) OR
                (id_f2 = :userID AND id_f1 = :newFriendID);
    `
    const queryInsert = `
        INSERT INTO friend VALUES ( ?, ? );
    `

    try {

        const db = await connection()
        //ver se já são amigos
        let result = await db.get( querySelect, {':userID':userID, ':newFriendID':newFriendID} )
        //retornar se já forem amigos, adiocionar se não
        result ?
        res.status(200).json({ "message": "These users are already friends" }) :
        result = await db.run( queryInsert, [userID, newFriendID] )
        res.status(201).json({ "message": "New friend added" })

    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }

})

router.post( '/newMessage', async (req,res) =>{

    const text = req.body.text
    const idSender = + req.body.idSender
    const idReceiver = + req.body.idReceiver
    
    const query = `
        INSERT INTO message( texto, id_sender, id_receiver, send_time )
        VALUES (?, ?, ?, datetime('now') );
    `

    try {

        const db = await connection()
        await db.run( query, [text,idSender,idReceiver] )
        res.status(201).json({"message":"message sent"})

    } catch (err) {
        res.status(500).json(err)
    }

})

export default router