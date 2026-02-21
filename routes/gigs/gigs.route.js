import express from "express"
import { createGig, deleteGigById, getAllGigs,getGigById} from "../../controllers/gigs.Controller.js";

const gigsRoute = express.Router()

gigsRoute.get('/all',getAllGigs);
gigsRoute.get('/:id',getGigById);
gigsRoute.post('/create',createGig);
gigsRoute.delete('/delete/:id',deleteGigById);



export default gigsRoute