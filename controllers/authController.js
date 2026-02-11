import sql from "./../db/dbConfig.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"

dotenv.config();

const signUpController = async (req,res)=>{
    const {email,password,role} = req.body
    if(!email || !password || !role){
        res.status(400).json({
            message : "User information required!"
        })
    }

    try {
        const saltValue = 10;
        const hashedPassword = await bcrypt.hash(password,saltValue)
        await sql`INSERT INTO users (email,password_hash,role) VALUES (${email},${hashedPassword},${role})`
        res.status(201).json({
            message:"User created successfully"
        })

    } catch (error) {
        res.status(500).json({
            message : "Internel server error"
        })
    }
}

const logInController = async (req,res)=>{
    try {
        const {email,password} = req.body
        console.log(`${email} ${password}`)
        if(!email || !password){
            res.status(400).json({
                message : "User information is required"
            })
        }
        
        const user = await sql`SELECT id,email,password_hash from users where email=${email}`
        
        if(user.length===0){
            res.status(404).json({
                message : "User not found"
            })
        }

        const validPassword = await bcrypt.compare(password,user[0].password_hash)
       
        if(!validPassword){
            res.status(400).json({
                message : "Invalid password"
            })
        }
        
        const token = jwt.sign({
            id:user[0].id,
            email : user[0].email,
            role : user[0].role
        },process.env.JWT_SECRETE_KEY,{expiresIn : "2hr"})

        res.status(200).json({
            token,
        })
    } catch (error) {
        res.status(500).json({
            message : "Internal server error"
        })
    }
}
export {signUpController,logInController};