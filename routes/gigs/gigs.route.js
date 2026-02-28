import express from "express"
import { createGig, deleteGigById, getAllGigs, getGigById, postMedia, updateGig, deleteMediaById, createPackage, deletePackageById, updatePackageById, getGigsByFreelancerId } from "../../controllers/gigs.Controller.js";
import { createGigOrder } from "../../controllers/contract.Controller.js";
import { requireClient, protect } from "../../middlewares/authMiddleware.js";
import upload from "../../middlewares/uploadMiddleware.js";

const gigsRoute = express.Router()

gigsRoute.get('/all', getAllGigs);
gigsRoute.get('/:id', getGigById);
gigsRoute.post('/create', upload.fields([{ name: 'cover_pic', maxCount: 1 }, { name: 'media_files', maxCount: 10 }]), createGig);
gigsRoute.delete('/delete/:id', deleteGigById);

gigsRoute.get('/all-gigs/:id', getGigsByFreelancerId);

// for the update gig basic infomation

gigsRoute.patch('/update/:id', updateGig)


//gig media
gigsRoute.post('/:id/media', upload.array('media', 10), postMedia)
gigsRoute.delete('/media', deleteMediaById)

//pakage
gigsRoute.post('/package/:id', createPackage)
gigsRoute.delete('/package/:id', deletePackageById)
gigsRoute.patch('/package/:id', updatePackageById)

//orders (Flow B)
gigsRoute.post('/:id/order',createGigOrder)


export default gigsRoute