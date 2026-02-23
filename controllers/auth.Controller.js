import sql from "../config/dbConfig.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import crypto from "crypto"
import sgMail from "@sendgrid/mail"
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(['CLIENT', 'FREELANCER', 'ADMIN']) 
});

const loginSchema = z.object({
    email: z.string().email().trim().toLowerCase(),
    password: z.string().min(1, "Password is required"),
});

const forgotSchema = z.object({ email: z.string().email().trim().toLowerCase() });

const resetSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
});

sgMail.setApiKey(process.env.SEND_GRID_API_KEY)

dotenv.config();

const signUpController = async (req, res) => {
    const validation = signUpSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: validation.error.errors[0].message });
    }

    const { email, password, role, fullName } = validation.data;

    try {
        const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
        if (existing.length > 0) {
            return res.status(409).json({ message: "Email already in use" });
        }

        const saltRounds = parseInt(process.env.HASH_SALT_VALUE || '10');
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        await sql`
            INSERT INTO users (email, password_hash, role, full_name) 
            VALUES (${email}, ${hashedPassword}, ${role}, ${fullName})
        `;

        return res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        console.error("Signup Error:", error); // Log for internal tracking
        return res.status(500).json({ message: "Internal server error" });
    }
};

const logInController = async (req,res)=>{
    try {
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ message: "Invalid Input" });
        }

        const {email,password} = validation.data;
        
        const users = await sql`SELECT id,email,password_hash,role from users where email=${email}`
        
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
        }
        
        const token = jwt.sign({
            id:user.id,
            email : user.email,
            role : user.role
        },process.env.JWT_SECRETE_KEY,{expiresIn : "2hr"})

        res.status(200).json({
            message: "Login successful",
            token,
        })
    } catch (error) {
        //Log Error
        console.error("Critical Login Error:", error);
        
        res.status(500).json({
            message : "Internal server error"
        })
    }
}

const forgotPasswordController = async (req, res) => {
    const validation = forgotSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: "Valid email is required" });
    }

    const { email } = validation.data;

    try {
        const users = await sql`SELECT id, email FROM users WHERE email = ${email}`;
        
        // Security: Always return 200 even if user doesn't exist
        if (users.length === 0) {
            return res.status(200).json({ message: "Reset link sent if account exists" });
        }

        const user = users[0];
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expireTime = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await sql`
            UPDATE users 
            SET reset_token = ${hashToken}, 
                reset_token_expires_at = ${expireTime} 
            WHERE id = ${user.id}
        `;

        const url = `${process.env.BASE_FRONTEND_URL}/reset-password?token=${rawToken}`;
        await sgMail.send({
            to: user.email,
            from: process.env.EMAIL_FROM, // Use env variable
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 15 mins.</p>`
        });

        return res.status(200).json({ 
            message: "Reset link sent if account exists",
            url
         });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const resetPasswordController = async (req, res) => {

    const validation = resetSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ message: "Invalid input", errors: validation.error.flatten().fieldErrors });
    }

    const { token, newPassword } = validation.data;

    try {
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        
        const users = await sql`
            SELECT id FROM users 
            WHERE reset_token = ${hashedToken} 
            AND reset_token_expires_at > ${new Date().toISOString()}
        `;
        
        
        if (users.length === 0) {
            return res.status(400).json({ message: "Token is invalid or has expired" });
        }
        
        const salt = parseInt(process.env.HASH_SALT_VALUE || '10');
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await sql`
            UPDATE users 
            SET password_hash = ${hashedPassword}, 
                reset_token = NULL, 
                reset_token_expires_at = NULL 
            WHERE id = ${users[0].id}
        `;
           
        return res.status(200).json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export {signUpController,logInController,forgotPasswordController,resetPasswordController};