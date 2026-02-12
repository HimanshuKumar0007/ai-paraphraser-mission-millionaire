import pkg from "cashfree-pg";
const { Cashfree } = pkg;
import dotenv from "dotenv";

dotenv.config();

try {
    console.log(" Cashfree object:", typeof Cashfree);
    console.log("Cashfree methods:", Object.getOwnPropertyNames(Cashfree));
    console.log("Cashfree keys:", Object.keys(Cashfree));

    if (Cashfree.XClientId !== undefined) {
        console.log("Using old SDK initialization");
        Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
        Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
        Cashfree.XEnvironment = "SANDBOX";
        console.log("✅ Old SDK method successful");
    } else if (typeof Cashfree.configure === 'function') {
        console.log("Using new SDK configure()");
        Cashfree.configure({
            environment: "sandbox",
            clientId: process.env.CASHFREE_CLIENT_ID,
            clientSecret: process.env.CASHFREE_CLIENT_SECRET
        });
        console.log("✅ New SDK method successful");
    } else {
        console.log("❌ Unknown Cashfree SDK version");
    }
} catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
}
