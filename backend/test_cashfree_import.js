import { Cashfree, CFEnvironment } from "cashfree-pg";
console.log("Cashfree:", Cashfree);
console.log("CFEnvironment:", CFEnvironment);
if (CFEnvironment) {
    console.log("CFEnvironment.SANDBOX:", CFEnvironment.SANDBOX);
}
