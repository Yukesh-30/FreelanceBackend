import express from "express";
import {
  fundContract,
  paymentWebhook,
  getContractPaymentStatus,
  releaseEscrow
} from "../../controllers/payment.Controller.js";

import { protect, requireClient } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/:contractId/fund",
  protect,
  requireClient,
  fundContract
);

router.get(
  "/:contractId/status",
  protect,
  getContractPaymentStatus
);

router.post(
  "/:contractId/release",
  protect,
  requireClient,
  releaseEscrow
);

export default router;