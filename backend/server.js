import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sql from "./src/db.js";
import testRoutes from "./src/routes/testRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import paraphraseRoutes from "./src/routes/paraphraseRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import { requireAuth } from "./src/middleware/authMiddleware.js";
import crypto from "crypto";

dotenv.config();

const app = express();

// Security: Hide Express framework information
app.disable('x-powered-by');

app.use(cors({
    origin: [
        "https://wordlyai.pro",
        "https://www.wordlyai.pro"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.options('*', cors());
app.options('*', cors());

function verifySignature(body, signature, secret) {
    const payload = { ...body };
    delete payload.signature;

    const sortedKeys = Object.keys(payload).sort();

    let data = "";
    sortedKeys.forEach(key => {
        data += payload[key];
    });

    const generated = crypto
        .createHmac("sha256", secret)
        .update(data)
        .digest("base64");

    return generated === signature;
}

app.post("/api/cashfree/webhook", express.json(), async (req, res) => {
    try {
        const signature = req.headers["x-webhook-signature"] || req.body.signature;

        const isValid = verifySignature(
            req.body,
            signature,
            process.env.CASHFREE_CLIENT_SECRET
        );

        if (!isValid) {
            console.log("❌ Invalid signature");
            return res.status(400).send("Invalid");
        }

        console.log("✅ Valid webhook");

        const { order_status, customer_details } = req.body;

        if (order_status === "PAID") {

            const email = customer_details.customer_email;

            await sql`
                UPDATE users
                SET plan = 'premium'
                WHERE email = ${email}
            `;

            console.log("🎉 User upgraded:", email);
        }

        res.status(200).send("OK");

    } catch (err) {
        console.error("Webhook Error:", err);
        res.status(500).send("Error");
    }
});
// For now, express.json() is likely enough as Cashfree sends JSON.
app.use(express.json());

// Security: Block access to sensitive paths
app.use((req, res, next) => {
    if (req.url.includes('.env') || req.url.includes('.git')) {
        return res.status(403).send("Forbidden");
    }
    next();
});

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

app.get("/health", (req, res) => {
    res.json({ status: "OK" });
});

app.use("/auth", authRoutes);
app.use("/api/paraphrase", paraphraseRoutes);
app.use("/test", testRoutes);
app.use("/payment", paymentRoutes);


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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
