import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3010;
const DATA_DIR = path.join(__dirname, 'data');
const DIST_DIR = path.join(__dirname, '../dist');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SCENES_FILE = path.join(DATA_DIR, 'scenes.json');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([
        { id: 'user_1', username: 'admin', password: 'password123', name: 'Administrador Andina' }
    ], null, 2));
}
if (!fs.existsSync(SCENES_FILE)) {
    fs.writeFileSync(SCENES_FILE, JSON.stringify([], null, 2));
}

function readJSON(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
        return [];
    }
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // API endpoints
    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                const users = readJSON(USERS_FILE);
                const user = users.find(u => u.username === username && u.password === password);
                
                if (user) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        token: `token_${user.id}_${Date.now()}`,
                        user: { id: user.id, username: user.username, name: user.name }
                    }));
                } else {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Usuario o contraseña incorrectos' }));
                }
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload inválido' }));
            }
        });
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/register') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { username, password, name } = JSON.parse(body);
                const users = readJSON(USERS_FILE);

                if (users.some(u => u.username === username)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'El nombre de usuario ya existe' }));
                    return;
                }

                const newUser = { id: `user_${Date.now()}`, username, password, name: name || username };
                users.push(newUser);
                writeJSON(USERS_FILE, users);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    token: `token_${newUser.id}_${Date.now()}`,
                    user: { id: newUser.id, username: newUser.username, name: newUser.name }
                }));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Payload inválido' }));
            }
        });
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/scenes') {
        const scenes = readJSON(SCENES_FILE);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(scenes));
        return;
    }

    if (req.method === 'POST' && url.pathname === '/api/scenes') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const scenePayload = JSON.parse(body);
                const scenes = readJSON(SCENES_FILE);
                
                const newScene = {
                    id: `scene_${Date.now()}`,
                    name: scenePayload.name || 'Escenario Andina',
                    createdAt: new Date().toISOString(),
                    data: scenePayload
                };

                scenes.unshift(newScene);
                writeJSON(SCENES_FILE, scenes);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newScene));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error al guardar escenario' }));
            }
        });
        return;
    }

    // Static Frontend File Serving for Production Docker Container
    if (req.method === 'GET') {
        let reqPath = url.pathname === '/' ? '/editor.html' : url.pathname;
        let filePath = path.join(DIST_DIR, reqPath);

        if (!fs.existsSync(filePath)) {
            const rootFilePath = path.join(__dirname, '..', reqPath);
            if (fs.existsSync(rootFilePath) && fs.statSync(rootFilePath).isFile()) {
                filePath = rootFilePath;
            } else {
                filePath = path.join(DIST_DIR, 'editor.html');
            }
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor Backend Render Andina iniciado en puerto ${PORT}`);
});
