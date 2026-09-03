import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

export function setupLiveApiProxy(server) {
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', (clientWs) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      clientWs.close(1011, 'GEMINI_API_KEY not set');
      return;
    }
    
    // Connect to Gemini Live API
    const geminiWs = new WebSocket(
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`
    );

    let setupMessageSent = false;
    let initialBuffer = [];

    geminiWs.on('open', () => {
      // Send setup message
      const setupMessage = {
        setup: {
          model: 'models/gemini-3.1-flash-live-preview',
          systemInstruction: {
            parts: [{ text: "You are an AI scheduling assistant. Keep your responses very brief and helpful." }]
          }
        }
      };
      geminiWs.send(JSON.stringify(setupMessage));
    });

    geminiWs.on('message', (data) => {
      // Receive from Gemini, send to client
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    });

    clientWs.on('message', (data) => {
      // Receive from client, send to Gemini
      if (geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(data);
      } else {
         initialBuffer.push(data);
      }
    });

    geminiWs.on('close', () => {
      if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
    });
    
    clientWs.on('close', () => {
      if (geminiWs.readyState === WebSocket.OPEN) geminiWs.close();
    });
  });
}
