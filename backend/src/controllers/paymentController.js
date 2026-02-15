// paymentController.js
import crypto from 'crypto';
import sql from '../config/db.js';

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userEmail = req.user.email || "test@example.com";
        const customerId = "user_" + userId;
        const orderId = "order_" + Date.now();

        const payload = {
            order_id: orderId,
            order_amount: 399,
            order_currency: "INR",
            customer_details: {
                customer_id: customerId,
                customer_email: userEmail,
                customer_phone: "9999999999"
            },
            order_meta: {
                return_url: `${process.env.FRONTEND_URL}/payment-success.html?order_id={order_id}`,
                notify_url: `${process.env.API_BASE_URL}/webhook/cashfree`
            }
        };

        // DEBUG: Log Environment Variables (Safe)
        console.log("DEBUG ENV: CASHFREE_MODE =", process.env.CASHFREE_MODE);

        // FORCING PRODUCTION MODE
        const CASHFREE_MODE = "production";
        const CASHFREE_URL = "https://api.cashfree.com/pg/orders";

        console.log(`[Payment] Creating order in ${CASHFREE_MODE} mode: ${CASHFREE_URL}`);

        const response = await fetch(CASHFREE_URL, {
            method: "POST",
            headers: {
                "x-client-id": process.env.CASHFREE_CLIENT_ID,
                "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
                "Content-Type": "application/json",
                "x-api-version": "2022-09-01"
            },
            body: JSON.stringify(payload)
        });

        const rawResponse = await response.text();
        console.log("Cashfree Raw Response:", rawResponse);
        const data = JSON.parse(rawResponse);

        if (data.payment_session_id) {
            res.json({
                success: true,
                payment_session_id: data.payment_session_id,
                order_id: data.order_id
            });
        } else {
            console.error("Cashfree Error Response:", data);
            res.status(500).json({ error: "Failed to create order", details: data.message });
        }

    } catch (err) {
        console.error("Cashfree Create Order Error:", err);
        res.status(500).json({ error: "Payment initiation failed", details: err.message });
    }
};

export const verifyOrder = async (req, res) => {
    try {
        const { order_id } = req.body;
        const userId = req.user.userId;

        if (!order_id) {
            return res.status(400).json({ error: "Order ID is required" });
        }

        // FORCING PRODUCTION MODE
        const CASHFREE_MODE = "production";
        const CASHFREE_URL = `https://api.cashfree.com/pg/orders/${order_id}`;

        console.log(`[Payment] Verifying order ${order_id} at ${CASHFREE_URL}`);

        const response = await fetch(CASHFREE_URL, {
            method: "GET",
            headers: {
                "x-client-id": process.env.CASHFREE_CLIENT_ID,
                "x-client-secret": process.env.CASHFREE_CLIENT_SECRET,
                "x-api-version": "2022-09-01"
            }
        });

        const data = await response.json();
        console.log("Cashfree Verification Response:", data);

        if (data.order_status === "PAID") {
            // Update user to premium
            await sql`update users set plan = 'premium' where id = ${userId}`;
            console.log(`User ${userId} upgraded to premium`);

            return res.json({ success: true, message: "Order verified and user upgraded" });
        } else {
            return res.status(400).json({ success: false, message: "Order not paid", status: data.order_status });
        }

    } catch (err) {
        console.error("Verify Order Error:", err);
        res.status(500).json({ error: "Verification failed", details: err.message });
    }
};
