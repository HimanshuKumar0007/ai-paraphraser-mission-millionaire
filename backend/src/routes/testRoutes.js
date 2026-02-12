import express from "express";
import { testDB } from "../controllers/testController.js";

const router = express.Router();
router.get("/db", testDB);

export default router;
