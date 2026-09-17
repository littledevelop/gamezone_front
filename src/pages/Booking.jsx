import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import "../styles/Booking.css";
import { isAdminOrStaff } from "../utils/auth";

function Booking() {
  const canManageBooking = isAdminOrStaff();

  const [message, setMessage] = useState("");
  const [bookings, setBookings] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [games, setGames] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    user_id: "",
    membership_id: "",
    game_id: "",
    station_id: "",
    booking_date: "",
    start_time: "",
    end_time: ""
  });

  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
   .toISOString()
   .split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "user_id") {
      setBookingForm((prev) => ({...prev, user_id: value, membership_id: "" }));
    } else {
      setBookingForm((prev) => ({...prev, [name]: value }));
    }
    if (message) setMessage("");
  };

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get("/booking");
      if (res.data.success) setBookings(res.data.bookings || []);
      else setBookings([]);
    } catch {
      setMessage("Unable to connect to server.");
    }
  }, []);

  const fetchMemberships = useCallback(async () => {
    if (!canManageBooking) return;
    try {
      const res = await api.get("/memberships");
      if (res.data.success) setMemberships(res.data.memberships || []);
    } catch {
      /* silent */
    }
  }, [canManageBooking]);

  const fetchGames = useCallback(async () => {
    try {
      const res = await api.get("/games");
      if (res.data.success) setGames(res.data.games || []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchStations = useCallback(async () => {
    if (!canManageBooking) return;
    try {
      const res = await api.get("/gaming-stations");
      if (res.data.success) setStations(res.data.data || res.data.stations || []);
    } catch {
      /* silent */
    }
  }, [canManageBooking]);

  const getBookingById = async (id) => {
    try {
      setSelectedBooking({ id });
      setDetailsLoading(true);
      const res = await api.get(`/booking/${id}`);
      if (res.data.success) setSelectedBooking(res.data.booking);
    } catch {
      setMessage("Failed to load booking details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const createBooking = async (e) => {
    e.preventDefault();

    if (!bookingForm.user_id ||!bookingForm.game_id ||!bookingForm.station_id ||!bookingForm.booking_date ||!bookingForm.start_time ||!bookingForm.end_time) {
      setMessage("Please fill all required fields.");
      return;
    }

    if (bookingForm.end_time <= bookingForm.start_time) {
      setMessage("End time must be greater than start time.");
      return;
    }

    try {
      setCreating(true);
      setMessage("");
      const res = await api.post("/booking", bookingForm);
      if (res.data.success) {
        setMessage("Booking Created Successfully.");
        setBookingForm({
          user_id: "", membership_id: "", game_id: "",
          station_id: "", booking_date: "", start_time: "", end_time: ""
        });
        await fetchBookings();
      } else {
        setMessage(res.data.message || "Unable to create booking.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create booking.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchGames(), fetchMemberships(), fetchStations()]);
      setLoading(false);
    };
    loadData();
  }, [fetchBookings, fetchGames, fetchMemberships, fetchStations]);

  const players = memberships.filter(
    (m, index, self) => index === self.findIndex((item) => item.user_id === m.user_id)
  );

  const playerMemberships = memberships.filter(
    (m) => Number(m.user_id) === Number(bookingForm.user_id) && m.status === "active"
  );

  const availableStations = stations.filter((s) => s.status!== "maintenance");

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-loading">
          <div className="loading-spinner"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-header">
        <div>
          <h1>{canManageBooking? "Bookings" : "My Bookings"}</h1>
          <p>{canManageBooking? "Create and manage GameZone bookings." : "View your GameZone bookings."}</p>
        </div>
      </div>

      {canManageBooking && (
        <div className="booking-card">
          <div className="card-header">
            <div>
              <h2>Create Booking</h2>
              <p>Create a new gaming session booking for a player.</p>
            </div>
          </div>

          <form onSubmit={createBooking} className="booking-form" noValidate>
            <div className="form-group">
              <label>Player</label>
              <select name="user_id" value={bookingForm.user_id} onChange={handleChange} required>
                <option value="">Select Player</option>
                {players.length > 0? players.map((p) => (
                  <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
                )) : <option value="1">GameZone Admin (Fallback)</option>}
              </select>
            </div>

            <div className="form-group">
              <label>Membership</label>
              <select name="membership_id" value={bookingForm.membership_id} onChange={handleChange} disabled={!bookingForm.user_id}>
                <option value="">Select Membership</option>
                {playerMemberships.map((m) => (
                  <option key={m.id} value={m.id}>{m.membership_type_name} - ₹{m.price}</option>
                ))}
              </select>
              {!bookingForm.user_id && <small>Please select a player first.</small>}
              {bookingForm.user_id && playerMemberships.length === 0 && <small className="warning-text">No active membership found.</small>}
            </div>

            <div className="form-group">
              <label>Game</label>
              <select name="game_id" value={bookingForm.game_id} onChange={handleChange} required>
                <option value="">Select Game</option>
                {games.map((g) => <option key={g.id} value={g.id}>{g.game_name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Gaming Station</label>
              <select name="station_id" value={bookingForm.station_id} onChange={handleChange} required>
                <option value="">Select Station</option>
                {availableStations.map((s) => <option key={s.id} value={s.id}>{s.station_name} - {s.status}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Booking Date</label>
              <input type="date" name="booking_date" value={bookingForm.booking_date} onChange={handleChange} min={localToday} required />
            </div>

            <div className="form-group">
              <label>Start Time</label>
              <input type="time" name="start_time" value={bookingForm.start_time} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input type="time" name="end_time" value={bookingForm.end_time} onChange={handleChange} required />
            </div>

            {message && <div className="booking-message">{message}</div>}

            <div className="form-actions">
              <button type="submit" className="create-booking-btn" disabled={creating}>
                {creating? "Creating..." : "Create Booking"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="booking-list-section">
        <div className="section-header">
          <h2>{canManageBooking? "All Bookings" : "My Bookings"}</h2>
          <span>{bookings.length}</span>
        </div>

        {bookings.length === 0? (
          <div className="empty-bookings">
            <div className="empty-icon">🎮</div>
            <h3>{canManageBooking? "No Bookings Found" : "You Have No Bookings"}</h3>
            <p>{canManageBooking? "Create your first booking using the form above." : "Your bookings will appear here once created."}</p>
          </div>
        ) : (
          <div className="booking-grid">
            {bookings.map((booking) => (
              <div className="booking-item" key={booking.id}>
                <div className="booking-item-header">
                  <span className="booking-number">Booking #{booking.id}</span>
                  <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
                </div>
                <h3 style={{fontSize:'14px',fontWeight:700,marginBottom:'12px'}}>{booking.game_name}</h3>
                <div className="booking-details">
                  <div className="detail-row"><span>Player</span><strong>{booking.user_name}</strong></div>
                  <div className="detail-row"><span>Station</span><strong>{booking.station_name}</strong></div>
                  <div className="detail-row"><span>Date</span><strong>{booking.booking_date? new Date(booking.booking_date).toLocaleDateString('en-IN') : "-"}</strong></div>
                  <div className="detail-row"><span>Time</span><strong>{booking.start_time} - {booking.end_time}</strong></div>
                </div>
                <div className="booking-item-footer">
                  <button className="view-details-btn" onClick={() => getBookingById(booking.id)}>View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close-btn" onClick={() => setSelectedBooking(null)}>×</button>
            </div>
            {detailsLoading? (
              <div className="booking-loading" style={{minHeight:'200px'}}>
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            ) : (
              <div className="booking-modal-body">
                <div className="modal-detail-row"><span>Booking ID</span><strong>#{selectedBooking.id}</strong></div>
                <div className="modal-detail-row"><span>Player</span><strong>{selectedBooking.user_name || selectedBooking.full_name || "-"}</strong></div>
                <div className="modal-detail-row"><span>Game</span><strong>{selectedBooking.game_name || "-"}</strong></div>
                <div className="modal-detail-row"><span>Station</span><strong>{selectedBooking.station_name || "-"}</strong></div>
                <div className="modal-detail-row"><span>Date</span><strong>{selectedBooking.booking_date? new Date(selectedBooking.booking_date).toLocaleDateString('en-IN') : "-"}</strong></div>
                <div className="modal-detail-row"><span>Time</span><strong>{selectedBooking.start_time} - {selectedBooking.end_time}</strong></div>
                <div className="modal-detail-row"><span>Status</span><span className={`status-badge status-${selectedBooking.status}`}>{selectedBooking.status}</span></div>
              </div>
            )}
            <div className="booking-modal-footer">
              <button className="modal-close-button" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Booking;