import sql from './src/db.js';

async function testConnection() {
    try {
        const result = await sql`SELECT 1`;
        console.log('✅ Connection successful:', result);
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
