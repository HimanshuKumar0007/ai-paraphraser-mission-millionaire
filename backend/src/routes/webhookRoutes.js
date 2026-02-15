import express from "express";
import crypto from "crypto";
import sql from "../db.js";

const router = express.Router();

function verifyCashfreeSignature(body, signature, secret) {
    // 1. Remove signature field
    const payload = { ...body };
    delete payload.signature;

    // 2. Sort keys
    const sortedKeys = Object.keys(payload).sort();

    // 3. Create string
    let postData = "";
    sortedKeys.forEach(key => {
        postData += payload[key];
    });

    // 4. Create HMAC SHA256
    const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(postData)
        .digest("base64");

    return generatedSignature === signature;
}

// Need parsed body for this verification method
router.post("/cashfree", express.json(), express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const signature = req.headers["x-webhook-signature"] || req.body.signature;

        const isValid = verifyCashfreeSignature(
            req.body,
            signature,
            process.env.CASHFREE_CLIENT_SECRET // "Same API Secret" as requested (Client Secret)
        );

        if (!isValid) {
            console.log("❌ Invalid webhook signature - Check if CASHFREE_CLIENT_SECRET matches dashboard");
            // Log details for debugging if needed, but keeping it clean as per user snippet
            return res.status(400).send("Invalid signature");
        }

        console.log("✅ Valid webhook");

        // User snippet destructuring. 
        // Note: req.body structure depends on Cashfree version & event. 
        // User's snippet assumes flat structure or specific event type.
        // We will trust the user's snippet structure for now.
        const { order_id, order_status, customer_details } = req.body;

        if (order_status === "PAID") {
            // upgrade user plan
            // User requested to use email.
            if (customer_details && customer_details.customer_email) {
                await sql`
                    UPDATE users
                    SET plan = 'premium'
                    WHERE email = ${customer_details.customer_email}
                `;
                console.log("🎉 User upgraded to premium");
            } else {
                console.error("❌ Customer email missing in webhook body");
            }
        }

        res.status(200).send("OK");

    } catch (err) {
        console.error("Webhook error:", err);
        res.status(500).send("Server error");
    }
});

export default router;
