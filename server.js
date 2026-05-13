const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// Persistent Shell - keeps running 24/7
// ============================================
const BUFFER_LIMIT = 5000; // Max lines in history buffer
let outputBuffer = [];     // Ring buffer for terminal output
let commandHistory = [];   // User command history
let bashProcess = null;

function startBash() {
  console.log('[SHELL] Starting persistent bash session...');

  bashProcess = spawn('/bin/bash', [], {
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      HOME: '/root',
      PS1: '\\[\\033[01;32m\\]\\u@debian11\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '
    },
    cwd: '/root',
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Capture all stdout output
  bashProcess.stdout.on('data', (data) => {
    const text = data.toString();
    pushToBuffer(text);
    broadcast(text);
  });

  // Capture stderr
  bashProcess.stderr.on('data', (data) => {
    const text = data.toString();
    pushToBuffer(text);
    broadcast(text);
  });

  // If shell exits, restart it (keeps it 24/7)
  bashProcess.on('exit', (code) => {
    console.log(`[SHELL] Bash exited with code ${code}. Restarting in 1s...`);
    const msg = `\n\x1b[33m[SHELL] Process exited (code ${code}). Restarting...\x1b[0m\n`;
    pushToBuffer(msg);
    broadcast(msg);
    setTimeout(() => startBash(), 1000);
  });

  bashProcess.on('error', (err) => {
    console.error('[SHELL] Error:', err.message);
    const msg = `\n\x1b[31m[SHELL] Error: ${err.message}\x1b[0m\n`;
    pushToBuffer(msg);
    broadcast(msg);
  });

  // Welcome message
  const welcome = `
\x1b[36m╔══════════════════════════════════════════════╗\x1b[0m
\x1b[36m║                                              ║\x1b[0m
\x1b[36m║     \x1b[1;32mDebian 11 Web Terminal - 24/7\x1b[0m          \x1b[36m║\x1b[0m
\x1b[36m║     \x1b[33mPersistent Session Active\x1b[0m                \x1b[36m║\x1b[0m
\x1b[36m║                                              ║\1b[0m
\x1b[36m║     \x1b[37mUser: root\x1b[0m                             \x1b[36m║\x1b[0m
\x1b[36m║     \x1b[37mOS:   Debian 11 (Bullseye)\x1b[0m            \x1b[36m║\x1b[0m
\x1b[36m║     \x1b[37mPort: 8080\x1b[0m                            \x1b[36m║\x1b[0m
\x1b[36m║                                              ║\x1b[0m
\x1b[36m╚══════════════════════════════════════════════╝\x1b[0m

\x1b[33mSession persists on refresh. Terminal keeps running 24/7.\x1b[0m
\x1b[90mType commands below or use the web interface.\x1b[0m

`;
  pushToBuffer(welcome);
  console.log('[SHELL] Persistent bash session started.');
}

function pushToBuffer(text) {
  // Split into lines for buffer
  const lines = text.split('\n');
  for (const line of lines) {
    outputBuffer.push(line);
  }
  // Trim buffer if too long
  if (outputBuffer.length > BUFFER_LIMIT) {
    outputBuffer = outputBuffer.slice(-BUFFER_LIMIT);
  }
}

function broadcast(text) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify({ type: 'output', data: text }));
    }
  });
}

// ============================================
// WebSocket Handler
// ============================================
wss.on('connection', (ws) => {
  console.log('[WS] Client connected.');

  // Send current buffer history on connect
  const history = outputBuffer.join('\n');
  ws.send(JSON.stringify({ type: 'history', data: history }));

  // Send connected message to all
  const connectMsg = `\x1b[90m--- web client connected ---\x1b[0m\n`;
  pushToBuffer(connectMsg);
  broadcast(connectMsg);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === 'input' && bashProcess && bashProcess.stdin.writable) {
      const cmd = msg.data;
      commandHistory.push(cmd);

      // Write command to bash stdin
      bashProcess.stdin.write(cmd + '\n');
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected.');
    const disconnectMsg = `\x1b[90m--- web client disconnected ---\x1b[0m\n`;
    pushToBuffer(disconnectMsg);
    broadcast(disconnectMsg);
  });

  ws.on('error', (err) => {
    console.error('[WS] Error:', err.message);
  });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    shellRunning: bashProcess ? !bashProcess.killed : false,
    clients: wss.clients.size,
    uptime: process.uptime()
  });
});

// ============================================
// Start Server
// ============================================
startBash();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\x1b[32m[SERVER] Web Terminal running on http://0.0.0.0:${PORT}\x1b[0m`);
  console.log(`\x1b[32m[SERVER] WebSocket endpoint: ws://0.0.0.0:${PORT}\x1b[0m`);
});
