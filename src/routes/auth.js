import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import connection from '../database/connection.js'

dotenv.config()

const router = express.Router()

//função de geração de token
const generateToken = ( id ) =>{

    const jwtOptions = {
        expiresIn : "1day"
    }

    return jwt.sign( id , process.env.SECRET, jwtOptions )

}

//rotas

router.post('/register', async (req,res) =>{

    const name = req.body.name
    const email = req.body.email

    const query = `
        INSERT INTO user( name, email, password)
        VALUES ( ?, ?, ? );
    `
    const idQuery = `
        SELECT id FROM user
        WHERE email = ?
    `
    
    try {
        const password = await bcrypt.hash( req.body.password, 10)

        const db = await connection()
        await db.run( query, [name,email,password] )

        const id = await db.get( idQuery, [email] )

        res.status(201).json({ 
            "message": "registration completed",
            token: generateToken(id) 
        })

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
        SELECT id, password FROM user
        WHERE email = ?
    `

    try {
        
        const db = await connection()
        const result = await db.get( query, [email] )

        if (result){

            if ( await bcrypt.compare( password, result.password ) )
                res.status(200).json({token: generateToken({id:result.id})})
            else
                res.status( 406 ).json({ err: "password err" })

        }
        else
            res.status( 404 ).json({ err: "email err" })

    } catch (err) {
        console.log(err);
        res.status(500).json(err)
    }

} )

router.get( '/auth', async (req, res) => {

    const token = req.headers.authorization

    jwt.verify(token, process.env.SECRET, ( err, decoded )=>{

        if (err)
            return res.status(203).json(err)
        
        return res.status(200).json(decoded)

    })

} )

export default router