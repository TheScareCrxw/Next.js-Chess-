"use client";
import { useState, useRef, useEffect } from "react";
import { Chessboard } from "../components/Chessboard";
import { Chat } from "../components/Chat";
import { ControlPanel } from "../components/ControlPanel";

export default function Home() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [assignedPlayer, setAssignedPlayer] = useState<'white' | 'black' | 'spectator' | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to websocket server
    const websocket = new WebSocket('https://chess-h1qw.onrender.com');
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
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '200px', borderRight: '1px solid #ccc' }}>
        <ControlPanel onReset={handleReset} />
      </div>
      <div style={{ flex: 1 }}>
        <Chessboard ws={ws} />
      </div>
      <div style={{ width: '300px', borderLeft: '1px solid #ccc' }}>
        <Chat ws={ws} assignedPlayer={assignedPlayer} />
      </div>
    </div>
  );
}
