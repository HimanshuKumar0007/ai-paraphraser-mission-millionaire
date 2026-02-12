import { Cashfree } from "cashfree-pg";
import dotenv from "dotenv";

dotenv.config();

try {
    Cashfree.configure({
        environment: "sandbox",
        clientId: process.env.CASHFREE_CLIENT_ID,
        clientSecret: process.env.CASHFREE_CLIENT_SECRET
    });

    console.log("✅ Cashfree configured successfully!");
    console.log("Client ID:", process.env.CASHFREE_CLIENT_ID ? "Set" : "Not set");
    console.log("Client Secret:", process.env.CASHFREE_CLIENT_SECRET ? "Set" : "Not set");
} catch (error) {
    console.error("❌ Cashfree configuration failed:", error.message);
    process.exit(1);
}
