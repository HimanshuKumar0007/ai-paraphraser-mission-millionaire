
import express from 'express';
const app = express();
const PORT = 3001; // Try different port

app.get('/', (req, res) => res.send('Hello World!'));

const server = app.listen(PORT, () => {
    console.log(`Minimal Server running on port ${PORT}`);
});

server.on('error', (e) => {
    console.error("Server Error:", e);
});

// Also keep process alive explicitly if needed (should not be needed)
setInterval(() => { }, 10000);
