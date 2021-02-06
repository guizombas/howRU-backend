import connection from '../database/connection.js'

const sendMessage = async (text, idSender, idReceiver) =>{
    
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