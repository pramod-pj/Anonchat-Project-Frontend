import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

function Home({ socket }) {
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [dots, setDots] = useState("");

  useEffect(() => {
    socket.on("matched", () => {
      navigate("/chat");
    });

    socket.on("searching", () => {
      setSearching(true);
    });

    return () => {
      socket.off("matched");
      socket.off("searching");
    };
  }, [navigate, socket]);

  useEffect(() => {
    if (!searching) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [searching]);

  const findPartner = () => {
    setSearching(true);
   
    socket.emit("find_match");
  };

  const cancelSearch = () => {
    setSearching(false);
    socket.emit("cancel_search");
  };

  return (
    <div className="home-wrapper">
      <header className="home-header">
        <div className="logo">
          <span className="logo-dot" />
          <span className="logo-text">
            Anon<span>Chat</span>
          </span>
        </div>
        <div className="header-badge">
          <span className="pulse-ring" />
          <span className="badge-dot" />
          <span>Anonymous</span>
        </div>
      </header>

      <main className="home-main">
        <div className="hero-tag">⚡ Real-time · No accounts · No logs</div>

        <h1 className="hero-title">
          Talk to 👻<br />
          <span className="hero-accent">Stranger</span>
        </h1>

        <p className="hero-sub">
          Instant anonymous connections. No accounts, no history, no
          traces&nbsp;— just raw conversation.
        </p>

        {!searching ? (
          <button className="find-btn" onClick={findPartner}>
            <span className="btn-inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 20l-3-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Find a Chat Partner
            </span>
          </button>
        ) : (
          <div className="search-state">
            <button className="find-btn searching" disabled>
              <span className="btn-inner">
                <span className="spinner" />
                Searching{dots}
              </span>
            </button>
            <button className="cancel-btn" onClick={cancelSearch}>
              Cancel
            </button>
            <p className="searching-hint">
              Matching you with someone anonymous…
            </p>
          </div>
        )}
      </main>

      <footer className="home-footer">
        <div className="stat">
          <span className="stat-num">∞</span>
          <span className="stat-label">Connections</span>
        </div>
        <div className="divider-v" />
        <div className="stat">
          <span className="stat-num">0</span>
          <span className="stat-label">Data stored</span>
        </div>
        <div className="divider-v" />
        <div className="stat">
          <span className="stat-num">100%</span>
          <span className="stat-label">Anonymous</span>
        </div>
      </footer>
    </div>
  );
}

export default Home;
