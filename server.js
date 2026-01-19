const http = require('http');
const WebSocket = require('ws');
const { Board } = require('./board');

const port = process.env.PORT || 8080;

const server = http.createServer();
const wss = new WebSocket.Server({ server });

server.listen(port, () => {
  console.log(`WebSocket server running on port ${port}`);
});


let gameState = {
  board: new Board(),
  currentPlayer: 'white',
  players: {
    white: null,
    black: null
  },
  spectators: []
};

function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

function sendToPlayer(player, data) {
  if (gameState.players[player]) {
    gameState.players[player].send(JSON.stringify(data));
  }
}

wss.on('connection', (ws) => {
  console.log('New client connected');

  // Only allow 2 players: first = white, second = black, reject others
  let assignedPlayer = null;
  if (!gameState.players.white) {
    assignedPlayer = 'white';
    gameState.players.white = ws;
  } else if (!gameState.players.black) {
    assignedPlayer = 'black';
    gameState.players.black = ws;
  } else {
    // Reject third connection - only 2 players allowed
    console.log('Game full - rejecting additional player');
    ws.send(JSON.stringify({ type: 'gameFull', message: 'Game is full. Only 2 players allowed.' }));
    ws.close();
    return;
  }

  // Send assignment and initial state
  ws.send(JSON.stringify({
    type: 'assigned',
    player: assignedPlayer,
    gameState: {
      board: gameState.board.fields,
      currentPlayer: gameState.currentPlayer
    }
  }));

  // Notify others
  broadcast({
    type: 'playerJoined',
    player: assignedPlayer
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'move' && assignedPlayer === gameState.currentPlayer) {
        // Validate and make move
        const testBoard = gameState.board.copy();
        const success = testBoard.movePiece(data.fromRow, data.fromCol, data.toRow, data.toCol);

        if (success && !testBoard.isInCheck(gameState.currentPlayer)) {
          gameState.board = testBoard;
          gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';

          // Broadcast new state
          broadcast({
            type: 'gameState',
            board: gameState.board.fields,
            currentPlayer: gameState.currentPlayer
          });
        }
      }

      if (data.type === 'chat') {
        // Broadcast chat message to all clients
        broadcast({
          type: 'chat',
          text: data.text,
          player: assignedPlayer,
          timestamp: data.timestamp
        });
      }

      if (data.type === 'reset') {
        // Reset the game
        gameState.board = new Board();
        gameState.currentPlayer = 'white';

        broadcast({
          type: 'gameReset',
          gameState: {
            board: gameState.board.fields,
            currentPlayer: gameState.currentPlayer
          }
        });
      }


    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (assignedPlayer) {
      gameState.players[assignedPlayer] = null;
      broadcast({
        type: 'playerLeft',
        player: assignedPlayer
      });
    } else {
      // Remove from spectators
      const index = gameState.spectators.indexOf(ws);
      if (index > -1) {
        gameState.spectators.splice(index, 1);
      }
    }
  });
});


