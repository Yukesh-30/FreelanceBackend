import express from "express";
import { userProfileDetails,userDetailUpdate,updateProfilePicture } from "../../controllers/user.Controller.js";
import upload from "../../middlewares/uploadMiddleware.js";

const userRoute = express.Router()


userRoute.get('/:id',userProfileDetails)
userRoute.put(
  "/profile-picture",
  upload.single("profileImage"),
  updateProfilePicture
);

userRoute.patch('/:id',userDetailUpdate)

export default userRoute;