import sql from "../db.js"; // Pointing to src/db.js which server.js uses

export const cashfreeWebhook = async (req, res) => {
    try {
        console.log("🔥 WEBHOOK HIT");
        console.log("BODY:", req.body);
        console.log("Expected Event Type:", req.body.type);
        console.log("Expected Event Type:", req.body.type);

        const event = req.body;
        console.log("Webhook Received:", JSON.stringify(event, null, 2));

        if (event.type === "PAYMENT_SUCCESS_WEBHOOK" || event.type === "PAYMENT_SUCCESS") {
            try {
                // Ensure data exists before accessing
                const orderId = event.data?.order?.order_id;
                const userId = event.data?.customer_details?.customer_id;

                console.log(`Processing Payment Success for Order: ${orderId}, User: ${userId}`);

                if (userId) {
                    await sql`
                        UPDATE users
                        SET plan = 'premium',
                            daily_usage_count = 0,
                            last_usage_date = ${new Date()}
                        WHERE id = ${userId}
                    `;
                    console.log(`User ${userId} upgraded to Premium`);
                } else {
                    console.error("No customer_id found in webhook payload");
                }
            } catch (dbError) {
                console.error("Database Update Error:", dbError);
                // Even if DB update fails, we might want to return 200 to Cashfree so they don't retry endlessly?
                // But if we want them to retry, we should return 500.
                // For now, I'll bubble it up or consistency. 
                // Actually, if we fail to upgrade user, we PROBABLY want a retry or manual intervention.
                // But the user didn't specify. I'll stick to the requested change of response format.
                throw dbError;
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Webhook Error:", err);
        res.status(500).json({ error: "Webhook processing failed" });
    }
};

