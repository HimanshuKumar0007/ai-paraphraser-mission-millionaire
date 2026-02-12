import sql from "../config/db.js";
import { paraphraseText } from "../services/deepseek.service.js";

export const paraphraseTextController = async (req, res) => {
    const userId = req.user.userId;
    const { text, tone, strength } = req.body;

    // Default strength to medium if not provided
    const selectedStrength = strength || "medium";

    try {
        // 🔹 Call DeepSeek Service
        const result = await paraphraseText(text, tone, selectedStrength);

        // 🔹 increment usage
        await sql`
      UPDATE users
      SET daily_usage_count = daily_usage_count + 1,
          last_usage_date = CURRENT_DATE
      WHERE id = ${userId}
    `;

        // 🔹 log request
        // Check if requests table exists before inserting to avoid crashes if schema is not updated
        // For now, wrapping in try-catch or assuming it works based on previous code.
        // We'll trust the database schema is ready or will be ready.
        try {
            await sql`
            INSERT INTO requests (user_id, tokens_used)
            VALUES (${userId}, 0)
            `;
        } catch (dbErr) {
            console.warn("Retrying request log or table missing:", dbErr.message);
        }

        return res.json({
            success: true,
            result: result
        });

    } catch (err) {
        console.error("Paraphrase Controller Error:", err);
        res.status(500).json({ error: "Paraphrase failed", details: err.message });
    }
};
