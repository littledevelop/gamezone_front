import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Download,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import api from "../api/axios";
import "../styles/Payments.css";

function Payments() {
  // ==================================================
  // USER / ROLE
  // ==================================================

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const role = user?.role_name || user?.role || "";
  const isPlayer = role === "Player";
  const currentUserId = user?.id;

  // ==================================================
  // STATE
  // ==================================================

  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin / Staff form data
  const [players, setPlayers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [memberships, setMemberships] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    user_id: "",
    booking_id: "",
    membership_id: "",
    amount: "",
    payment_method: "cash",
    transaction_id: "",
    payment_status: "pending",
    notes: "",
  });

  // ==================================================
  // FETCH PAYMENTS
  // ==================================================

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get("/payments");

      let allPayments = [];

      if (res.data.success) {
        allPayments =
          res.data.data ||
          res.data.payments ||
          [];
      } else if (Array.isArray(res.data)) {
        allPayments = res.data;
      }

      // Player sees only their own payments
      const visiblePayments = isPlayer
        ? allPayments.filter(
            (payment) =>
              Number(payment.user_id) ===
              Number(currentUserId)
          )
        : allPayments;

      setPayments(visiblePayments);
    } catch (error) {
      console.error(
        "Fetch Payments Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Unable to connect"
      );
    } finally {
      setLoading(false);
    }
  }, [isPlayer, currentUserId]);

  // ==================================================
  // FETCH ADMIN / STAFF FORM DATA
  // ==================================================

  const fetchFormData = useCallback(async () => {
    // Player does not need payment form data
    if (isPlayer) return;

    try {
      const [
        playersRes,
        bookingsRes,
        membershipsRes,
      ] = await Promise.all([
        api.get("/users/players"),
        api.get("/booking"),
        api.get("/memberships"),
      ]);

      if (playersRes.data.success) {
        setPlayers(
          playersRes.data.data ||
            playersRes.data.players ||
            []
        );
      }

      if (bookingsRes.data.success) {
        setBookings(
          bookingsRes.data.bookings || []
        );
      }

      if (membershipsRes.data.success) {
        setMemberships(
          membershipsRes.data.data ||
            membershipsRes.data.memberships ||
            []
        );
      }
    } catch (error) {
      console.error(
        "Payment form data error:",
        error
      );
    }
  }, [isPlayer]);

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!mounted) return;

      await Promise.all([
        fetchPayments(),
        fetchFormData(),
      ]);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [fetchPayments, fetchFormData]);

  // ==================================================
  // FILTER PAYMENTS
  // ==================================================

  const filtered = payments.filter((payment) => {
    const search =
      (payment.user_name || "")
        .toLowerCase()
        .includes(filter.toLowerCase()) ||
      String(payment.id).includes(filter) ||
      (payment.transaction_id || "")
        .toLowerCase()
        .includes(filter.toLowerCase());

    const status = (
      payment.payment_status || ""
    ).toLowerCase();

    const matchStatus =
      statusFilter === "all" ||
      status === statusFilter;

    return search && matchStatus;
  });

  // ==================================================
  // PAYMENT STATISTICS
  // ==================================================

  const completedStatuses = [
    "completed",
    "success",
    "paid",
  ];

  const totalRevenue = payments
    .filter((payment) =>
      completedStatuses.includes(
        (payment.payment_status || "").toLowerCase()
      )
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  const completed = payments.filter((payment) =>
    completedStatuses.includes(
      (payment.payment_status || "").toLowerCase()
    )
  ).length;

  const pending =
    payments.length - completed;

  const today = new Date();

  const todayStr =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  const todayRevenue = payments
    .filter(
      (payment) =>
        (payment.payment_date || "").startsWith(
          todayStr
        ) &&
        completedStatuses.includes(
          (payment.payment_status || "").toLowerCase()
        )
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  // ==================================================
  // CREATE PAYMENT
  // ==================================================

  const openCreateModal = () => {
    setEditingPayment(null);

    setFormData({
      user_id: "",
      booking_id: "",
      membership_id: "",
      amount: "",
      payment_method: "cash",
      transaction_id: "",
      payment_status: "pending",
      notes: "",
    });

    setMessage("");
    setShowModal(true);
  };

  // ==================================================
  // EDIT PAYMENT
  // ==================================================

  const openEditModal = (payment) => {
    setEditingPayment(payment);

    setFormData({
      user_id: payment.user_id || "",
      booking_id: payment.booking_id || "",
      membership_id:
        payment.membership_id || "",
      amount: payment.amount || "",
      payment_method:
        payment.payment_method || "cash",
      transaction_id:
        payment.transaction_id || "",
      payment_status:
        payment.payment_status || "pending",
      notes: payment.notes || "",
    });

    setMessage("");
    setShowModal(true);
  };

  // ==================================================
  // FORM CHANGE
  // ==================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================================================
  // SAVE PAYMENT
  // ==================================================

  const handleSavePayment = async (e) => {
    e.preventDefault();

    if (!formData.user_id) {
      setMessage("Player is required.");
      return;
    }

    if (!formData.amount) {
      setMessage("Amount is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        user_id: Number(formData.user_id),

        booking_id: formData.booking_id
          ? Number(formData.booking_id)
          : null,

        membership_id: formData.membership_id
          ? Number(formData.membership_id)
          : null,

        amount: Number(formData.amount),

        payment_method:
          formData.payment_method,

        transaction_id:
          formData.transaction_id.trim() ||
          null,

        payment_status:
          formData.payment_status,

        notes:
          formData.notes.trim() || null,
      };

      let res;

      if (editingPayment) {
        res = await api.put(
          `/payments/${editingPayment.id}`,
          payload
        );
      } else {
        res = await api.post(
          "/payments",
          payload
        );
      }

      if (res.data.success) {
        setMessage(
          editingPayment
            ? "Payment updated successfully."
            : "Payment created successfully."
        );

        setShowModal(false);
        setEditingPayment(null);

        await fetchPayments();
      } else {
        setMessage(
          res.data.message ||
            "Unable to save payment."
        );
      }
    } catch (error) {
      console.error(
        "Save Payment Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Unable to save payment."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==================================================
  // DELETE PAYMENT
  // ==================================================

  const handleDeletePayment = async (payment) => {
    const confirmed = window.confirm(
      `Delete payment #${payment.id}?`
    );

    if (!confirmed) return;

    try {
      const res = await api.delete(
        `/payments/${payment.id}`
      );

      if (res.data.success) {
        setMessage(
          "Payment deleted successfully."
        );

        await fetchPayments();
      } else {
        setMessage(
          res.data.message ||
            "Unable to delete payment."
        );
      }
    } catch (error) {
      console.error(
        "Delete Payment Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Unable to delete payment."
      );
    }
  };

  // ==================================================
  // EXPORT
  // ==================================================

  const handleExport = () => {
    if (filtered.length === 0) {
      setMessage(
        "No payments available to export."
      );
      return;
    }

    const headers = [
      "Payment ID",
      "Transaction ID",
      "Player",
      "Amount",
      "Payment Method",
      "Booking ID",
      "Payment Date",
      "Status",
    ];

    const rows = filtered.map((payment) => [
      payment.id,
      payment.transaction_id ||
        `TXN00${payment.id}`,
      payment.user_name || "N/A",
      Number(payment.amount || 0),
      payment.payment_method || "UPI",
      payment.booking_id || "-",
      payment.payment_date
        ? new Date(
            payment.payment_date
          ).toLocaleDateString("en-IN")
        : "-",
      payment.payment_status || "pending",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(
              /"/g,
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = "payments.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {
    return (
      <div className="payments-page">
        <div className="payments-loading">
          <div className="loading-spinner"></div>
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="payments-page">

      {/* HEADER */}
      <div className="payments-header">
        <div>
          <h1>
            {isPlayer
              ? "My Payments"
              : "Payments"}
          </h1>

          <p>
            ₹
            {totalRevenue.toLocaleString(
              "en-IN"
            )}{" "}
            {isPlayer
              ? "total paid"
              : "total revenue"}{" "}
            • {payments.length}{" "}
            {payments.length === 1
              ? "transaction"
              : "transactions"}
          </p>
        </div>

        {!isPlayer && (
          <div className="payments-header-actions">

            <button
              className="payment-add-btn"
              onClick={openCreateModal}
            >
              <Plus size={14} />
              Add Payment
            </button>

            <button
              className="payment-export-btn"
              onClick={handleExport}
              style={{
                cursor: "pointer",
                border: "none",
              }}
            >
              <Download size={14} />
              <span>{payments.length}</span>
              Export
            </button>

          </div>
        )}
      </div>

      {/* STATS */}
      <div className="payment-stats-grid">

        <div className="payment-stat-card stat-revenue">
          <span className="payment-stat-label">
            {isPlayer
              ? "Total Paid"
              : "Total Revenue"}
          </span>

          <div className="payment-stat-value">
            ₹
            {totalRevenue.toLocaleString(
              "en-IN"
            )}
          </div>

          <small className="payment-stat-note">
            {isPlayer
              ? "Your completed payments"
              : "Total collected"}
          </small>
        </div>

        <div className="payment-stat-card stat-completed">
          <span className="payment-stat-label">
            Completed
          </span>

          <div className="payment-stat-value">
            {completed}
          </div>

          <small className="payment-stat-note">
            Successful payments
          </small>
        </div>

        <div className="payment-stat-card stat-pending">
          <span className="payment-stat-label">
            Pending
          </span>

          <div className="payment-stat-value">
            {pending}
          </div>

          <small className="payment-stat-note">
            Awaiting confirmation
          </small>
        </div>

        <div className="payment-stat-card stat-today">
          <span className="payment-stat-label">
            Today
          </span>

          <div className="payment-stat-value">
            ₹
            {todayRevenue.toLocaleString(
              "en-IN"
            )}
          </div>

          <small className="payment-stat-note">
            Today's collection
          </small>
        </div>

      </div>

      {/* TOOLBAR */}
      <div className="payments-toolbar">

        <div className="payments-search">
          <Search size={16} />

          <input
            placeholder={
              isPlayer
                ? "Search my payments"
                : "Search user, transaction ID"
            }
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
          />
        </div>

        <select
          className="payments-filter"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="success">
            Success
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="failed">
            Failed
          </option>
        </select>

      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`payments-message ${
            message
              .toLowerCase()
              .includes("success")
              ? "payments-message-success"
              : "payments-message-error"
          }`}
        >
          {message}
        </div>
      )}

      {/* PAYMENT LIST */}
      <div className="payments-section">

        <div className="payments-section-header">
          <h2>
            {isPlayer
              ? "My Payments"
              : "All Payments"}
          </h2>

          <span>
            {filtered.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="payments-empty">
            <div className="empty-payment-icon">
              ₹
            </div>

            <h3>
              {isPlayer
                ? "No Payments Found"
                : "No Payments Found"}
            </h3>

            <p>
              {isPlayer
                ? "You do not have any payment records yet."
                : "No payment records match your search."}
            </p>
          </div>
        ) : (
          <div className="payments-grid">

            {filtered.map((payment) => {
              const status = (
                payment.payment_status ||
                "pending"
              ).toLowerCase();

              return (
                <div
                  className="payment-card"
                  key={payment.id}
                >

                  <div className="payment-card-header">

                    <div className="payment-icon">
                      ₹
                    </div>

                    <div>
                      <h3>
                        #{payment.id}{" "}
                        {payment.transaction_id ||
                          `TXN00${payment.id}`}
                      </h3>

                      <span className="payment-date">
                        {payment.payment_date
                          ? new Date(
                              payment.payment_date
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "-"}
                      </span>
                    </div>

                  </div>

                  <div className="payment-amount">
                    ₹
                    {Number(
                      payment.amount || 0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </div>

                  <div className="payment-details">

                    <div className="payment-detail-row">
                      <span>Player</span>
                      <strong>
                        {payment.user_name ||
                          "N/A"}
                      </strong>
                    </div>

                    <div className="payment-detail-row">
                      <span>Method</span>
                      <strong>
                        {payment.payment_method ||
                          "UPI"}
                      </strong>
                    </div>

                    <div className="payment-detail-row">
                      <span>Booking</span>
                      <strong>
                        #
                        {payment.booking_id ||
                          "-"}
                      </strong>
                    </div>

                  </div>

                  <div className="payment-card-footer">

                    <div>
                      <span className="payment-label">
                        Status
                      </span>

                      <span
                        className={`payment-status payment-status-${status}`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* ADMIN ONLY ACTIONS */}
                    {!isPlayer && (
                      <div className="payment-card-actions">

                        <button
                          type="button"
                          className="payment-action-btn edit"
                          onClick={() =>
                            openEditModal(
                              payment
                            )
                          }
                          title="Edit Payment"
                          aria-label="Edit Payment"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="payment-action-btn delete"
                          onClick={() =>
                            handleDeletePayment(
                              payment
                            )
                          }
                          title="Delete Payment"
                          aria-label="Delete Payment"
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>
                    )}

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* PAYMENT MODAL - ADMIN / STAFF ONLY */}
      {showModal && !isPlayer && (
        <div
          className="payment-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="payment-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="payment-modal-header">

              <div>
                <h2>
                  {editingPayment
                    ? "Edit Payment"
                    : "Add Payment"}
                </h2>

                <p>
                  {editingPayment
                    ? "Update payment information"
                    : "Create a new payment record"}
                </p>
              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X size={20} />
              </button>

            </div>

            <form
              className="payment-modal-body"
              onSubmit={handleSavePayment}
            >

              <div className="payment-form-grid">

                {/* PLAYER */}
                <div className="payment-form-group">
                  <label>Player *</label>

                  <select
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">
                      Select Player
                    </option>

                    {players.map((player) => (
                      <option
                        key={player.id}
                        value={player.id}
                      >
                        {player.full_name ||
                          player.name ||
                          `Player #${player.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* BOOKING */}
                <div className="payment-form-group">
                  <label>Booking</label>

                  <select
                    name="booking_id"
                    value={
                      formData.booking_id
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="">
                      No Booking
                    </option>

                    {bookings.map(
                      (booking) => (
                        <option
                          key={booking.id}
                          value={booking.id}
                        >
                          #{booking.id} -{" "}
                          {booking.game_name ||
                            "Booking"}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* MEMBERSHIP */}
                <div className="payment-form-group">
                  <label>
                    Membership
                  </label>

                  <select
                    name="membership_id"
                    value={
                      formData.membership_id
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="">
                      No Membership
                    </option>

                    {memberships.map(
                      (membership) => (
                        <option
                          key={membership.id}
                          value={membership.id}
                        >
                          #{membership.id}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* AMOUNT */}
                <div className="payment-form-group">
                  <label>Amount *</label>

                  <input
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Enter amount"
                    required
                  />
                </div>

                {/* PAYMENT METHOD */}
                <div className="payment-form-group">
                  <label>
                    Payment Method *
                  </label>

                  <select
                    name="payment_method"
                    value={
                      formData.payment_method
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                  >
                    <option value="cash">
                      Cash
                    </option>
                    <option value="card">
                      Card
                    </option>
                    <option value="upi">
                      UPI
                    </option>
                    <option value="wallet">
                      Wallet
                    </option>
                    <option value="online">
                      Online
                    </option>
                  </select>
                </div>

                {/* STATUS */}
                <div className="payment-form-group">
                  <label>
                    Payment Status
                  </label>

                  <select
                    name="payment_status"
                    value={
                      formData.payment_status
                    }
                    onChange={
                      handleFormChange
                    }
                  >
                    <option value="pending">
                      Pending
                    </option>

                    <option value="completed">
                      Completed
                    </option>

                    <option value="failed">
                      Failed
                    </option>

                    <option value="refunded">
                      Refunded
                    </option>
                  </select>
                </div>

                {/* TRANSACTION ID */}
                <div className="payment-form-group">
                  <label>
                    Transaction ID
                  </label>

                  <input
                    type="text"
                    name="transaction_id"
                    value={
                      formData.transaction_id
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Optional"
                    maxLength={150}
                  />
                </div>

                {/* NOTES */}
                <div className="payment-form-group full-width">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={
                      handleFormChange
                    }
                    placeholder="Optional notes"
                    rows="3"
                  />
                </div>

              </div>

              <div className="payment-modal-footer">

                <button
                  type="button"
                  className="payment-modal-cancel"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="payment-modal-submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingPayment
                    ? "Update Payment"
                    : "Create Payment"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Payments;
