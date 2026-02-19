import express from "express";
import jwt from "jsonwebtoken"
//This will authenticate the token when user login
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized: No token provided"
            });
        }
        const token = authHeader.split(" ")[1]
        const decodedMessage = jwt.verify(token, process.env.JWT_SECRETE_KEY)

        req.user = decodedMessage
        next()
    } catch (error) {
        const status = error.name === 'JsonWebTokenError' ? 401 : 500;
        const message = error.name === 'JsonWebTokenError' ? "Invalid token" : "Internal server error";

        res.status(status).json({ message });
    }
}

const requireFreelancer = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== "FREELANCER") {
            return res.status(403).json({
                message: "Forbidden: Access restricted to freelancers only"
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: "Internal server error checking role" });
    }
}

const requireClient = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== "CLIENT") {
            return res.status(403).json({
                message: "Forbidden: Access restricted to clients only"
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: "Internal server error checking role" });
    }
}

// Optional: for Admin
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== "ADMIN") {
            return res.status(403).json({
                message: "Forbidden: Access restricted to admins only"
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: "Internal server error checking role" });
    }
}


export { protect, requireFreelancer, requireClient, requireAdmin };