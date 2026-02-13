import sql from "./../db/dbConfig.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import crypto from "crypto"
import sgMail from "@sendgrid/mail"

sgMail.setApiKey(process.env.SEND_GRID_API_KEY)

dotenv.config();

const signUpController = async (req,res)=>{
    const {email,password,role} = req.body
    if(!email || !password || !role){
        res.status(400).json({
            message : "User information required!"
        })
    }

    try {
        
        const hashedPassword = await bcrypt.hash(password,parseInt(process.env.HASH_SALT_VALUE))
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

const forgotPasswordController = async (req,res)=>{
    const {email} = req.body
    if(!email){
        return res.status(400).json({
            message : "Enter the email"
        })
    }
    try {
        const users = await sql`SELECT * FROM users WHERE email=${email}`
        if(users.length===0){
            return res.status(404).json({
                message : "No user found"
            })
        }

        

        const currentUserEmail = users[0].email
        
        const rawToken = crypto.randomBytes(32).toString("hex")

        const hashToken = crypto.createHash("sha256").update(rawToken).digest("hex")

        
        await sql`UPDATE users SET reset_token=${hashToken} WHERE email=${currentUserEmail}`

        const url = `${process.env.BASE_FRONTEND_URL}/reset-password?token=${rawToken}`
        
        const msg = {
            to: currentUserEmail, 
            from: 'kmrlsih15@gmail.com', 
            subject: 'Request for Password Reset',
            text: `
                You requested a password reset.

                Click the link below to reset your password:
                ${url}

                If you did not request this, ignore this email.
                    `,
                    html: `
                    <h2>Password Reset Request</h2>
                    <p>You requested a password reset.</p>
                    <a href="${url}" 
                        style="display:inline-block;padding:10px 15px;
                        background-color:#4CAF50;color:white;
                        text-decoration:none;border-radius:5px;">
                        Reset Password
                    </a>
                    <p>If you did not request this, ignore this email.</p>
                    `
        }

        
        
        await sgMail.send(msg)
        

        return res.status(200).json({
            message : "Mail sent successfully",
            url
        })


    } catch (error) {
        console.log("FULL ERROR:", error);
        console.log("SENDGRID RESPONSE:", error.response?.body);

        return res.status(500).json({
            message : "Internal server error"
        });
       
    }

}

const resetPasswordController = async (req,res)=>{
    const {token,newPassword} = req.body

    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
        
        const users = await sql`SELECT * FROM users where reset_token=${hashedToken}`

        if(users.length===0){
            return res.status(404).json({
                message:"user not found"
            })
        }

        
        const hashedPassword = await bcrypt.hash(newPassword,parseInt(process.env.HASH_SALT_VALUE))
        await sql`UPDATE users SET reset_token = NULL, password_hash = ${hashedPassword} WHERE reset_token = ${hashedToken}`;
        return res.status(200).json({
            message:"Password updated successfully"
        })

    } catch (error) {
        return res.status(500).json({
            message:"Internal server error"
        })
    }
}
export {signUpController,logInController,forgotPasswordController,resetPasswordController};