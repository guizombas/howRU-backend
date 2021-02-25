import express from 'express'
import Crypter from 'cryptr'
import dotenv from 'dotenv'
import connection from '../database/connection.js'
import authMidleware from '../middlewares/auth.js'
import onlineUsers from '../temp/onlineUsers.js'

dotenv.config()

const router = express.Router()
router.use( authMidleware )

router.post( '/addFriend', async (req, res) =>{

    const userID = + req.userID
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
        if (result)
            return res.status(200).json({ "message": "These users are already friends" })
        await db.run( queryInsert, [userID, newFriendID] )
        res.status(201).json({ "message": "New friend added" })

    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }

})

router.post( '/updateData', async (req,res) =>{

    const id = req.userID
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

router.get( '/allFriends', async (req,res) =>{

    const id = req.userID

    const query = `
        SELECT u.id, u.name FROM user u, friend f
        WHERE   (f.id_f1 = :id AND f.id_f2 = u.id) OR
                (f.id_f2 = :id AND f.id_f1 = u.id)
        ORDER BY (name);
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

router.get( '/allChats/:time', async (req, res) =>{

    const id = req.userID
    const time = req.params.time
    const crypter = new Crypter(process.env.SECRET)
    const query = `

        SELECT u.id, u.name, m.texto, m.id_sender FROM message m, user u
        WHERE (m.id_sender = :id OR m.id_receiver = :id)
        AND (m.id_sender = u.id OR m.id_receiver = u.id)
        AND u.id =
        (
        SELECT u.id FROM user u2, friend f
        WHERE ((f.id_f1 = :id AND f.id_f2 = u.id) OR
                (f.id_f2 = :id AND f.id_f1 = u.id))
        )
        GROUP BY (u.id)
        HAVING m.send_time = MAX(m.send_time)
        ORDER BY (send_time) DESC
        LIMIT :begin ,4;

    `

    try {
        const db = await connection()
        const results = await db.all( query, { ":id": id, ":begin": time*3 } )
        const isfinished = results.length < 4
        if (!isfinished)
            results.pop()

        res.status(200).json([
            results.map( result =>{
                return {
                    name: result.name,
                    lastMessage: crypter.decrypt(result.texto),
                    lastSender: result.id_sender === id ? "you" : "friend" ,
                    friendID: result.id
                }
            }),
            isfinished
        ]
            
        )
        
    } catch (err) {
        console.log(err);
        res.status(500).json(err)
    }

})

router.get( '/allMessages/:fID/:time', async (req,res) =>{
    
    const crypter = new Crypter(process.env.SECRET)

    const yID = req.userID
    const fID = req.params.fID
    const time = req.params.time

    if (yID == fID)
        return res.status(404).send('thats you!')

    const messagesQuery = `
        SELECT m.id, m.id_sender, m.texto FROM message m
        WHERE   (m.id_sender = :yID AND m.id_receiver = :fID) OR
                (m.id_receiver = :yID AND m.id_sender = :fID)
        ORDER BY (m.send_time) DESC
        LIMIT :begin,6;
    `
    const friendQuery = `
        SELECT name FROM user
        WHERE id = ?
    `

    try {
        
        const db = await connection()

        let friend = await db.get( friendQuery, [fID] )

        if (!friend){
            return res.status(404).send('userNotFound')
        }
        
        const messages = await db.all( messagesQuery, { ':yID':yID, ':fID': fID , ':begin': time*5 } )
        const isfinished = messages.length < 6
        if (!isfinished)
            messages.pop()

        const friendStats = onlineUsers[fID]
        const status = !friendStats ? 'offline' : friendStats.typingFor != yID ? 'online' : 'digitando...'

        res.status( 200 ).json([
            friend.name,
            status,
            isfinished,
            messages.map( (message)=>{
                return {
                    id: message.id,
                    text: crypter.decrypt(message.texto),
                    sender: yID == message.id_sender ? "you" : "friend"
                }
            })
        ])

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

router.get( '/profile/:id', async ( req, res ) => {

    const id = + req.params.id
    const yID = + req.userID

    const query = `
        SELECT id, name, tel, email FROM user
        WHERE id = ?;
    `
    const queryFriend = `
        SELECT * FROM friend f
        WHERE (f.id_f1 = :yID AND f.id_f2 = :fID) OR
              (f.id_f2 = :yID AND f.id_f1 = :fID);
    `

    try {
        
        const db = await connection()
        const result = await db.get( query, [id] )

        if (!result)
            return res.status(404).json({"error":"id not found"})


        const isYourFriend = await db.get( queryFriend, { ":yID": yID, ":fID": id } ) != undefined

        res.status(200).json({
            name: result.name,
            id,
            yourID: yID,
            tel: result.tel,
            email: result.email,
            isYourFriend
        })

    } catch (err) {
        console.log(err);
        res.status(500).json(err)
    }

    

})

export default router