import express from 'express'
import { applyForJobById, getAllApplicationByJobId, statusUpdate, getFreelancerApplications, getFreelancerContracts } from '../../controllers/contract.Controller.js';

const contractRoute = express.Router()

//for this add the middleware that only freelancer can request
contractRoute.post('/:id/apply', applyForJobById)
contractRoute.get('/:id/applications', getAllApplicationByJobId)
contractRoute.patch('/:id/status', statusUpdate)

// New endpoints for Freelancer dashboard
contractRoute.get('/freelancer/:id/applications', getFreelancerApplications)
contractRoute.get('/freelancer/:id/contracts', getFreelancerContracts)

export default contractRoute;