import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const authMidleware = async ( req, res, next ) =>{
 
    const token = req.headers.authorization

    if (!token)
        return res.status(400).send("No token provided")

    jwt.verify(token, process.env.SECRET, ( err, decoded )=>{

        if (err)
            return res.status(400).json(err)
        
        req.userID = decoded.id
        return next()

    })

}

export default authMidleware