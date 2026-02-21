import express from "express";
import { userProfileDetails,userDetailUpdate } from "../../controllers/user.Controller.js";

const userRoute = express.Router()


userRoute.get('/:id',userProfileDetails)
userRoute.patch('/:id',userDetailUpdate)

export default userRoute;