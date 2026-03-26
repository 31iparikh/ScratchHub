const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');


const PORT = process.env.PORT || 8000;



const server = http.createServer((req, res) => {
    // Handle API proxy for Google Gemini
    if (req.method === 'POST' && req.url === '/api/gemini') {
        let body = '';
       
        req.on('data', chunk => {
            body += chunk.toString();
        });
       
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const apiKey = data.apiKey;
                const prompt = data.prompt;
               
                const payload = JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                });
               
                const options = {
                    hostname: 'generativelanguage.googleapis.com',
                    path: `/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': payload.length
                    }
                };
               
                const proxyReq = https.request(options, (proxyRes) => {
                    let responseBody = '';
                   
                    proxyRes.on('data', chunk => {
                        responseBody += chunk;
                    });
                   
                    proxyRes.on('end', () => {
                        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(responseBody);
                    });
                });
               
                proxyReq.on('error', (err) => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
                });
               
                proxyReq.write(payload);
                proxyReq.end();
               
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
        return;
    }
   
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }


    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };


    const contentType = mimeTypes[extname] || 'application/octet-stream';


    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            }
            else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        }
        else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});


server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});





