import onlineUsers from '../temp/onlineUsers.js'
import sendMessage from "../utils/message.js"

export default (skt, userId) =>{
    const newMessageHandler = async (texto, friendId) =>{

        await sendMessage(texto, userId, friendId)
        const friendStatus = onlineUsers[friendId]
        const newMessage = {
            id: new Date().getTime(),
            text: texto,
            sender: "you"
        }
        skt.emit('receivedMessage', newMessage, userId, friendId)
        if (friendStatus){
            newMessage.sender = "friend"
            skt.to(friendStatus.socket).emit('receivedMessage', newMessage, userId, friendId)
            skt.to(friendStatus.socket).emit('notificate', userId)
        }
    }
    
    const changeTypingStatusHandler = (id, typing) =>{
    
        if (onlineUsers[userId])
            onlineUsers[userId].typingFor = typing ? id : 0
        if (onlineUsers[id])
            skt.to(onlineUsers[id].socket).emit('friendStatusChange', typing ? 'digitando...' : 'online', userId )
    }
    
    const disconnectHandler = () =>{
        onlineUsers[userId] = null
        skt.broadcast.emit('friendStatusChange', 'offline' , userId)
        console.log(skt.id + ' desconectou');
    }

    skt.on('newMessage', newMessageHandler)
    skt.on('changeTypingStatus', changeTypingStatusHandler)
    skt.on('disconnect', disconnectHandler)
}