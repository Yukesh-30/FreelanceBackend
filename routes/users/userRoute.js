import express from "express";
import { userProfileDetails,userDetailUpdate } from "../../controllers/userController.js";

const userRoute = express.Router()


userRoute.get('/:id',userProfileDetails)
userRoute.patch('/:id',userDetailUpdate)

export default userRoute;