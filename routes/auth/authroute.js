import express from "express";
import { signUpController,logInController,forgotPasswordController,resetPasswordController } from "../../controllers/auth.Controller.js";
import { protect } from "../../middlewares/authMiddleware.js";

const authRoute = express.Router()

authRoute.post('/register',signUpController);
authRoute.post('/login',logInController);
authRoute.post('/forget-password',forgotPasswordController)
authRoute.post('/reset-password',resetPasswordController)


export default authRoute;
