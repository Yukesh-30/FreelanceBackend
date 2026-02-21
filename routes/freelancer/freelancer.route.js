import express from "express"
import { getFreelancerDetails, updateFreelancerProfile, updateFreelancerSkills } from "../../controllers/freelancer.Controller.js";



const freelancerRoute = express.Router()

freelancerRoute.get('/details/:id',getFreelancerDetails);
freelancerRoute.patch('/details/:id',updateFreelancerProfile)
freelancerRoute.patch('/details-skills/:id',updateFreelancerSkills)


export default freelancerRoute;