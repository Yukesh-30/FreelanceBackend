import express from "express";
import { signUpController,logInController } from "../../controllers/authController.js";

const authRoute = express.Router()

authRoute.post('/register',signUpController);
authRoute.post('/login', logInController);


export default authRoute;
