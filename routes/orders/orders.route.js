import express from "express"
import { getFreelancerOrders, updateGigOrderStatus } from "../../controllers/contract.Controller.js";

const ordersRoute = express.Router()

ordersRoute.get('/',getFreelancerOrders)
ordersRoute.patch('/:id',updateGigOrderStatus)

export default ordersRoute
