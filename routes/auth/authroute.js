import express from "express";
import { signUpController,logInController,forgotPasswordController,resetPasswordController } from "../../controllers/authController.js";

const authRoute = express.Router()

authRoute.post('/register',signUpController);
authRoute.post('/login', logInController);
authRoute.post('/forget-password',forgotPasswordController)
authRoute.post('/reset-password',resetPasswordController)


export default authRoute;
