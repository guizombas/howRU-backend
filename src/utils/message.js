import connection from '../database/connection.js'
import Crypter from 'cryptr'
import dotenv from 'dotenv'

dotenv.config()

const sendMessage = async (text, idSender, idReceiver) =>{
    
    const crypter = new Crypter(process.env.SECRET)
    text = crypter.encrypt( text )

    const query = `
        INSERT INTO message( texto, id_sender, id_receiver, send_time )
        VALUES (?, ?, ?, datetime('now') );
    `

    try {

        const db = await connection()
        await db.run( query, [text,idSender,idReceiver] )/*
        res.status(201).json({"message":"message sent"})*/

    } catch (err) {
        console.log(err);/*
        res.status(500).json(err)*/
    }
}

export default sendMessage