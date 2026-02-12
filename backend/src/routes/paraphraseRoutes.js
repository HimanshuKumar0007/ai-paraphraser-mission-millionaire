import express from "express";
import sql from "../db.js"; // Correct import path for db.js based on file structure
import { paraphraseText } from "../services/deepseek.service.js";
import { requireAuth } from "../middleware/authMiddleware.js"; // Named import

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
    try {
        const { text, tone, strength } = req.body;
        const user = req.user; // populated by requireAuth

        if (!text) {
            return res.status(400).json({ error: "Text required" });
        }

        // Fetch fresh user data to get current usage count and plan
        const [userData] = await sql`
            SELECT plan, daily_usage_count 
            FROM users 
            WHERE id = ${user.userId}
        `;

        if (!userData) {
            return res.status(401).json({ error: "User not found" });
        }

        // 🔒 Usage Control
        if (userData.plan === "free" && userData.daily_usage_count >= 2) {
            return res.status(403).json({ error: "Free limit reached (2/day). Upgrade for more!" });
        }
        if (userData.plan === "premium" && userData.daily_usage_count >= 50) {
            return res.status(403).json({ error: "Premium limit reached (50/day)." });
        }

        // 📏 Input Length Validation
        const MAX_CHARS = userData.plan === "premium" ? 20000 : 2000;
        if (text.length > MAX_CHARS) {
            return res.status(400).json({
                error: `Text too long. Limit is ${MAX_CHARS} characters for your plan.`
            });
        }

        // Default strength to medium
        const selectedStrength = strength || "medium";

        const result = await paraphraseText(text, tone, selectedStrength);

        // Update usage count
        await sql`
            UPDATE users 
            SET daily_usage_count = daily_usage_count + 1 
            WHERE id = ${user.userId}
        `;

        res.json({ result });

    } catch (err) {
        console.error("Paraphrase Route Error:", err.message);
        console.error(err.response?.data);
        res.status(500).json({ error: "AI processing failed" });
    }
});

export default router;
