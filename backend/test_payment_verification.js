const testEndpoints = async () => {
    try {
        console.log("Testing /payment/test...");
        const res1 = await fetch("http://localhost:3000/payment/test");
        console.log("/payment/test status:", res1.status);
        const text1 = await res1.text();
        console.log("/payment/test body:", text1);

        console.log("\nTesting /payment/create-order (without auth)...");
        const res2 = await fetch("http://localhost:3000/payment/create-order", {
            method: "POST"
        });
        console.log("/payment/create-order status:", res2.status);
    } catch (err) {
        console.error("Test failed:", err.message);
    }
};
testEndpoints();
