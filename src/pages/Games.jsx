import { useEffect, useState } from "react";
import { Gamepad2, Search, Plus, Pencil, Trash2 } from "lucide-react";
import api from "../api/axios";
import "../styles/Games.css";

function Games() {
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadGames = async () => {
      try {
        const res = await api.get("/games");
        if (!isMounted) return;

        if (res.data?.success) setGames(res.data.games || []);
        else if (Array.isArray(res.data)) setGames(res.data);
        else setGames(res.data.games || []);
      } catch {
        if (isMounted) setMessage("Failed to load games");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadGames();

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = games.filter((g) =>
    (g.game_name || g.name || "").toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="games-state">
        <div className="games-loader"></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="games-page">
      <div className="games-page-header">
        <div>
          <h1>Games Library</h1>
          <p>{games.length} games available • Manage your catalog</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="games-count">
            <Gamepad2 size={14} />
            <strong>{filtered.length}</strong> Games
          </div>
          <button
            style={{
              height: "38px",
              padding: "0 14px",
              borderRadius: "10px",
              background: "#070A3A",
              color: "#fff",
              border: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Game
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            maxWidth: "360px",
            height: "40px",
            padding: "0 14px",
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "10px",
          }}
        >
          <Search size={16} style={{ color: "#94A3B8" }} />
          <input
            placeholder="Search games..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: "13.5px",
              background: "transparent",
            }}
          />
        </div>
        <span style={{ fontSize: "12.5px", color: "#64748B" }}>
          {filtered.length} results
        </span>
      </div>

      {message && <div className="games-message error">{message}</div>}

      {filtered.length === 0 ? (
        <div className="games-empty">
          <div className="games-empty-icon">
            <Gamepad2 size={22} />
          </div>
          <h3>No games found</h3>
          <p>Try adjusting your search or add a new game</p>
        </div>
      ) : (
        <div className="games-grid">
          {filtered.map((game) => {
            const status = (game.status || "active").toLowerCase();
            return (
              <div className="game-card" key={game.id}>
                <div className="game-card-action">
                  <button>
                    <Pencil size={14} />
                  </button>
                  <button>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="game-card-top">
                  <div className="game-icon">
                    <Gamepad2 size={20} />
                  </div>
                  <span className={`game-status game-status-${status}`}>
                    {status}
                  </span>
                </div>
                <div className="game-card-content">
                  <h3>{game.game_name || game.name}</h3>
                  <p>ID #{game.id} • {game.platform || "PC / Console"}</p>
                </div>
                <div className="game-card-footer">
                  <span>● Available</span>
                  <strong>Manage</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Games;