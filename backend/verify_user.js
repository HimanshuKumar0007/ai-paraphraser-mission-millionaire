import sql from './src/db.js';

async function checkUser() {
    try {
        const email = "humanshuk8@gmail.com";
        console.log(`Checking user: ${email}`);
        const users = await sql`SELECT * FROM users WHERE email = ${email}`;

        if (users.length === 0) {
            console.log("User not found!");
        } else {
            console.log("User found:", users[0]);
            console.log("Reset Token:", users[0].reset_password_token);
            console.log("Reset Expires:", users[0].reset_password_expires);
        }
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        // sql.end(); // postgres.js handles connection pool, might stick open if not closed or if script doesn't exit
        process.exit();
    }
}

checkUser();
