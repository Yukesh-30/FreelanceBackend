import express from "express";
import { submitWork,viewSubmittedWork,updateStatusForSubmission,getSingleSubmission } from "../../controllers/submission.controller.js";
import upload from "../../middlewares/uploadMiddleware.js";
const SubmissionRouter = express.Router();

SubmissionRouter.post("/:contractId/submit",upload.array('files', 10),submitWork);
SubmissionRouter.get("/:contractId/submission",viewSubmittedWork);
SubmissionRouter.patch("/:id",updateStatusForSubmission);
SubmissionRouter.get("/:id",getSingleSubmission);

export default SubmissionRouter;