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
        console.log(err);
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
        console.log(err);
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
        await db.run( queryInsert, [userID, newFriendID] )
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
        console.log(err);
        res.status(500).json(err)
    }

})

router.post( '/updateData', async (req,res) =>{

    const id = req.body.id
    const newName = req.body.name
    const newTel = req.body.tel

    const query = `
        UPDATE user 
        SET
            name = ?,
            tel = ?
        WHERE id = ?;
    `

    try {
        
        const db = await connection()
        await db.run( query, [newName,newTel,id] )
        res.status(201).json({"message":"Successfully updated profile data"})

    } catch (err) {
        console.log(err);
        res.status(500).json(err)
    }

})

router.get( '/allFriends/:id', async (req,res) =>{

    const id = req.params.id

    const query = `
        SELECT u.id, u.name FROM user u, friend f
        WHERE   (f.id_f1 = :id AND f.id_f2 = u.id) OR
                (f.id_f2 = :id AND f.id_f1 = u.id);
    `

    try {
    
        const db = await connection()
        let results = await db.all( query, {':id':id} )
        res.status(200).json(results)

    } catch (err) {
        console.log(err);
        res.status(500).json(err)
    }

})

router.get( '/allMessages/:yID/:fID', async (req,res) =>{

    const yID = req.params.yID
    const fID = req.params.fID

    const query = `
        SELECT m.id, m.id_sender, m.texto FROM message m
        WHERE   (m.id_sender = :yID AND m.id_receiver = :fID) OR
                (m.id_receiver = :yID AND m.id_sender = :fID)
        ORDER BY (m.send_time) DESC;
    `

    try {
        
        const db = await connection()
        let results = await db.all( query, { ':yID':yID, ':fID': fID } )

        if (results.length > 0){
            res.status(200).json(
                results.map( (result)=>{
                    return {
                        id: result.id,
                        text: result.texto,
                        sender: yID == result.id_sender ? "you" : "friend"
                    }
                })
            )
        }
        else
            res.status(200).json(results)

    } catch (err) {
        console.log(err);
        res.status(500).json(err)
    }

})

router.get( '/searchUser/:content/:type', async (req,res)=> {

    const searchContent = req.params.content
    const searchType = req.params.type

    const idQuery = `
        SELECT u.id, u.name FROM user u
        WHERE u.id = ${searchContent};
    `
    const nameQuery = `
        SELECT u.id, u.name FROM user u
        WHERE u.name LIKE "%${searchContent}%";
    `
    const emailQuery = `
        SELECT u.id, u.name FROM user u
        WHERE u.email LIKE "${searchContent}%";
    `
    const telQuery = `
        SELECT u.id, u.name FROM user u
        WHERE u.tel LIKE "%${searchContent}%";
    `

    let query
    switch (searchType) {
        case "id":
            query = idQuery
            break;
        case "name":
            query = nameQuery
            break;
        case "email":
            query = emailQuery
            break;
        case "tel":
            query = telQuery
            break;
        default:
            break;
    }

    try {
        
        const db = await connection()
        let results = await db.all( query )
        res.status(200).json(results)

    } catch (err) {
        console.log(err);
        res.status(500).json(err)
    }

})

export default router