import express from "express"
import { createGig, deleteGigById, getAllGigs,getGigById,postMedia,updateGig,deleteMediaById, createPackage, deletePackageById,updatePackageById, getGigsByFreelancerId} from "../../controllers/gigs.Controller.js";

const gigsRoute = express.Router()

gigsRoute.get('/all',getAllGigs);
gigsRoute.get('/:id',getGigById);
gigsRoute.post('/create',createGig);
gigsRoute.delete('/delete/:id',deleteGigById);

gigsRoute.get('/all-gigs/:id',getGigsByFreelancerId);

// for the update gig basic infomation

gigsRoute.patch('/update/:id',updateGig)


//gig media
gigsRoute.post('/:id/media',postMedia)
gigsRoute.delete('/media',deleteMediaById)

//pakage
gigsRoute.post('/package/:id',createPackage)
gigsRoute.delete('/package/:id',deletePackageById)
gigsRoute.patch('/package/:id',updatePackageById)


export default gigsRoute