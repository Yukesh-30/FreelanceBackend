import express from 'express'
import { applyForJobById, getAllApplicationByJobId, statusUpdate } from '../../controllers/contract.Controller.js';

const contractRoute = express.Router()

//for this add the middleware that only freelancer can request
contractRoute.post('/:id/apply', applyForJobById)
contractRoute.get('/:id/applications', getAllApplicationByJobId)
contractRoute.patch('/:id/status', statusUpdate)

export default contractRoute;