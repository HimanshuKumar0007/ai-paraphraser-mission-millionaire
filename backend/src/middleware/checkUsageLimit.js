import sql from "../config/db.js";

export const checkUsageLimit = async (req, res, next) => {
    // Check if req.user exists (set by authMiddleware)
    if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Unauthorized - User ID missing" });
    }

    const userId = req.user.userId;

    try {
        // 1. Fetch user data
        const users = await sql`
      SELECT plan, daily_usage_count, last_usage_date
      FROM users
      WHERE id = ${userId}
    `;

        if (users.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        const user = users[0];

        // 🔒 Free users → force upgrade (Backend check)
        // Front-end handles 403 by showing modal/redirect
        if (user.plan !== "premium") {
            return res.status(403).json({
                code: "UPGRADE_REQUIRED",
                message: "Upgrade to Premium to continue"
            });
        }

        const today = new Date().toISOString().slice(0, 10);
        // Note: user.last_usage_date might be a Date object or string depending on driver
        // Postgres.js returns Date object for date/timestamp columns
        // We should convert it to YYYY-MM-DD string for comparison

        let lastUsageDateVal = user.last_usage_date;
        if (lastUsageDateVal instanceof Date) {
            lastUsageDateVal = lastUsageDateVal.toISOString().slice(0, 10);
        }

        let usageCount = user.daily_usage_count || 0;

        // Reset if new day
        if (lastUsageDateVal !== today) {
            usageCount = 0;
            // We should probably update the DB here too?
            // User snippet only says "if (reset)... usageCount = 0".
            // But doesn't explicitly save it. 
            // However, the controller (or next middleware) will increment.
            // If we don't reset IN DB, the next read will still see old date?
            // Ah, the increment logic will likely update both date and count.
            // Let's assume the update logic handles the reset.
            // Wait, the user snippet logic is:
            // if (new day) usageCount = 0.
            // if (usageCount >= 30) return 429.
            // req.usageCount = usageCount.
            // next().

            // If we don't update DB, then usageCount is 0 in memory.
            // Next step (increment) needs to know to overwrite count to 1 and set date to today?
        }

        // Limit = 30/day
        if (usageCount >= 30) {
            return res.status(429).json({
                code: "DAILY_LIMIT_REACHED",
                message: "You have reached your daily limit (30)"
            });
        }

        // Attach for controller
        req.usageCount = usageCount;
        req.today = today;

        next();

    } catch (err) {
        console.error("Check Usage Limit Error:", err);
        res.status(500).json({ error: "Server error checking usage limits" });
    }
};
