import express from "express"
import {
  createClientProfile,
  getMyClientProfile,
  updateClientProfile,
  getClientProfileByUserId
}  from "../../controllers/client.Controller.js";
import { protect, requireClient } from "../../middlewares/authMiddleware.js";


const clientRoute = express.Router()

clientRoute.get('/client-profile/me', protect, requireClient, getMyClientProfile);
clientRoute.put('/client-profile/me', protect, requireClient, updateClientProfile);
clientRoute.post('/client-profile/me', protect, requireClient, createClientProfile);

clientRoute.get('/client-profile/:id', getClientProfileByUserId);

export default clientRoute;