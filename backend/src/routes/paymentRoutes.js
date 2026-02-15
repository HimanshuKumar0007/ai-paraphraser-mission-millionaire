import express from "express";
import { createOrder, verifyOrder } from "../controllers/paymentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", requireAuth, createOrder);
router.post("/verify-order", requireAuth, verifyOrder);
router.get("/test", (req, res) => res.json({ status: "Payment Routes Working 🚀" }));

export default router;
