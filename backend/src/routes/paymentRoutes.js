import express from "express";
import { createOrder, verifyOrder } from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", requireAuth, createOrder);
router.post("/verify-order", requireAuth, verifyOrder);

export default router;
