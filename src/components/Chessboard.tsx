"use client";
import { useState, useEffect, useRef } from "react";
import classes from "./Chessboard.module.css";
import { Board } from "@/utils/board";
import {
 IconChess,
 IconChessBishopFilled,
 IconChessFilled,
 IconChessKingFilled,
 IconChessKnightFilled,
 IconChessQueenFilled,
 IconChessRookFilled,
} from "@tabler/icons-react";

interface ChessboardProps {
  ws?: WebSocket | null;
}

export function Chessboard({ ws }: ChessboardProps) {
 const [currentBoard, setCurrentBoard] = useState(new Board());
 const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
 const [possibleMoves, setPossibleMoves] = useState<{row: number, col: number}[]>([]);
 const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
 const [assignedPlayer, setAssignedPlayer] = useState<'white' | 'black' | 'spectator' | null>(null);
 const [connected, setConnected] = useState(false);
 const wsRef = useRef<WebSocket | null>(null);

 useEffect(() => {
  if (ws) {
   wsRef.current = ws;
   setConnected(true);

   // Add message handler for game state updates
   const handleMessage = (event: MessageEvent) => {
    try {
     const data = JSON.parse(event.data);

     if (data.type === 'assigned') {
      setAssignedPlayer(data.player);
      if (data.gameState) {
       const newBoard = new Board();
       newBoard.fields = data.gameState.board;
       setCurrentBoard(newBoard);
       setCurrentPlayer(data.gameState.currentPlayer);
      }
     } else if (data.type === 'gameState') {
      const newBoard = new Board();
      newBoard.fields = data.board;
      setCurrentBoard(newBoard);
      setCurrentPlayer(data.currentPlayer);
      setSelectedSquare(null);
      setPossibleMoves([]);
     } else if (data.type === 'gameReset') {
      const newBoard = new Board();
      newBoard.fields = data.gameState.board;
      setCurrentBoard(newBoard);
      setCurrentPlayer(data.gameState.currentPlayer);
      setSelectedSquare(null);
      setPossibleMoves([]);
     }
    } catch (error) {
     // Ignore parsing errors
    }
   };

   ws.addEventListener('message', handleMessage);
   ws.addEventListener('close', () => {
    setConnected(false);
    setAssignedPlayer(null);
   });

   return () => {
    ws.removeEventListener('message', handleMessage);
    ws.removeEventListener('close', () => {
     setConnected(false);
     setAssignedPlayer(null);
    });
   };
  } else {
   setConnected(false);
   setAssignedPlayer(null);
  }
 }, [ws]);

 const handleSquareClick = (row: number, col: number) => {
  if (!connected || assignedPlayer === 'spectator' || assignedPlayer !== currentPlayer) {
   return;
  }

  const piece = currentBoard.getPiece(row, col);

  if (selectedSquare) {
   // Send move to server
   if (wsRef.current && assignedPlayer === currentPlayer) {
    wsRef.current.send(JSON.stringify({
     type: 'move',
     fromRow: selectedSquare.row,
     fromCol: selectedSquare.col,
     toRow: row,
     toCol: col
    }));
   }
   setSelectedSquare(null);
   setPossibleMoves([]);
  } else if (piece && piece.player === assignedPlayer && !currentBoard.isCheckmate(assignedPlayer)) {
   // Select the piece
   setSelectedSquare({ row, col });
   setPossibleMoves(currentBoard.getValidMoves(row, col));
  }
 };

 return (
  <>
   <div style={{ textAlign: 'center', marginBottom: '10px' }}>
    <div>Status: {connected ? 'Connected' : 'Disconnected'}</div>
    <div>You are: {assignedPlayer ? assignedPlayer.toUpperCase() : 'Waiting...'}</div>
    <div>Turn: {currentPlayer ? currentPlayer.toUpperCase() : 'Waiting...'}</div>
   </div>
   <div className={classes.gameContainer}>
    <div className={classes.chessboardWrapper}>
     <div className={classes.chessboard}>
      {currentBoard.fields.map((boardRow, rowIndex) => {
       const isEven = rowIndex % 2 === 0;
       let light = !isEven;
       return boardRow.map((field, columnIndex) => {
        light = !light;

        const isSelected = selectedSquare && selectedSquare.row === rowIndex && selectedSquare.col === columnIndex;
        const isPossibleMove = possibleMoves.some(move => move.row === rowIndex && move.col === columnIndex);
        const isCurrentPlayerPiece = field && field.player === currentPlayer;

        return (
         <div
          className={
           classes.field + " " + (light ? classes.light : classes.dark) +
           (isSelected ? " " + classes.selected : "") +
           (isPossibleMove ? " " + classes.possibleMove : "") +
           (isCurrentPlayerPiece ? " " + classes.currentPlayerPiece : "")
          }
          key={`${rowIndex}_${columnIndex}`}
          onClick={() => handleSquareClick(rowIndex, columnIndex)}
         >
          {field && (
           <div
            className={
             classes.chesspiece +
             " " +
             (field.player === "black" ? classes.darkPlayer : classes.lightPlayer)
            }
           >
            {field.kind === "pawn" && <IconChessFilled />}
            {field.kind === "rook" && <IconChessRookFilled />}
            {field.kind === "knight" && <IconChessKnightFilled />}
            {field.kind === "bishop" && <IconChessBishopFilled />}
            {field.kind === "queen" && <IconChessQueenFilled />}
            {field.kind === "king" && <IconChessKingFilled />}
           </div>
          )}
         </div>
        );
       });
      })}
     </div>
    </div>
   </div>
  </>
 );
}
