import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sql from "./src/db.js";
import testRoutes from "./src/routes/testRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import paraphraseRoutes from "./src/routes/paraphraseRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import webhookRoutes from "./src/routes/webhookRoutes.js";
import { requireAuth } from "./src/middleware/authMiddleware.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: "*"
}));
// Webhook parsing might need strict JSON or raw body depending on signature verification.
// For now, express.json() is likely enough as Cashfree sends JSON.
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

app.use("/auth", authRoutes);
app.use("/api/paraphrase", paraphraseRoutes);
app.use("/test", testRoutes);
app.use("/payment", paymentRoutes);
app.post("/api/cashfree/webhook", async (req, res) => {
    console.log("🔥 WEBHOOK HIT");
    console.log("BODY:", req.body);
    res.status(200).send("OK");
});

app.use("/webhook", webhookRoutes);

app.get("/protected", requireAuth, async (req, res) => {
    try {
        // Fetch fresh user data from DB to get latest plan status
        const user = await sql`SELECT id, email, plan FROM users WHERE id = ${req.user.userId}`;

        if (!user.length) {
            return res.status(401).json({ error: "User not found" });
        }

        res.json({
            message: "You are authenticated",
            user: user[0]
        });
    } catch (err) {
        console.error("Protected Route Error:", err);
        res.status(500).json({ error: "Server error fetching user data" });
    }
});

app.get("/", async (req, res) => {
    try {
        const result = await sql`SELECT 1`;
        res.json({
            status: "Backend is running 🚀",
            database: "Connected ✅",
            db_response: result
        });
    } catch (err) {
        res.status(500).json({
            status: "Backend is running 🚀",
            database: "Connection Failed ❌",
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
