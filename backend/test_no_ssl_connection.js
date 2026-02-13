import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

async function testConnection() {
    try {
        console.log('Connecting to:', connectionString);
        // Default options (no SSL enforced)
        const sql = postgres(connectionString);
        const result = await sql`SELECT 1`;
        console.log('✅ Connection successful:', result);
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
