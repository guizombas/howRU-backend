
import onlineUsers from '../temp/onlineUsers.js'
import registerHandlers from './registerHandlers.js'

const connectionHandler = (skt) =>{

    const userId = skt.handshake.auth.token
    console.log(userId + ' conectou');
    skt.broadcast.emit('friendStatusChange', 'online' , userId)
    onlineUsers[userId] = {
        typingFor: 0,
        socket: skt.id
    }

    registerHandlers(skt, userId)

}

export default connectionHandler