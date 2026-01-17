"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./Chat.module.css";

interface Message {
  id: number;
  text: string;
  timestamp: Date;
  player?: string;
}

interface ChatProps {
  ws: WebSocket | null;
  assignedPlayer: 'white' | 'black' | 'spectator' | null;
}

export function Chat({ ws, assignedPlayer }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ws) {
      setConnected(true);
      wsRef.current = ws;

      // Add our message handler for chat messages
      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);

          // Handle chat messages
          if (data.type === 'chat') {
            const message: Message = {
              id: Date.now(),
              text: data.text,
              timestamp: new Date(data.timestamp),
              player: data.player
            };
            setMessages(prev => [...prev, message]);
          }
        } catch (error) {
          // Ignore parsing errors for non-JSON messages
        }
      };

      ws.addEventListener('message', handleMessage);

      ws.onclose = () => {
        setConnected(false);
        ws.removeEventListener('message', handleMessage);
      };

      return () => {
        ws.removeEventListener('message', handleMessage);
      };
    } else {
      setConnected(false);
      wsRef.current = null;
    }
  }, [ws]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && wsRef.current && connected && assignedPlayer !== 'spectator') {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        text: input,
        player: assignedPlayer,
        timestamp: new Date().toISOString()
      }));
      setInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        Chat
      </div>

      <div className={styles.messageList}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.messageItem}>
            <div className={`${styles.messageText} ${msg.player === 'black' ? styles.messageTextBlack : ''}`}>
              {msg.player ? `${msg.player.toUpperCase()}: ${msg.text}` : msg.text}
            </div>
            <div className={styles.messageTimestamp}>
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className={styles.messageInput}
            disabled={!connected}
          />
          <button
            onClick={sendMessage}
            disabled={!connected || !input.trim()}
            className={styles.sendButton}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
