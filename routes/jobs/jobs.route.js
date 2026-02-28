import express from "express";
import {
  createJob,
  getJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
  getAllJobs
} from "../../controllers/jobs.Controller.js";

import { correspondingClient, protect, requireClient } from "../../middlewares/authMiddleware.js";

const jobsRoute = express.Router();


//For contract enga we have two endpoints

jobsRoute.get('/all-jobs', getAllJobs)

//
jobsRoute.post("/", protect, requireClient, createJob);
jobsRoute.get("/", getJobs);
jobsRoute.get("/me", protect, requireClient, getMyJobs);
jobsRoute.get("/:id", getJobById);
jobsRoute.put("/:id", protect, correspondingClient, updateJob);
jobsRoute.delete("/:id", protect, correspondingClient, deleteJob);



export default jobsRoute;