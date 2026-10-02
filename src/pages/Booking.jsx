import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import "../styles/Booking.css";
import { isAdminOrStaff } from "../utils/auth";
import {
  BadgePlus,
  Check,
  X,
  Pencil,
} from "lucide-react";

function Booking() {
  // ==================================================
  // USER / ROLE
  // ==================================================

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const role = user?.role_name || "Player";
  const userId = user?.id;

  const canManageBooking = isAdminOrStaff();
  const isPlayer = role === "Player";

  // ==================================================
  // STATE
  // ==================================================

  const [message, setMessage] = useState("");
  const [bookingMessage, setBookingMessage] =
    useState("");

  const [bookings, setBookings] = useState([]);
  const [memberships, setMemberships] =
    useState([]);
  const [games, setGames] = useState([]);
  const [stations, setStations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [updatingStatus, setUpdatingStatus] =
    useState(null);

  const [editingBooking, setEditingBooking] =
    useState(null);

  const [bookingForm, setBookingForm] = useState({
    user_id:
      isPlayer && userId
        ? String(userId)
        : "",
    membership_id: "",
    game_id: "",
    station_id: "",
    booking_date: "",
    start_time: "",
    end_time: "",
  });

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [membershipTypeName, setMembershipTypeName] =
    useState("");

  // ==================================================
  // CREATE FORM PERMISSION
  // ==================================================
  //
  // IMPORTANT:
  // Player can open Create Booking form from
  // "My Bookings" when showCreateForm is true.
  //
  // Directly opening My Bookings keeps the form
  // hidden because showCreateForm is false.
  // ==================================================

  const canCreateBooking =
    canManageBooking ||
    (isPlayer && showCreateForm);

  // ==================================================
  // TODAY
  // ==================================================

  const today = new Date();

  const localToday = new Date(
    today.getTime() -
      today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  // ==================================================
  // BOOKING / PAYMENT HELPERS
  // ==================================================

  const formatAmount = (amount) => {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "₹0.00";
    }

    return `₹${value.toFixed(2)}`;
  };

  const getPaymentStatusLabel = (status) => {
    if (status === "paid") {
      return "Paid";
    }

    if (status === "refunded") {
      return "Refunded";
    }

    return "Payment Pending";
  };

  // ==================================================
  // HANDLE FORM CHANGE
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "user_id") {
      setBookingForm((prev) => ({
        ...prev,
        user_id: value,
        membership_id: "",
      }));
    } else {
      setBookingForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (message) {
      setMessage("");
    }

    if (bookingMessage) {
      setBookingMessage("");
    }
  };

  // ==================================================
  // RESET FORM
  // ==================================================

  const resetForm = () => {
    setBookingForm({
      user_id:
        isPlayer && userId
          ? String(userId)
          : "",
      membership_id: "",
      game_id: "",
      station_id: "",
      booking_date: "",
      start_time: "",
      end_time: "",
    });

    setEditingBooking(null);

    // Player closes the form after successful
    // create/update/cancel edit.
    if (isPlayer) {
      setShowCreateForm(false);
    }
  };

  // ==================================================
  // FETCH BOOKINGS
  // ==================================================

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get("/booking");

      if (!res.data.success) {
        setBookings([]);
        return;
      }

      const allBookings =
        res.data.bookings || [];

      if (isPlayer) {
        const myBookings =
          allBookings.filter(
            (booking) =>
              Number(booking.user_id) ===
              Number(userId)
          );

        setBookings(myBookings);
      } else {
        setBookings(allBookings);
      }
    } catch (error) {
      console.error(
        "Fetch bookings error:",
        error
      );

      setMessage(
        "Unable to connect to server."
      );
    }
  }, [isPlayer, userId]);

  // ==================================================
  // FETCH MEMBERSHIPS
  // ==================================================

  const fetchMemberships = useCallback(
    async () => {
      if (!canManageBooking) return;

      try {
        const res = await api.get(
          "/memberships"
        );

        if (res.data.success) {
          setMemberships(
            res.data.memberships || []
          );
        }
      } catch (error) {
        console.error(
          "Fetch memberships error:",
          error
        );
      }
    },
    [canManageBooking]
  );

  // ==================================================
  // FETCH PLAYER MEMBERSHIP
  // ==================================================

  const fetchMyMembership = useCallback(
    async () => {
      if (!isPlayer) return;

      try {
        const res = await api.get(
          "/memberships/my-membership"
        );

        if (
          res.data.success &&
          res.data.membership
        ) {
          const membership =
            res.data.membership;

          setBookingForm((prev) => ({
            ...prev,
            membership_id: membership.id
              ? String(membership.id)
              : "",
          }));

          setMembershipTypeName(
            membership.membership_type_name ||
              membership.membership_type ||
              membership.type_name ||
              "Active Membership"
          );
        } else {
          setMembershipTypeName("");
        }
      } catch (error) {
        console.error(
          "Fetch my membership error:",
          error
        );

        setMembershipTypeName("");
      }
    },
    [isPlayer]
  );

  // ==================================================
  // FETCH GAMES
  // ==================================================

  const fetchGames = useCallback(async () => {
    try {
      const res = await api.get("/games");

      if (res.data.success) {
        setGames(res.data.games || []);
      }
    } catch (error) {
      console.error(
        "Fetch games error:",
        error
      );
    }
  }, []);

  // ==================================================
  // FETCH GAMING STATIONS
  // ==================================================

  const fetchStations = useCallback(
    async () => {
      try {
        const res = await api.get(
          "/gaming-stations"
        );

        if (res.data.success) {
          setStations(
            res.data.data ||
              res.data.stations ||
              []
          );
        }
      } catch (error) {
        console.error(
          "Fetch stations error:",
          error
        );
      }
    },
    []
  );

  // ==================================================
  // LOAD GAME SELECTED FROM GAMES PAGE
  // ==================================================

  const loadSelectedGame = useCallback(() => {
    const shouldOpenCreate =
      sessionStorage.getItem(
        "openCreateBooking"
      ) === "true";

    if (shouldOpenCreate) {
      if (isPlayer) {
        setShowCreateForm(true);
      }

      sessionStorage.removeItem(
        "openCreateBooking"
      );
    }

    const savedGame =
      sessionStorage.getItem(
        "selectedGameForBooking"
      );

    if (!savedGame) return;

    try {
      const game = JSON.parse(savedGame);

      if (game?.id) {
        setBookingForm((prev) => ({
          ...prev,
          game_id: String(game.id),
        }));
      }

      sessionStorage.removeItem(
        "selectedGameForBooking"
      );
    } catch (error) {
      console.error(
        "Selected game parsing error:",
        error
      );

      sessionStorage.removeItem(
        "selectedGameForBooking"
      );
    }
  }, [isPlayer]);

  // ==================================================
  // GET BOOKING DETAILS
  // ==================================================

  const getBookingById = async (id) => {
    try {
      setSelectedBooking({ id });
      setDetailsLoading(true);
      setBookingMessage("");

      const res = await api.get(
        `/booking/${id}`
      );

      if (res.data.success) {
        setSelectedBooking(
          res.data.booking
        );
      } else {
        setMessage(
          res.data.message ||
            "Failed to load booking details."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to load booking details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ==================================================
  // PAY NOW
  // ==================================================

  const handlePayNow = async (booking) => {
    if (!booking?.id) return;

    if (booking.payment_status === "paid") {
      setBookingMessage(
        "Payment has already been completed."
      );
      return;
    }

    if (
      booking.status === "cancelled" ||
      booking.status === "completed"
    ) {
      setBookingMessage(
        "Payment is not available for this booking."
      );
      return;
    }

    const confirmed = window.confirm(
      `Pay ${formatAmount(
        booking.amount
      )} for Booking #${booking.id}?`
    );

    if (!confirmed) return;

    try {
      setBookingMessage("");
      setUpdatingStatus(booking.id);

      const res = await api.post(
        "/payments",
        {
          booking_id: booking.id,
        }
      );

      if (res.data.success) {
        setBookingMessage(
          "Payment completed successfully. Your booking is confirmed."
        );

        await fetchBookings();

        if (
          selectedBooking?.id === booking.id
        ) {
          const detailRes =
            await api.get(
              `/booking/${booking.id}`
            );

          if (detailRes.data.success) {
            setSelectedBooking(
              detailRes.data.booking
            );
          }
        }
      } else {
        setBookingMessage(
          res.data.message ||
            "Payment failed."
        );
      }
    } catch (error) {
      setBookingMessage(
        error.response?.data?.message ||
          "Unable to process payment."
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ==================================================
  // UPDATE BOOKING STATUS
  // ==================================================

  const updateBookingStatus = async (
    id,
    status
  ) => {
    try {
      setUpdatingStatus(id);
      setBookingMessage("");

      const res = await api.put(
        `/booking/${id}/status`,
        { status }
      );

      if (res.data.success) {
        setBookingMessage(
          status === "confirmed"
            ? "Booking confirmed successfully."
            : "Booking cancelled successfully."
        );

        await fetchBookings();

        if (selectedBooking?.id === id) {
          const detailRes =
            await api.get(
              `/booking/${id}`
            );

          if (detailRes.data.success) {
            setSelectedBooking(
              detailRes.data.booking
            );
          }
        }
      } else {
        setBookingMessage(
          res.data.message ||
            "Unable to update booking status."
        );
      }
    } catch (error) {
      setBookingMessage(
        error.response?.data?.message ||
          "Unable to update booking status."
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ==================================================
  // CONFIRM BOOKING
  // ==================================================

  const handleConfirmBooking = (booking) => {
    if (!booking?.id) return;

    if (booking.payment_status !== "paid") {
      setBookingMessage(
        "Please complete the payment before confirming this booking."
      );

      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to confirm this booking?"
    );

    if (!confirmed) return;

    updateBookingStatus(
      booking.id,
      "confirmed"
    );
  };

  // ==================================================
  // CANCEL BOOKING
  // ==================================================

  const handleCancelBooking = (booking) => {
    if (!booking?.id) return;

    if (
      booking.status === "cancelled" ||
      booking.status === "completed"
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    updateBookingStatus(
      booking.id,
      "cancelled"
    );
  };

  // ==================================================
  // VALIDATE FORM
  // ==================================================

  const validateBookingForm = () => {
    if (
      !bookingForm.user_id ||
      !bookingForm.game_id ||
      !bookingForm.station_id ||
      !bookingForm.booking_date ||
      !bookingForm.start_time ||
      !bookingForm.end_time
    ) {
      setMessage(
        "Please fill all required fields."
      );

      return false;
    }

    if (
      bookingForm.end_time <=
      bookingForm.start_time
    ) {
      setMessage(
        "End time must be greater than start time."
      );

      return false;
    }

    if (
      bookingForm.booking_date <
      localToday
    ) {
      setMessage(
        "Booking date cannot be in the past."
      );

      return false;
    }

    return true;
  };

  // ==================================================
  // CREATE BOOKING
  // ==================================================

  const createBooking = async (e) => {
    e.preventDefault();

    if (!validateBookingForm()) return;

    try {
      setCreating(true);
      setMessage("");
      setBookingMessage("");

      const res = await api.post(
        "/booking",
        bookingForm
      );

      if (res.data.success) {
        setMessage(
          "Booking created successfully. Payment is pending."
        );

        resetForm();

        await fetchBookings();
      } else {
        setMessage(
          res.data.message ||
            "Unable to create booking."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create booking."
      );
    } finally {
      setCreating(false);
    }
  };

  // ==================================================
  // EDIT BOOKING
  // ==================================================

  const editBooking = async (e) => {
    e.preventDefault();

    if (!validateBookingForm()) return;

    if (!editingBooking?.id) {
      setMessage(
        "Unable to identify booking for update."
      );

      return;
    }

    try {
      setCreating(true);
      setMessage("");
      setBookingMessage("");

      const res = await api.put(
        `/booking/${editingBooking.id}`,
        bookingForm
      );

      if (res.data.success) {
        setMessage(
          "Booking updated successfully."
        );

        resetForm();

        await fetchBookings();
      } else {
        setMessage(
          res.data.message ||
            "Unable to update booking."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to update booking."
      );
    } finally {
      setCreating(false);
    }
  };

  // ==================================================
  // EDIT BOOKING - LOAD DETAILS
  // ==================================================

  const handleEditBooking = async (
    booking
  ) => {
    try {
      setMessage("");
      setBookingMessage("");

      const res = await api.get(
        `/booking/${booking.id}`
      );

      if (res.data.success) {
        const data = res.data.booking;

        setEditingBooking(data);

        setBookingForm({
          user_id: data.user_id
            ? String(data.user_id)
            : "",

          membership_id:
            data.membership_id
              ? String(data.membership_id)
              : "",

          game_id: data.game_id
            ? String(data.game_id)
            : "",

          station_id: data.station_id
            ? String(data.station_id)
            : "",

          booking_date:
            data.booking_date
              ? data.booking_date.split(
                  "T"
                )[0]
              : "",

          start_time:
            data.start_time || "",

          end_time:
            data.end_time || "",
        });

        setShowCreateForm(true);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        setMessage(
          res.data.message ||
            "Failed to load booking for editing."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to load booking for editing."
      );
    }
  };

  // ==================================================
  // INITIAL DATA
  // ==================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchBookings(),
        fetchGames(),
        fetchMemberships(),
        fetchMyMembership(),
        fetchStations(),
      ]);

      // Check whether user came from Games -> Book Now
      loadSelectedGame();

      setLoading(false);
    };

    loadData();
  }, [
    fetchBookings,
    fetchGames,
    fetchMemberships,
    fetchMyMembership,
    fetchStations,
    loadSelectedGame,
  ]);

  // ==================================================
  // PLAYERS
  // ==================================================

  const players = memberships.filter(
    (m, index, self) =>
      index ===
      self.findIndex(
        (item) =>
          Number(item.user_id) ===
          Number(m.user_id)
      )
  );

  // ==================================================
  // SELECTED PLAYER MEMBERSHIPS
  // ==================================================

  const playerMemberships =
    memberships.filter(
      (m) =>
        Number(m.user_id) ===
          Number(bookingForm.user_id) &&
        m.status === "active"
    );

  // ==================================================
  // AVAILABLE STATIONS
  // ==================================================

  const availableStations =
    stations.filter(
      (s) =>
        s.status !== "maintenance"
    );

  // ==================================================
  // LOADING
  // ==================================================

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

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="booking-page">
      {/* PAGE HEADER */}
      <div className="booking-header">
        <div>
          <h1>
            {canManageBooking
              ? "Bookings"
              : "My Bookings"}
          </h1>

          <p>
            {canManageBooking
              ? "Create and manage GameZone bookings."
              : "Book games and manage your bookings."}
          </p>
        </div>
      </div>

      {/* CREATE / EDIT BOOKING */}
      {canCreateBooking && (
        <div className="booking-card">
          <div className="card-header">
            <div>
              <h2>
                {editingBooking
                  ? "Edit Booking"
                  : "Create Booking"}
              </h2>

              <p>
                {editingBooking
                  ? "Update the booking details."
                  : isPlayer
                    ? "Book a game and select your preferred gaming station."
                    : "Create a new gaming session booking for a player."}
              </p>
            </div>
          </div>

          <form
            onSubmit={
              editingBooking
                ? editBooking
                : createBooking
            }
            className="booking-form"
            noValidate
          >
            {/* PLAYER */}
            {canManageBooking ? (
              <div className="form-group">
                <label>Player</label>

                <select
                  name="user_id"
                  value={
                    bookingForm.user_id
                  }
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Player
                  </option>

                  {players.length > 0 ? (
                    players.map((p) => (
                      <option
                        key={p.user_id}
                        value={p.user_id}
                      >
                        {p.full_name}
                      </option>
                    ))
                  ) : (
                    <option value="1">
                      GameZone Admin
                    </option>
                  )}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label>Player</label>

                <input
                  type="text"
                  value={
                    user?.full_name ||
                    user?.name ||
                    "My Account"
                  }
                  disabled
                />
              </div>
            )}

            {/* MEMBERSHIP */}
            <div className="form-group">
              <label>Membership</label>

              {canManageBooking ? (
                <>
                  <select
                    name="membership_id"
                    value={
                      bookingForm.membership_id
                    }
                    onChange={handleChange}
                    disabled={
                      !bookingForm.user_id
                    }
                  >
                    <option value="">
                      Select Membership
                    </option>

                    {playerMemberships.map(
                      (m) => (
                        <option
                          key={m.id}
                          value={m.id}
                        >
                          {
                            m.membership_type_name
                          }

                          {m.price
                            ? ` - ₹${m.price}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>

                  {!bookingForm.user_id && (
                    <small>
                      Please select a player
                      first.
                    </small>
                  )}

                  {bookingForm.user_id &&
                    playerMemberships.length ===
                      0 && (
                      <small className="warning-text">
                        No active membership
                        found.
                      </small>
                    )}
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={
                      bookingForm.membership_id
                        ? `${membershipTypeName} - Active`
                        : "No Active Membership"
                    }
                    disabled
                  />

                  {!bookingForm.membership_id && (
                    <small className="warning-text">
                      You need an active
                      membership to use
                      membership benefits.
                    </small>
                  )}
                </>
              )}
            </div>

            {/* GAME */}
            <div className="form-group">
              <label>Game</label>

              <select
                name="game_id"
                value={bookingForm.game_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Game
                </option>

                {games.map((g) => (
                  <option
                    key={g.id}
                    value={g.id}
                    disabled={
                      g.status !== "active"
                    }
                  >
                    {g.game_name}

                    {g.status !== "active"
                      ? " (Inactive)"
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* GAMING STATION */}
            <div className="form-group">
              <label>Gaming Station</label>

              <select
                name="station_id"
                value={
                  bookingForm.station_id
                }
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Station
                </option>

                {availableStations.map(
                  (s) => (
                    <option
                      key={s.id}
                      value={s.id}
                    >
                      {s.station_name} -{" "}
                      {s.status}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* BOOKING DATE */}
            <div className="form-group">
              <label>Booking Date</label>

              <input
                type="date"
                name="booking_date"
                value={
                  bookingForm.booking_date
                }
                onChange={handleChange}
                min={localToday}
                required
              />
            </div>

            {/* START TIME */}
            <div className="form-group">
              <label>Start Time</label>

              <input
                type="time"
                name="start_time"
                value={
                  bookingForm.start_time
                }
                onChange={handleChange}
                required
              />
            </div>

            {/* END TIME */}
            <div className="form-group">
              <label>End Time</label>

              <input
                type="time"
                name="end_time"
                value={
                  bookingForm.end_time
                }
                onChange={handleChange}
                required
              />
            </div>

            {/* MESSAGE */}
            {message && (
              <div className="booking-message">
                {message}
              </div>
            )}

            {/* FORM ACTIONS */}
            <div className="form-actions">
              {editingBooking && (
                <button
                  type="button"
                  className="modal-close-button"
                  onClick={() => {
                    resetForm();
                    setMessage("");
                  }}
                >
                  Cancel Edit
                </button>
              )}

              <button
                type="submit"
                className="create-booking-btn"
                disabled={creating}
              >
                {editingBooking ? (
                  <Pencil size={16} />
                ) : (
                  <BadgePlus size={16} />
                )}

                {creating
                  ? editingBooking
                    ? "Updating..."
                    : "Creating..."
                  : editingBooking
                    ? "Update Booking"
                    : "Create Booking"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STATUS MESSAGE */}
      {bookingMessage && (
        <div className="booking-message">
          {bookingMessage}
        </div>
      )}

      {/* BOOKING LIST */}
      <div className="booking-list-section">
        <div className="section-header">
          <div>
            <h2>
              {canManageBooking
                ? "All Bookings"
                : "My Bookings"}
            </h2>
          </div>

          <span>{bookings.length}</span>
        </div>

        {/* EMPTY */}
        {bookings.length === 0 ? (
          <div className="empty-bookings">
            <div className="empty-icon">
              🎮
            </div>

            <h3>
              {canManageBooking
                ? "No Bookings Found"
                : "You Have No Bookings"}
            </h3>

            <p>
              {canManageBooking
                ? "Create your first booking using the form above."
                : "Choose a game from the Games page to create your first booking."}
            </p>
          </div>
        ) : (
          <div className="booking-grid">
            {bookings.map((booking) => (
              <div
                className="booking-item"
                key={booking.id}
              >
                {/* BOOKING HEADER */}
                <div className="booking-item-header">
                  <span className="booking-number">
                    Booking #{booking.id}
                  </span>

                  <span
                    className={`status-badge status-${booking.status}`}
                  >
                    {booking.status}
                  </span>
                </div>

                {/* GAME */}
                <h3>
                  {booking.game_name}
                </h3>

                {/* DETAILS */}
                <div className="booking-details">
                  <div className="detail-row">
                    <span>Player</span>

                    <strong>
                      {booking.user_name ||
                        booking.full_name ||
                        "-"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Station</span>

                    <strong>
                      {booking.station_name ||
                        "-"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Date</span>

                    <strong>
                      {booking.booking_date
                        ? new Date(
                            booking.booking_date
                          ).toLocaleDateString(
                            "en-IN"
                          )
                        : "-"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Time</span>

                    <strong>
                      {booking.start_time ||
                        "-"}{" "}
                      -{" "}
                      {booking.end_time ||
                        "-"}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Amount</span>

                    <strong>
                      {formatAmount(
                        booking.amount
                      )}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Payment</span>

                    <strong
                      className={`payment-status-text payment-${booking.payment_status}`}
                    >
                      {getPaymentStatusLabel(
                        booking.payment_status
                      )}
                    </strong>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="booking-item-footer">
                  {/* PLAYER PAY NOW */}
                  {isPlayer &&
                    booking.status !==
                      "cancelled" &&
                    booking.status !==
                      "completed" &&
                    booking.payment_status !==
                      "paid" && (
                      <button
                        type="button"
                        className="pay-now-btn"
                        onClick={() =>
                          handlePayNow(
                            booking
                          )
                        }
                        disabled={
                          updatingStatus ===
                          booking.id
                        }
                      >
                        {updatingStatus ===
                        booking.id
                          ? "Processing..."
                          : "Pay Now"}
                      </button>
                    )}

                  {/* VIEW */}
                  <button
                    type="button"
                    className="view-details-btn"
                    onClick={() =>
                      getBookingById(
                        booking.id
                      )
                    }
                  >
                    View Details
                  </button>

                  {/* MANAGEMENT ACTIONS */}
                  {(canManageBooking ||
                    isPlayer) && (
                    <div className="booking-actions">
                      {/* ADMIN / STAFF EDIT */}
                      {canManageBooking &&
                        booking.status !==
                          "cancelled" &&
                        booking.status !==
                          "completed" && (
                          <button
                            type="button"
                            className="edit-booking-btn icon-action-btn"
                            onClick={() =>
                              handleEditBooking(
                                booking
                              )
                            }
                            title="Edit Booking"
                            aria-label="Edit Booking"
                          >
                            <Pencil size={15} />
                          </button>
                        )}

                      {/* CANCEL */}
                      {(canManageBooking ||
                        isPlayer) &&
                        booking.status !==
                          "cancelled" &&
                        booking.status !==
                          "completed" && (
                          <button
                            type="button"
                            className="cancel-booking-btn icon-action-btn"
                            onClick={() =>
                              handleCancelBooking(
                                booking
                              )
                            }
                            disabled={
                              updatingStatus ===
                              booking.id
                            }
                            title="Cancel Booking"
                            aria-label="Cancel Booking"
                          >
                            <X size={15} />
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOOKING DETAILS MODAL */}
      {selectedBooking && (
        <div
          className="booking-modal-overlay"
          onClick={() =>
            setSelectedBooking(null)
          }
        >
          <div
            className="booking-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* MODAL HEADER */}
            <div className="booking-modal-header">
              <h2>Booking Details</h2>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() =>
                  setSelectedBooking(null)
                }
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}
            {detailsLoading ? (
              <div
                className="booking-loading"
                style={{
                  minHeight: "200px",
                }}
              >
                <div className="loading-spinner"></div>

                <p>Loading...</p>
              </div>
            ) : (
              <div className="booking-modal-body">
                <div className="modal-detail-row">
                  <span>Booking ID</span>

                  <strong>
                    #{selectedBooking.id}
                  </strong>
                </div>

                <div className="modal-detail-row">
                  <span>Player</span>

                  <strong>
                    {selectedBooking.user_name ||
                      selectedBooking.full_name ||
                      "-"}
                  </strong>
                </div>

                <div className="modal-detail-row">
                  <span>Game</span>

                  <strong>
                    {selectedBooking.game_name ||
                      "-"}
                  </strong>
                </div>

                <div className="modal-detail-row">
                  <span>Station</span>

                  <strong>
                    {selectedBooking.station_name ||
                      "-"}
                  </strong>
                </div>

                <div className="modal-detail-row">
                  <span>Date</span>

                  <strong>
                    {selectedBooking.booking_date
                      ? new Date(
                          selectedBooking.booking_date
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "-"}
                  </strong>
                </div>

                <div className="modal-detail-row">
                  <span>Time</span>

                  <strong>
                    {selectedBooking.start_time ||
                      "-"}{" "}
                    -{" "}
                    {selectedBooking.end_time ||
                      "-"}
                  </strong>
                </div>

                <div className="modal-detail-row">
                  <span>Status</span>

                  <span
                    className={`status-badge status-${selectedBooking.status}`}
                  >
                    {selectedBooking.status}
                  </span>
                </div>

                <div className="modal-detail-row">
                  <span>Amount</span>

                  <strong>
                    {formatAmount(
                      selectedBooking.amount
                    )}
                  </strong>
                </div>

                <div className="modal-detail-row">
                  <span>Payment</span>

                  <span
                    className={`payment-status-badge payment-${selectedBooking.payment_status}`}
                  >
                    {getPaymentStatusLabel(
                      selectedBooking.payment_status
                    )}
                  </span>
                </div>

                {/* PAYMENT INFORMATION */}
                {selectedBooking.status ===
                  "pending" &&
                  selectedBooking.payment_status !==
                    "paid" && (
                    <div className="booking-payment-notice">
                      <p>
                        Payment is pending. Complete
                        your payment to confirm this
                        booking.
                      </p>

                      {isPlayer &&
                        Number(
                          selectedBooking.user_id
                        ) === Number(userId) && (
                          <button
                            type="button"
                            className="pay-now-btn"
                            onClick={() =>
                              handlePayNow(
                                selectedBooking
                              )
                            }
                            disabled={
                              updatingStatus ===
                              selectedBooking.id
                            }
                          >
                            {updatingStatus ===
                            selectedBooking.id
                              ? "Processing..."
                              : `Pay Now ${formatAmount(
                                  selectedBooking.amount
                                )}`}
                          </button>
                        )}
                    </div>
                  )}

                {/* PAYMENT SUCCESS */}
                {selectedBooking.payment_status ===
                  "paid" &&
                  selectedBooking.status ===
                    "confirmed" && (
                    <div className="booking-payment-success">
                      Payment completed. Your booking
                      is confirmed.
                    </div>
                  )}
              </div>
            )}

            {/* MODAL FOOTER */}
            <div className="booking-modal-footer">
              {/* ADMIN / STAFF PENDING ACTIONS */}
              {!detailsLoading &&
                canManageBooking &&
                selectedBooking.status ===
                  "pending" && (
                  <>
                    <button
                      type="button"
                      className="confirm-booking-btn"
                      onClick={() =>
                        handleConfirmBooking(
                          selectedBooking
                        )
                      }
                      disabled={
                        updatingStatus ===
                          selectedBooking.id ||
                        selectedBooking.payment_status !==
                          "paid"
                      }
                      title={
                        selectedBooking.payment_status !==
                        "paid"
                          ? "Complete payment before confirming the booking"
                          : "Confirm Booking"
                      }
                    >
                      <Check size={14} />

                      {updatingStatus ===
                      selectedBooking.id
                        ? "Updating..."
                        : "Confirm Booking"}
                    </button>

                    <button
                      type="button"
                      className="cancel-booking-btn"
                      onClick={() =>
                        handleCancelBooking(
                          selectedBooking
                        )
                      }
                      disabled={
                        updatingStatus ===
                        selectedBooking.id
                      }
                    >
                      <X size={14} />

                      Cancel Booking
                    </button>
                  </>
                )}

              {/* PLAYER PENDING / CONFIRMED CANCEL */}
              {!detailsLoading &&
                isPlayer &&
                Number(
                  selectedBooking.user_id
                ) === Number(userId) &&
                selectedBooking.status !==
                  "cancelled" &&
                selectedBooking.status !==
                  "completed" && (
                  <button
                    type="button"
                    className="cancel-booking-btn"
                    onClick={() =>
                      handleCancelBooking(
                        selectedBooking
                      )
                    }
                    disabled={
                      updatingStatus ===
                      selectedBooking.id
                    }
                  >
                    <X size={14} />

                    Cancel Booking
                  </button>
                )}

              {/* ADMIN / STAFF CONFIRMED CANCEL */}
              {!detailsLoading &&
                canManageBooking &&
                selectedBooking.status ===
                  "confirmed" && (
                  <button
                    type="button"
                    className="cancel-booking-btn"
                    onClick={() =>
                      handleCancelBooking(
                        selectedBooking
                      )
                    }
                    disabled={
                      updatingStatus ===
                      selectedBooking.id
                    }
                  >
                    <X size={14} />

                    Cancel Booking
                  </button>
                )}

              {/* CLOSE */}
              <button
                type="button"
                className="modal-close-button"
                onClick={() =>
                  setSelectedBooking(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Booking;