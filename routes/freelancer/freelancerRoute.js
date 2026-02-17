import express from "express"
import { getFreelancerDetails, updateFreelancerProfile } from "../../controllers/freelancerController.js";



const freelancerRoute = express.Router()

freelancerRoute.get('/details/:id',getFreelancerDetails);
freelancerRoute.patch('/details/:id',updateFreelancerProfile)


export default freelancerRoute;