import { Routes, Route } from "react-router-dom";
import Chat from "./chat";
import Home from "./home";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  autoConnect: true,
  reconnectionAttempts: 5,
});

socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
socket.on("disconnect", () => console.log("❌ Socket disconnected"));
socket.on("matched", (data) => console.log("🎉 Matched!", data));
socket.on("searching", () => console.log("🔍 Searching..."));
socket.on("connect_error", (err) => console.log("🔴 Connection error:", err.message));

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home socket={socket} />} />
      <Route path="/chat" element={<Chat socket={socket} />} />
    </Routes>
  );
}

export default App;