
import http from 'http';

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
});

const PORT = 3002;

try {
    server.listen(PORT, '127.0.0.1', () => {
        console.log(`HTTP Server running on port ${PORT}`);
    });

    server.on('error', (e) => {
        console.error('Server error:', e);
    });
} catch (e) {
    console.error("Sync error:", e);
}

// Keep alive
setInterval(() => { }, 5000);
