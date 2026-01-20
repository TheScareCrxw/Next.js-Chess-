♟️ Realtime Multiplayer Chess

A real-time multiplayer chess web application inspired by chess.com. Built with Next.js and WebSockets, this project allows two players to connect, play chess live, and chat in the same game session.

The frontend is deployed with Vercel and the WebSocket backend is hosted on Render, providing fast, scalable real-time communication.

🚀 Live Demo

Frontend:

next-js-chess-virid.vercel.app

Backend (WebSocket):

wss://your-backend.onrender.com

✨ Features

Real-time multiplayer chess using WebSockets

Automatic player assignment (white / black)

Move validation and turn enforcement

Live board updates

In-game chat

Game reset functionality

Clean UI with Tabler SVG icons

🛠 Tech Stack

Next.js – Frontend framework

Node.js – Backend runtime

WebSocket (ws) – Real-time communication

Render Web Services – Backend hosting

Vercel – Frontend hosting

Tabler Icons – SVG icon system

🧩 Architecture

Frontend (Next.js on Vercel)

Backend (Node.js WebSocket server on Render)

Clients connect via secure WebSocket (wss://)

Server manages game state and broadcasts updates

⚙️ Setup

Clone the repository:

git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name


Install dependencies:

npm install
