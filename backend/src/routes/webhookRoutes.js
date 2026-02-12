import express from "express";
import { cashfreeWebhook } from "../controllers/webhookController.js";

const router = express.Router();

router.post("/cashfree", cashfreeWebhook);

export default router;
