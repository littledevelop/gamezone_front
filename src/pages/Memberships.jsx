import { useEffect, useState } from "react";
import {
  Crown,
  Search,
  CalendarDays,
  User,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import api from "../api/axios";
import "../styles/Memberships.css";

function Memberships() {
  const [memberships, setMemberships] = useState([]);
  const [players, setPlayers] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);

  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [modalError, setModalError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState(null);

  const [formData, setFormData] = useState({
    user_id: "",
    membership_type_id: "",
    status: "active",
    auto_renew: false,
  });

  // =====================================================
  // USER / ROLE
  // =====================================================

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  };

  const user = getStoredUser();
  const role = user.role_name || user.role || "";

  const canManage = role === "Admin" || role === "Staff";
  const canDelete = role === "Admin";

  // =====================================================
  // LOAD MEMBERSHIPS
  // =====================================================

  const loadMemberships = async () => {
    try {
      const res = await api.get("/memberships");

      if (res.data.success) {
        setMemberships(res.data.memberships || res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setMemberships(res.data);
      } else {
        setMemberships([]);
      }
    } catch (error) {
      console.error("Load memberships error:", error);

      setMessage(
        error.response?.data?.message ||
        "Failed to load memberships"
      );

      setMessageType("error");
    }
  };

  // =====================================================
  // LOAD PLAYERS
  // =====================================================

  const loadPlayers = async () => {
    try {
      const res = await api.get("/users/players");

      if (res.data.success) {
        setPlayers(
          res.data.data ||
          res.data.players ||
          []
        );
      } else if (Array.isArray(res.data)) {
        setPlayers(res.data);
      } else {
        setPlayers([]);
      }
    } catch (error) {
      console.error("Load players error:", error);
      setPlayers([]);
    }
  };

  // =====================================================
  // LOAD MEMBERSHIP TYPES
  // =====================================================

  const loadMembershipTypes = async () => {
    try {
      const res = await api.get("/membership-types");

      if (res.data.success) {
        setMembershipTypes(
          res.data.data ||
          res.data.membershipTypes ||
          []
        );
      } else if (Array.isArray(res.data)) {
        setMembershipTypes(res.data);
      } else {
        setMembershipTypes([]);
      }
    } catch (error) {
      console.error(
        "Load membership types error:",
        error
      );

      setMembershipTypes([]);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        loadMemberships(),
        loadPlayers(),
        loadMembershipTypes(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // =====================================================
  // MESSAGE
  // =====================================================

  const showMessage = (
    text,
    type = "success"
  ) => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setFormData({
      user_id: "",
      membership_type_id: "",
      status: "active",
      auto_renew: false,
    });

    setModalError("");
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const handleEditMembership = async (membership) => {
    try {
      setModalError("");

      const res = await api.get(
        `/memberships/${membership.id}`
      );

      const data =
        res.data.data ||
        res.data.membership ||
        res.data;

      setEditingMembership(data);

      setFormData({
        user_id: data.user_id
          ? String(data.user_id)
          : "",
        membership_type_id: data.membership_type_id
          ? String(data.membership_type_id)
          : "",
        status: data.status || "active",
        auto_renew:
          Boolean(data.auto_renew),
      });

      setModalOpen(true);
    } catch (error) {
      console.error(
        "Get membership error:",
        error
      );

      showMessage(
        error.response?.data?.message ||
        "Failed to load membership details",
        "error"
      );
    }
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // AUTO RENEW CHANGE
  // =====================================================

  const handleAutoRenewChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      auto_renew: e.target.checked,
    }));
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {
    if (!formData.user_id) {
      setModalError("Please select a user.");
      return false;
    }

    if (!formData.membership_type_id) {
      setModalError(
        "Please select a membership type."
      );
      return false;
    }

    if (
      !["active", "expired", "cancelled"].includes(
        formData.status
      )
    ) {
      setModalError("Please select a valid status.");
      return false;
    }

    setModalError("");
    return true;
  };

  // =====================================================
  // SAVE MEMBERSHIP
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!editingMembership) {
      return;
    }

    setSaving(true);
    setModalError("");

    try {
      const payload = {
        user_id: formData.user_id,
        membership_type_id: formData.membership_type_id,
        start_date: formData.start_date
          ? String(formData.start_date).substring(0, 10)
          : "",
        end_date: formData.end_date
          ? String(formData.end_date).substring(0, 10)
          : "",
        status: formData.status,
        auto_renew: formData.auto_renew,
      };

      await api.put(
        `/memberships/${editingMembership.id}`,
        payload
      );

      showMessage(
        "Membership updated successfully",
        "success"
      );

      setModalOpen(false);
      setEditingMembership(null);
      resetForm();

      await loadMemberships();
    } catch (error) {
      console.error(
        "Save membership error:",
        error
      );

      console.log(
        "Backend error response:",
        error.response?.data
      );

      setModalError(
        error.response?.data?.message ||
        "Failed to update membership"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE MEMBERSHIP
  // =====================================================

  const handleDeleteMembership = async (
    membership
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete membership #${membership.id}?`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.delete(
        `/memberships/${membership.id}`
      );

      showMessage(
        "Membership deleted successfully",
        "success"
      );

      await loadMemberships();
    } catch (error) {
      console.error(
        "Delete membership error:",
        error
      );

      showMessage(
        error.response?.data?.message ||
        "Failed to delete membership",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleCloseModal = () => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingMembership(null);
    resetForm();
  };

  // =====================================================
  // FILTER
  // =====================================================

  const searchValue = filter.toLowerCase();

  const filtered = memberships.filter(
    (membership) => {
      return (
        (
          membership.membership_type_name ||
          ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        (
          membership.user_name ||
          membership.full_name ||
          ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        (
          membership.status ||
          ""
        )
          .toLowerCase()
          .includes(searchValue)
      );
    }
  );

  // =====================================================
  // COUNTS
  // =====================================================

  const activeCount = memberships.filter(
    (membership) =>
      membership.status === "active" ||
      !membership.status
  ).length;

  const expiredCount = memberships.filter(
    (membership) =>
      membership.status === "expired"
  ).length;

  const cancelledCount = memberships.filter(
    (membership) =>
      membership.status === "cancelled"
  ).length;

  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel = (status) => {
    if (status === "active") {
      return "● Active";
    }

    if (status === "expired") {
      return "● Expired";
    }

    if (status === "cancelled") {
      return "● Cancelled";
    }

    return "● Active";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="memberships-loading">
        <div className="loading-spinner" />
        <p>Loading memberships...</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="memberships-page">

      {/* HEADER */}

      <div className="memberships-header">
        <div>
          <h1>Memberships</h1>

          <p>
            {memberships.length} memberships •{" "}
            {activeCount} active •{" "}
            {expiredCount} expired •{" "}
            {cancelledCount} cancelled
          </p>
        </div>

        <div className="memberships-count">
          <Crown size={14} />

          <strong>
            {activeCount}
          </strong>

          <span>Active</span>
        </div>
      </div>

      {/* MESSAGE */}

      {message && (
        <div
          className={`memberships-message ${messageType}`}
        >
          {message}
        </div>
      )}

      {/* TOOLBAR */}

      <div className="memberships-toolbar">

        <div className="memberships-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search membership, user, status..."
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
          />

          {filter && (
            <button
              className="clear-membership-search"
              type="button"
              onClick={() => setFilter("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <span className="membership-results">
          {filtered.length} results
        </span>

      </div>

      {/* EMPTY */}

      {filtered.length === 0 ? (
        <div className="memberships-empty">
          <Crown size={30} />

          <h3>
            {filter
              ? "No Memberships Found"
              : "No Memberships"}
          </h3>

          <p>
            {filter
              ? "No memberships match your search."
              : "No membership records are available."}
          </p>
        </div>
      ) : (

        /* MEMBERSHIP GRID */

        <div className="memberships-grid">

          {filtered.map((membership) => (

            <div
              className="membership-card"
              key={membership.id}
            >

              {/* CARD TOP */}

              <div className="membership-card-top">

                <div className="membership-icon">
                  <Crown size={20} />
                </div>

                <div className="membership-card-top-right">

                  <span className="membership-id">
                    #{membership.id}
                  </span>

                  <span
                    className={`membership-status ${membership.status ||
                      "active"
                      }`}
                  >
                    {membership.status ||
                      "active"}
                  </span>

                </div>

              </div>

              {/* MEMBERSHIP TYPE */}

              <h3>
                {membership.membership_type_name ||
                  "Premium Plan"}
              </h3>

              {/* PRICE */}

              <div className="membership-price">
                ₹{membership.price || "0.00"}

                <span>/month</span>
              </div>

              {/* USER */}

              <div className="membership-user">
                <User size={14} />

                <span>
                  {membership.user_name ||
                    membership.full_name ||
                    "N/A"}
                </span>
              </div>

              {/* DETAILS */}

              <div className="membership-details">

                <div className="membership-detail-row">

                  <span>
                    <CalendarDays size={12} />
                    Start Date
                  </span>

                  <strong>
                    {membership.start_date
                      ? new Date(
                        membership.start_date
                      ).toLocaleDateString(
                        "en-IN"
                      )
                      : "N/A"}
                  </strong>

                </div>

                <div className="membership-detail-row">

                  <span>
                    <CalendarDays size={12} />
                    End Date
                  </span>

                  <strong>
                    {membership.expiry_date
                      ? new Date(
                        membership.expiry_date
                      ).toLocaleDateString(
                        "en-IN"
                      )
                      : "N/A"}
                  </strong>

                </div>

                <div className="membership-detail-row">

                  <span>
                    Auto Renew
                  </span>

                  <strong
                    className={
                      membership.auto_renew
                        ? "yes"
                        : "no"
                    }
                  >
                    {membership.auto_renew
                      ? "Enabled"
                      : "Disabled"}
                  </strong>

                </div>

              </div>

              {/* FOOTER */}

              <div className="membership-card-footer">

                <span>
                  {getStatusLabel(
                    membership.status
                  )}
                </span>

                {canManage && (
                  <div className="membership-actions">

                    <button
                      className="membership-manage-btn"
                      onClick={() =>
                        handleEditMembership(
                          membership
                        )
                      }
                      title="Edit membership"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    {canDelete && (
                      <button
                        className="membership-delete-btn"
                        onClick={() =>
                          handleDeleteMembership(
                            membership
                          )
                        }
                        disabled={deleting}
                        title="Delete membership"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                  </div>
                )}

              </div>

            </div>

          ))}

        </div>
      )}

      {/* EDIT MODAL */}

      {modalOpen && (
        <div
          className="membership-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              handleCloseModal();
            }
          }}
        >

          <div className="membership-modal">

            {/* MODAL ERROR */}

            {modalError && (
              <div className="membership-modal-error">
                {modalError}
              </div>
            )}

            {/* MODAL HEADER */}

            <div className="membership-modal-header">

              <div>
                <h2>
                  Edit Membership
                </h2>

                <p>
                  Update membership information
                  and status.
                </p>
              </div>

              <button
                className="membership-modal-close"
                onClick={handleCloseModal}
                disabled={saving}
                type="button"
              >
                <X size={19} />
              </button>

            </div>

            {/* FORM */}

            <form
              className="membership-form"
              onSubmit={handleSubmit}
            >

              {/* USER */}

              <div className="membership-form-group">

                <label>
                  User
                  <span>*</span>
                </label>

                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    Select User
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

              {/* MEMBERSHIP TYPE */}

              <div className="membership-form-group">

                <label>
                  Membership Type
                  <span>*</span>
                </label>

                <select
                  name="membership_type_id"
                  value={
                    formData.membership_type_id
                  }
                  onChange={handleChange}
                  disabled={saving}
                >
                  <option value="">
                    Select Membership Type
                  </option>

                  {membershipTypes.map(
                    (type) => (
                      <option
                        key={type.id}
                        value={type.id}
                      >
                        {type.type_name ||
                          type.name ||
                          type.membership_type_name}
                      </option>
                    )
                  )}
                </select>

              </div>

              {/* STATUS + AUTO RENEW */}

              <div className="membership-form-row">

                <div className="membership-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="expired">
                      Expired
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>

                </div>

                <div className="membership-form-group">

                  <label>
                    Auto Renew
                  </label>

                  <label className="membership-switch">

                    <input
                      type="checkbox"
                      checked={
                        formData.auto_renew
                      }
                      onChange={
                        handleAutoRenewChange
                      }
                      disabled={saving}
                    />

                    <span className="membership-switch-slider" />

                    <span className="membership-switch-text">
                      {formData.auto_renew
                        ? "Enabled"
                        : "Disabled"}
                    </span>

                  </label>

                </div>

              </div>

              {/* ACTIONS */}

              <div className="membership-form-actions">

                <button
                  type="button"
                  className="membership-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="membership-save-btn"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="membership-button-spinner" />
                      Saving...
                    </>
                  ) : (
                    "Update Membership"
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Memberships;