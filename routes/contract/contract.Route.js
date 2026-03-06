import express from 'express'
import { applyForJobById, getAllApplicationByJobId, statusUpdate, getFreelancerApplications, getFreelancerContracts, getClientContracts } from '../../controllers/contract.Controller.js';

const contractRoute = express.Router()

//for this add the middleware that only freelancer can request
contractRoute.post('/:id/apply', applyForJobById)
contractRoute.get('/:id/applications', getAllApplicationByJobId)
contractRoute.patch('/:id/status', statusUpdate)

// New endpoints for Freelancer dashboard
contractRoute.get('/freelancer/:id/applications', getFreelancerApplications)
contractRoute.get('/freelancer/:id/contracts', getFreelancerContracts)

// New endpoint for Client dashboard
contractRoute.get('/client/:id/contracts', getClientContracts)

export default contractRoute;
