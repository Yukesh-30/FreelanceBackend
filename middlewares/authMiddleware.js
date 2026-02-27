import express from "express";
import jwt from "jsonwebtoken"
import sql from "../config/dbConfig.js";
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

export const correspondingClient = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    const result = await sql.query(
      `SELECT client_id FROM jobs WHERE id = $1`,
      [jobId]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (result[0].client_id !== userId) {
      return res.status(403).json({
        message: "Forbidden: Access restricted to job owner"
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export { protect, requireFreelancer, requireClient, requireAdmin };