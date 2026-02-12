import sql from "../config/db.js";

export const testDB = async (req, res) => {
    try {
        const result = await sql`select now()`;
        res.json({
            success: true,
            time: result[0].now
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB connection failed" });
    }
};
