import { useEffect, useState, useCallback } from "react";
import { Search, Play } from "lucide-react";
import api from "../api/axios";
import "../styles/GameSession.css";
import { isAdminOrStaff } from "../utils/auth";

function GameSession() {
  const canManage = isAdminOrStaff();

  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showStart, setShowStart] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [starting, setStarting] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      // Support both /game-session and /game-sessions
      const res = await api.get("/game-session").catch(() => api.get("/game-sessions"));
      if (res.data.success) setSessions(res.data.data || res.data.sessions || []);
      else if (Array.isArray(res.data)) setSessions(res.data);
    } catch (e) {
      setMessage(e.response?.data?.message || "Failed to load sessions");
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const res = await api.get("/booking");
      if (res.data.success) {
        setBookings((res.data.bookings || []).filter(b => ["pending","confirmed"].includes(b.status)));
      }
    } catch {
      /* silent */
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  const getById = useCallback(async (id) => {
    try {
      setDetailsLoading(true);
      setShowDetail(true);
      const res = await api.get(`/game-session/${id}`).catch(() => api.get(`/game-sessions/${id}`));
      if (res.data.success) setSelected(res.data.data || res.data.session);
    } catch {
      setMessage("Failed to load details");
    } finally {
      setDetailsLoading(false);
    }
  }, []);

 const handleStart = async (e) => {
  e.preventDefault();

  if (!selectedBookingId) return;

  const booking = bookings.find(
    (b) => String(b.id) === String(selectedBookingId)
  );

  if (!booking) {
    setMessage("Selected booking not found");
    return;
  }

  try {
    setStarting(true);
    setMessage("");

    const now = new Date();

    const pad = (value) => String(value).padStart(2, "0");

    const startTime =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const res = await api.post("/game-session", {
      user_id: booking.user_id,
      game_id: booking.game_id,
      station_id: booking.station_id,
      start_time: startTime,
      amount: booking.amount || 0,
      status: "active",
      recording_status: "not_recorded",
    });

    if (res.data.success) {
      setMessage("Game session started successfully");
      setShowStart(false);
      setSelectedBookingId("");

      await fetchSessions();
    } else {
      setMessage(res.data.message || "Failed to start session");
    }

  } catch (err) {
    console.error("Start Session Error:", err);

    setMessage(
      err.response?.data?.message ||
      "Failed to start game session"
    );

  } finally {
    setStarting(false);
  }
};

const handleEnd = async (session) => {
  const confirmEnd = window.confirm(
    `End Session #${session.id} for ${session.user_name}?`
  );

  if (!confirmEnd) return;

  try {
    setMessage("");

    const now = new Date();

    const pad = (value) => String(value).padStart(2, "0");

    const endTime =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const res = await api.put(`/game-session/${session.id}`, {
      end_time: endTime,
      status: "completed"
    });

    if (res.data.success) {
      setMessage("Game session ended successfully");
      await fetchSessions();
    } else {
      setMessage(
        res.data.message || "Failed to end game session"
      );
    }

  } catch (err) {
    console.error("End Session Error:", err);

    setMessage(
      err.response?.data?.message ||
      "Failed to end game session"
    );
  }
};

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchSessions();
      setLoading(false);
    };
    load();
  }, [fetchSessions]);

  const filtered = sessions.filter(s =>
    (s.user_name || "").toLowerCase().includes(filter.toLowerCase()) ||
    (s.game_name || "").toLowerCase().includes(filter.toLowerCase())
  );

  const active = sessions.filter(s => s.status === "active").length;

  if (loading) {
    return (
      <div className="game-session-page">
        <div className="game-session-loading">
          <div className="loading-spinner"></div>
          <p>Loading game sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game-session-page">
      <div className="game-session-header">
        <div>
          <h1>Game Sessions</h1>
          <p>{sessions.length} sessions • {active} active now • Monitor live gameplay</p>
        </div>
        {canManage && (
          <button className="start-session-btn" onClick={async () => { setShowStart(true); await fetchBookings(); }}>
            <Play size={14} /> Start Session
          </button>
        )}
      </div>

      {/* SEARCH BAR - FIXES YOUR SCREENSHOT PLAIN INPUT */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'18px',gap:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px',width:'100%',maxWidth:'360px',height:'40px',padding:'0 14px',background:'#fff',border:'1px solid #E2E8F0',borderRadius:'10px'}}>
          <Search size={16} style={{color:'#94A3B8',flexShrink:0}}/>
          <input placeholder="Search player, game..." value={filter} onChange={e=>setFilter(e.target.value)} style={{border:'none',outline:'none',width:'100%',fontSize:'13.5px',background:'transparent',color:'#0F172A'}}/>
        </div>
        <span style={{fontSize:'12.5px',color:'#64748B'}}>{filtered.length} results</span>
      </div>

      {message && <div className="game-session-message">{message}</div>}

      <div className="game-session-list-section">
        <div className="section-header">
          <h2>All Sessions</h2>
          <span className="session-count">{filtered.length}</span>
        </div>

        {filtered.length===0? (
          <div className="empty-game-sessions">
            <div className="empty-icon">🎮</div>
            <h3>No Game Sessions</h3>
            <p>No sessions match your search.</p>
          </div>
        ) : (
          <div className="game-session-grid">
            {filtered.map((sess) => (
              <div className="game-session-item" key={sess.id}>
                <div className="game-session-item-header">
                  <span className="session-number">Session #{sess.id}</span>
                  <span className={`session-status status-${sess.status || 'active'}`}>{sess.status || 'active'}</span>
                </div>

                <div className="game-session-details">
                  <div className="session-detail-row"><span>Player</span><strong>{sess.user_name || "-"}</strong></div>
                  <div className="session-detail-row"><span>Game</span><strong>{sess.game_name || "-"}</strong></div>
                  <div className="session-detail-row"><span>Station</span><strong>{sess.station_name || "-"}</strong></div>
                  <div className="session-detail-row"><span>Amount</span><strong>₹{Number(sess.amount || 0).toFixed(2)} • {sess.payment_status || "pending"}</strong></div>
                </div>

                <div className="game-session-item-footer">
  <button
    className="view-session-btn"
    onClick={() => getById(sess.id)}
  >
    View Details
  </button>

  {canManage && sess.status === "active" && (
    <button
      className="end-session-btn"
      onClick={() => handleEnd(sess)}
    >
      End Session
    </button>
  )}
</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL MODAL - USES session-modal-overlay */}
      {showDetail && (
        <div className="session-modal-overlay" onClick={() => {setShowDetail(false); setSelected(null);}}>
          <div className="session-modal" onClick={e=>e.stopPropagation()}>
            <div className="session-modal-header">
              <div><h2>Session #{selected?.id}</h2><span>Complete session information</span></div>
              <button className="session-modal-close" onClick={() => {setShowDetail(false); setSelected(null);}}>×</button>
            </div>
            {detailsLoading? (
              <div className="game-session-loading" style={{minHeight:'200px'}}><div className="loading-spinner"></div><p>Loading...</p></div>
            ) : selected? (
              <div className="session-modal-body">
                <div className="session-detail-row"><span>Player</span><strong>{selected.user_name}</strong></div>
                <div className="session-detail-row"><span>Game</span><strong>{selected.game_name}</strong></div>
                <div className="session-detail-row"><span>Station</span><strong>{selected.station_name}</strong></div>
                <div className="session-detail-row"><span>Status</span><span className={`session-modal-status status-${selected.status}`}>{selected.status}</span></div>
                <div className="session-detail-row"><span>Duration</span><strong>{selected.duration_minutes? `${selected.duration_minutes}m` : "-"}</strong></div>
                <div className="session-detail-row"><span>Amount</span><strong>₹{Number(selected.amount || 0).toFixed(2)}</strong></div>
              </div>
            ) : null}
            <div className="session-modal-footer">
              <button className="session-modal-close-btn" onClick={() => {setShowDetail(false); setSelected(null);}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* START MODAL - USES session-modal-overlay */}
      {showStart && (
        <div className="session-modal-overlay" onClick={() => setShowStart(false)}>
          <div className="session-modal" onClick={e=>e.stopPropagation()}>
            <div className="session-modal-header">
              <div><h2>Start Game Session</h2><span>Select booking to start</span></div>
              <button className="session-modal-close" onClick={() => setShowStart(false)}>×</button>
            </div>
            <div className="session-modal-body">
              {bookingsLoading? <div className="booking-loading-message">Loading bookings...</div> :
                bookings.length===0? <div className="empty-game-sessions" style={{padding:'30px'}}><h3>No Bookings</h3><p>No pending bookings available</p></div> : (
                <>
                  <div className="form-group">
                    <label>Select Booking</label>
                    <select value={selectedBookingId} onChange={e=>setSelectedBookingId(e.target.value)}>
                      <option value="">Choose booking</option>
                      {bookings.map(b=><option key={b.id} value={b.id}>#{b.id} - {b.game_name} - {b.user_name}</option>)}
                    </select>
                  </div>
                  {selectedBookingId && (() => { const b = bookings.find(x=>String(x.id)===selectedBookingId); return b? (
                    <div className="selected-booking-details">
                      <div className="session-detail-row"><span>Player</span><strong>{b.user_name}</strong></div>
                      <div className="session-detail-row"><span>Game</span><strong>{b.game_name}</strong></div>
                      <div className="session-detail-row"><span>Station</span><strong>{b.station_name}</strong></div>
                    </div>
                  ) : null; })()}
                </>
              )}
            </div>
            <div className="session-modal-footer">
              <button className="session-modal-close-btn" onClick={() => setShowStart(false)}>Cancel</button>
              <button className="start-session-btn" disabled={!selectedBookingId || starting} onClick={handleStart}>{starting? "Starting..." : "Start Game"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameSession;