const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

const clients = new Map();

wss.on('connection', (ws) => {
  // Generate a unique ID for the client
  const clientId = generateUniqueId();
  clients.set(clientId, ws);

  // Send the client ID to the connected client
  ws.send(JSON.stringify({ type: 'clientId', clientId }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { recipientId, content } = data;

      // Check if recipientId is valid
      if (clients.has(recipientId)) {
        // Send the message to the specified client
        clients.get(recipientId).send(JSON.stringify({ type: 'message', content }));
      } else {
        // Handle invalid recipientId
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid recipient ID' }));
      }
    } catch (error) {
      // Handle invalid JSON format
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON format' }));
    }
  });
});

server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  if (pathname === '/chat') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(3000, () => {
  console.log('WebSocket server is listening on port 3000');
});

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}