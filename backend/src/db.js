import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const sql = postgres(connectionString, {
    ssl: {
        rejectUnauthorized: false
    }
});

export default sql;
