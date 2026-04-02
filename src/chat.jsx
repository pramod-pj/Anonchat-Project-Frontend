import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./chat.css";

function Chat({ socket }) {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const mySocketId = useRef(socket.id);

  useEffect(() => {
    mySocketId.current = socket.id;

    socket.emit("get_match_state");

    socket.on("match_state", ({ active }) => {
      if (!active) {
        navigate("/", { replace: true });
        return;
      }
      setConnected(true);
    });

    socket.on("new_message", (msg) => {
      const isMe = msg.from === socket.id;
      setMessages((prev) => [
        ...prev,
        { id: msg.id, text: msg.text, from: isMe ? "me" : "them", ts: msg.timestamp },
      ]);
      setPartnerTyping(false);
    });

    socket.on("partner_typing", () => {
      setPartnerTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setPartnerTyping(false), 2500);
    });


    socket.on("partner_disconnected", () => {
      setConnected(false);
      setMessages((prev) => [
        ...prev,
        { text: "Partner disconnected.", from: "system", ts: Date.now() },
      ]);
    });

 
    socket.on("matched", () => {
      setConnected(true);
      setPartnerTyping(false);
      setMessages([]);
    });

    socket.on("searching", () => {
      setConnected(false);
      setPartnerTyping(false);
      setMessages([
        {
          text: "Looking for a new partner… Stay on this page.",
          from: "system",
          ts: Date.now(),
        },
      ]);
    });

    socket.on("rate_limited", ({ message: msg }) => {
      setMessages((prev) => [
        ...prev,
        { text: `⚠️ ${msg}`, from: "system", ts: Date.now() },
      ]);
    });

    socket.on("error_msg", ({ message: msg }) => {
      setMessages((prev) => [
        ...prev,
        { text: `❌ ${msg}`, from: "system", ts: Date.now() },
      ]);
    });

    socket.on("chat_ended", () => {
      setConnected(false);
    });

    return () => {
      socket.off("match_state");
      socket.off("new_message");
      socket.off("partner_typing");
      socket.off("partner_disconnected");
      socket.off("matched");
      socket.off("searching");
      socket.off("rate_limited");
      socket.off("error_msg");
      socket.off("chat_ended");
    };
  }, [socket, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const sendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed || !connected) return;
    
    socket.emit("send_message", { text: trimmed });
    setMessage("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
  
    socket.emit("typing");
  };

  const handleSkip = () => {
    socket.emit("skip");
    setMessages([]);
    setPartnerTyping(false);
  };

  const handleNewChat = () => {
    socket.emit("end_chat");
    navigate("/");
  };

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chat-wrapper">
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path
                d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          </div>
          <div>
            <div className="chat-partner-name">Anonymous</div>
            <div className="chat-status">
              {connected ? (
                <>
                  <span className="status-dot active" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <span className="status-dot inactive" />
                  <span>Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="chat-header-right">
          {connected && (
            <button className="icon-btn skip-btn" onClick={handleSkip} title="Skip to next">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 4l10 8-10 8V4z" fill="currentColor" />
                <rect x="19" y="4" width="2" height="16" rx="1" fill="currentColor" />
              </svg>
              <span>Skip</span>
            </button>
          )}
          <button className="icon-btn" title="New chat" onClick={handleNewChat}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <p>Say hello to your anonymous partner</p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.from === "system") {
            return (
              <div key={i} className="system-msg">
                <span>{msg.text}</span>
              </div>
            );
          }

          const isMe = msg.from === "me";
          const showAvatar = i === 0 || messages[i - 1]?.from !== msg.from;

          return (
            <div
              key={msg.id || i}
              className={`msg-row ${isMe ? "msg-row--me" : "msg-row--them"} ${
                showAvatar ? "msg-row--first" : ""
              }`}
            >
              {!isMe && showAvatar && <div className="msg-avatar">A</div>}
              {!isMe && !showAvatar && <div className="msg-avatar-gap" />}
              <div className="msg-bubble-wrap">
                <div
                  className={`msg-bubble ${
                    isMe ? "bubble-me" : "bubble-them"
                  }`}
                >
                  {msg.text}
                </div>
                <div
                  className={`msg-time ${isMe ? "time-right" : "time-left"}`}
                >
                  {formatTime(msg.ts)}
                </div>
              </div>
            </div>
          );
        })}

        {partnerTyping && (
          <div className="msg-row msg-row--them">
            <div className="msg-avatar">A</div>
            <div className="typing-indicator">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <div className={`input-box ${!connected ? "input-box--disabled" : ""}`}>
          <textarea
            ref={inputRef}
            className="chat-textarea"
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder={connected ? "Type a message…" : "Chat ended"}
            disabled={!connected}
            rows={1}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!message.trim() || !connected}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M22 2L11 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 2L15 22l-4-9-9-4 20-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="input-hint">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

export default Chat;
