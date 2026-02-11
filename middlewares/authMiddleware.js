import express from "express";
import jwt from "jsonwebtoken"
//This will authenticate the token when user login
const protectedRoute = async (req,res,next) =>{
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized: No token provided"
            });
        }
        const token = authHeader.split(" ")[1]
        const decodedMessage = jwt.verify(token,process.env.JWT_SECRETE_KEY)

        req.user = decodedMessage
        next()
    } catch (error) {
        const status = error.name === 'JsonWebTokenError' ? 401 : 500;
        const message = error.name === 'JsonWebTokenError' ? "Invalid token" : "Internal server error";
        
        res.status(status).json({ message });
    }



}