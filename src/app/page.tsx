"use client";
import { useState, useRef, useEffect } from "react";
import { Chessboard } from "../components/Chessboard";
import { Chat } from "../components/Chat";
import { ControlPanel } from "../components/ControlPanel";
import { ChessPiece } from "../utils/board";

export default function Home() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [assignedPlayer, setAssignedPlayer] = useState<'white' | 'black' | 'spectator' | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{
    white: ChessPiece[],
    black: ChessPiece[]
  }>({ white: [], black: [] });
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to websocket server
    const websocket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'wss://next-js-chess.onrender.com' || 'ws://localhost:8080'); 
    //
    wsRef.current = websocket;
    setWs(websocket);

    websocket.onopen = () => {
      console.log('Connected to game server');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'assigned') {
        setAssignedPlayer(data.player);
        console.log('Assigned as:', data.player);
      } else if (data.type === 'gameFull') {
        console.log('Game is full:', data.message);
        alert('Game is full! Only 2 players allowed. Please try again later.');
        websocket.close();
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected from game server');
      setAssignedPlayer(null);
    };

    return () => {
      websocket.close();
    };
  }, []);

  const sendMessage = (data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  };

  const handleReset = () => {
    sendMessage({ type: 'reset' });
    setCapturedPieces({ white: [], black: [] });
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '250px', borderRight: '1px solid #ccc' }}>
        <ControlPanel onReset={handleReset} capturedPieces={capturedPieces} />
      </div>
      <div style={{ flex: 1 }}>
        <Chessboard ws={ws} capturedPieces={capturedPieces} setCapturedPieces={setCapturedPieces} />
      </div>
      <div style={{ width: '300px', borderLeft: '1px solid #ccc' }}>
        <Chat ws={ws} assignedPlayer={assignedPlayer} />
      </div>
    </div>
  );
}
