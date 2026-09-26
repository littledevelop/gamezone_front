
import { useEffect, useState } from "react";

import {
    Gamepad2,
    Search,
    Zap,
    Monitor,
    Plus,
    Pencil,
    Trash2,
    X,
    MapPin,
    Wifi,
    CalendarDays,
    FileText,
} from "lucide-react";

import api from "../api/axios";
import "../styles/GamingStation.css";

function GamingStation() {
    const [stations, setStations] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [players, setPlayers] = useState([]);

    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("error");
const [modalError, setModalError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState(null);

    const [formData, setFormData] = useState({
        station_name: "",
        platform_id: "",
        status: "available",
        current_player_id: "",
        ip_address: "",
        maintenance_date: "",
        location: "",
        notes: "",
    });

    const [formErrors, setFormErrors] = useState({
        station_name: "",
        platform_id: "",
        current_player_id: "",
        ip_address: "",
        maintenance_date: "",
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

    const canManage =
        role === "Admin" || role === "Staff";

    const canDelete = role === "Admin";

    // =====================================================
    // LOAD STATIONS
    // =====================================================

    const loadStations = async () => {
        try {
            const res = await api.get("/gaming-stations");

            if (res.data.success) {
                setStations(res.data.data || []);
            } else if (Array.isArray(res.data)) {
                setStations(res.data);
            } else {
                setStations([]);
            }
        } catch (error) {
            console.error("Load stations error:", error);

            setMessage(
                error.response?.data?.message ||
                "Failed to load gaming stations"
            );

            setMessageType("error");
        }
    };

    // =====================================================
    // LOAD PLATFORMS
    // =====================================================

    const loadPlatforms = async () => {
        try {
            const res = await api.get("/platforms");

            if (res.data.success) {
                setPlatforms(
                    res.data.data ||
                    res.data.platforms ||
                    []
                );
            } else if (Array.isArray(res.data)) {
                setPlatforms(res.data);
            } else {
                setPlatforms([]);
            }
        } catch (error) {
            console.error("Load platforms error:", error);

            setMessage(
                error.response?.data?.message ||
                "Failed to load platforms"
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
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            await Promise.all([
                loadStations(),
                loadPlatforms(),
                loadPlayers(),
            ]);

            setLoading(false);
        };

        loadData();
    }, []);

    // =====================================================
    // MESSAGE
    // =====================================================

    const showMessage = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);

        setTimeout(() => {
            setMessage("");
        }, 3500);
    };

    // =====================================================
    // FORM RESET
    // =====================================================

    const resetForm = () => {
        setFormData({
            station_name: "",
            platform_id: "",
            status: "available",
            current_player_id: "",
            ip_address: "",
            maintenance_date: "",
            location: "",
            notes: "",
        });

        setFormErrors({
            station_name: "",
            platform_id: "",
            current_player_id: "",
            ip_address: "",
            maintenance_date: "",
        });
    };

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const handleAddStation = () => {
        resetForm();
        setEditingStation(null);
            setModalError("");

        setModalOpen(true);
    };

    // =====================================================
    // OPEN EDIT MODAL
    // =====================================================

    const handleEditStation = async (station) => {
        try {
            const res = await api.get(
                `/gaming-stations/${station.id}`
            );

            const data =
                res.data.data ||
                res.data.station ||
                res.data;

            setEditingStation(data);

            setFormData({
                station_name: data.station_name || "",

                platform_id: data.platform_id
                    ? String(data.platform_id)
                    : "",

                status: data.status || "available",

                current_player_id:
                    data.current_player_id
                        ? String(data.current_player_id)
                        : "",

                ip_address: data.ip_address || "",

                maintenance_date:
                    data.maintenance_date
                        ? String(
                              data.maintenance_date
                          ).slice(0, 10)
                        : "",

                // Correct: use station data
                location: data.location || "",

                notes: data.notes || "",
            });

            setFormErrors({
                station_name: "",
                platform_id: "",
                current_player_id: "",
                ip_address: "",
                maintenance_date: "",
            });
    setModalError("");

            setModalOpen(true);
        } catch (error) {
            console.error("Get station error:", error);

            showMessage(
                error.response?.data?.message ||
                "Failed to load station details",
                "error"
            );
        }
    };

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const updatedData = {
                ...prev,
                [name]: value,
            };

            // If station is no longer occupied,
            // clear current player.
            if (
                name === "status" &&
                value !== "occupied"
            ) {
                updatedData.current_player_id = "";
            }

            // If station is no longer under maintenance,
            // clear maintenance date.
            if (
                name === "status" &&
                value !== "maintenance"
            ) {
                updatedData.maintenance_date = "";
            }

            return updatedData;
        });

        // Clear changed field error
        if (value) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: "",
            }));
        }

        // Clear dependent errors when status changes
        if (name === "status") {
            setFormErrors((prev) => ({
                ...prev,
                current_player_id: "",
                maintenance_date: "",
            }));
        }
    };

    // =====================================================
    // VALIDATION
    // =====================================================

    const validateForm = () => {
        const errors = {
            station_name: "",
            platform_id: "",
            current_player_id: "",
            ip_address: "",
            maintenance_date: "",
        };

        if (!formData.station_name.trim()) {
            errors.station_name =
                "Station name is required";
        }

        if (!formData.platform_id) {
            errors.platform_id =
                "Please select a platform";
        }

        if (
            formData.status === "occupied" &&
            !formData.current_player_id
        ) {
            errors.current_player_id =
                "Current player is required for an occupied station";
        }

        if (
            formData.ip_address &&
            !/^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(
                formData.ip_address.trim()
            )
        ) {
            errors.ip_address =
                "Please enter a valid IPv4 address";
        }

        if (
            formData.status === "maintenance" &&
            !formData.maintenance_date
        ) {
            errors.maintenance_date =
                "Maintenance date is required";
        }

        if (
            formData.maintenance_date &&
            !/^\d{4}-\d{2}-\d{2}$/.test(
                formData.maintenance_date
            )
        ) {
            errors.maintenance_date =
                "Please enter a valid date";
        }

        setFormErrors(errors);

        return !Object.values(errors).some(Boolean);
    };

    // =====================================================
    // SAVE STATION
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaving(true);

        try {
            const payload = {
                station_name:
                    formData.station_name.trim(),

                platform_id:
                    Number(formData.platform_id),

                status: formData.status,

                current_player_id:
                    formData.status === "occupied"
                        ? Number(
                              formData.current_player_id
                          )
                        : null,

                ip_address:
                    formData.ip_address.trim() || null,

                location:
                    formData.location.trim() || null,

                notes:
                    formData.notes.trim() || null,
            };

            if (formData.maintenance_date) {
                payload.maintenance_date =
                    formData.maintenance_date;
            }

            if (editingStation) {
                await api.put(
                    `/gaming-stations/${editingStation.id}`,
                    payload
                );

                showMessage(
                    "Gaming station updated successfully",
                    "success"
                );
            } else {
                await api.post(
                    "/gaming-stations",
                    payload
                );

                showMessage(
                    "Gaming station created successfully",
                    "success"
                );
            }

            setModalOpen(false);
            setEditingStation(null);

            resetForm();

            await loadStations();
        } catch (error) {
            console.error("Save station error:", error);
    console.log("Backend error response:", error.response?.data);

            setModalError(
                error.response?.data?.message ||
                "Failed to save gaming station",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // DELETE STATION
    // =====================================================

    const handleDeleteStation = async (station) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${station.station_name}"?`
        );

        if (!confirmed) {
            return;
        }

        setDeleting(true);

        try {
            await api.delete(
                `/gaming-stations/${station.id}`
            );

            showMessage(
                "Gaming station deleted successfully",
                "success"
            );

            await loadStations();
        } catch (error) {
            console.error(
                "Delete station error:",
                error
            );

            showMessage(
                error.response?.data?.message ||
                "Failed to delete gaming station",
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
        if (saving) return;

        setModalOpen(false);
        setEditingStation(null);
            setModalError("");

        resetForm();
    };

    // =====================================================
    // FILTER
    // =====================================================

    const searchValue = filter.toLowerCase();

    const filtered = stations.filter((station) => {
        return (
            station.station_name
                ?.toLowerCase()
                .includes(searchValue) ||

            station.status
                ?.toLowerCase()
                .includes(searchValue) ||

            station.platform_name
                ?.toLowerCase()
                .includes(searchValue) ||

            station.location
                ?.toLowerCase()
                .includes(searchValue)
        );
    });

    // =====================================================
    // COUNTS
    // =====================================================

    const available = stations.filter(
        (station) =>
            station.status === "available"
    ).length;

    const occupied = stations.filter(
        (station) =>
            station.status === "occupied"
    ).length;

    const maintenance = stations.filter(
        (station) =>
            station.status === "maintenance"
    ).length;

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="gaming-station-loading">
                <div className="loading-spinner" />
                <p>Loading stations...</p>
            </div>
        );
    }

    // =====================================================
    // UI
    // =====================================================

    return (
        <div className="gaming-station-page">

            {/* HEADER */}

            <div className="gaming-station-header">
                <div>
                    <h1>Gaming Stations</h1>

                    <p>
                        {stations.length} stations •{" "}
                        {available} available •{" "}
                        {occupied} occupied •{" "}
                        {maintenance} maintenance
                    </p>
                </div>

                <div className="station-header-actions">

                    <div className="station-count">
                        <Zap size={14} />

                        <strong>
                            {available}
                        </strong>

                        <span>
                            Available
                        </span>
                    </div>

                    {canManage && (
                        <button
                            className="add-station-btn"
                            onClick={
                                handleAddStation
                            }
                        >
                            <Plus size={16} />
                            Add Station
                        </button>
                    )}
                </div>
            </div>

            {/* MESSAGE */}

            {message && (
                <div
                    className={`gaming-station-message ${messageType}`}
                >
                    {message}
                </div>
            )}

            {/* TOOLBAR */}

            <div className="gaming-toolbar">

                <div className="gaming-search">
                    <Search size={16} />

                    <input
                        type="text"
                        placeholder="Search stations, platform, status..."
                        value={filter}
                        onChange={(e) =>
                            setFilter(
                                e.target.value
                            )
                        }
                    />

                    {filter && (
                        <button
                            className="clear-search-btn"
                            onClick={() =>
                                setFilter("")
                            }
                            type="button"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <span className="station-results">
                    {filtered.length} results
                </span>
            </div>

            {/* EMPTY */}

            {filtered.length === 0 ? (
                <div className="gaming-station-empty">

                    <Monitor size={30} />

                    <h3>
                        {filter
                            ? "No Stations Found"
                            : "No Gaming Stations"}
                    </h3>

                    <p>
                        {filter
                            ? "No stations match your search."
                            : "Add your first gaming station to get started."}
                    </p>

                    {!filter && canManage && (
                        <button
                            className="empty-add-btn"
                            onClick={
                                handleAddStation
                            }
                        >
                            <Plus size={15} />
                            Add Station
                        </button>
                    )}
                </div>
            ) : (
                <div className="gaming-station-grid">

                    {filtered.map((station) => (
                        <div
                            className="gaming-station-card"
                            key={station.id}
                        >

                            {/* CARD TOP */}

                            <div className="station-card-top">

                                <div className="station-icon">
                                    <Gamepad2 size={20} />
                                </div>

                                <span
                                    className={`station-status ${station.status}`}
                                >
                                    {station.status}
                                </span>
                            </div>

                            {/* NAME */}

                            <h3>
                                {station.station_name}
                            </h3>

                            {/* DETAILS */}

                            <div className="station-details">

                                <div className="station-detail-row">
                                    <span>ID</span>

                                    <strong>
                                        #{station.id}
                                    </strong>
                                </div>

                                <div className="station-detail-row">
                                    <span>
                                        Platform
                                    </span>

                                    <strong>
                                        {station.platform_name ||
                                            "—"}
                                    </strong>
                                </div>

                                <div className="station-detail-row">
                                    <span>
                                        Location
                                    </span>

                                    <strong>
                                        {station.location ||
                                            "—"}
                                    </strong>
                                </div>

                                {station.ip_address && (
                                    <div className="station-detail-row">
                                        <span>
                                            IP Address
                                        </span>

                                        <strong>
                                            {
                                                station.ip_address
                                            }
                                        </strong>
                                    </div>
                                )}

                                {station.current_player_id && (
                                    <div className="station-detail-row">
                                        <span>
                                            Player
                                        </span>

                                        <strong>
                                            #
                                            {
                                                station.current_player_id
                                            }
                                        </strong>
                                    </div>
                                )}
                            </div>

                            {/* FOOTER */}

                            <div className="station-card-footer">

                                <span>
                                    {station.status ===
                                    "available"
                                        ? "● Available"
                                        : station.status ===
                                          "occupied"
                                          ? "● In Use"
                                          : station.status ===
                                            "maintenance"
                                            ? "● Maintenance"
                                            : "● Inactive"}
                                </span>

                                {canManage && (
                                    <div className="station-actions">

                                        <button
                                            className="station-manage-btn"
                                            onClick={() =>
                                                handleEditStation(
                                                    station
                                                )
                                            }
                                            title="Edit station"
                                        >
                                            <Pencil size={14} />
                                            Edit
                                        </button>

                                        {canDelete && (
                                            <button
                                                className="station-delete-btn"
                                                onClick={() =>
                                                    handleDeleteStation(
                                                        station
                                                    )
                                                }
                                                disabled={
                                                    deleting
                                                }
                                                title="Delete station"
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

            {/* ADD / EDIT MODAL */}

            {modalOpen && (
                <div
                    className="station-modal-overlay"
                    onMouseDown={(e) => {
                        if (
                            e.target ===
                                e.currentTarget &&
                            !saving
                        ) {
                            handleCloseModal();
                        }
                    }}
                >
                    <div className="station-modal">

    {modalError && (
        <div className="station-modal-error">
            {modalError}
        </div>
    )}
                        {/* MODAL HEADER */}

                        <div className="station-modal-header">

                            <div>
                                <h2>
                                    {editingStation
                                        ? "Edit Gaming Station"
                                        : "Add Gaming Station"}
                                </h2>

                                <p>
                                    {editingStation
                                        ? "Update station information and status."
                                        : "Add a new gaming station to your center."}
                                </p>
                            </div>

                            <button
                                className="station-modal-close"
                                onClick={
                                    handleCloseModal
                                }
                                disabled={saving}
                                type="button"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {/* FORM */}

                        <form
                            className="station-form"
                            onSubmit={handleSubmit}
                        >

                            {/* STATION NAME */}

                            <div className="station-form-group">
                                <label htmlFor="station_name">
                                    Station Name
                                    <span>*</span>
                                </label>

                                <input
                                    id="station_name"
                                    name="station_name"
                                    type="text"
                                    value={
                                        formData.station_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. PS5 Station 03"
                                    disabled={saving}
                                />

                                {formErrors.station_name && (
                                    <small className="station-form-error">
                                        {
                                            formErrors.station_name
                                        }
                                    </small>
                                )}
                            </div>

                            {/* PLATFORM */}

                            <div className="station-form-group">
                                <label htmlFor="platform_id">
                                    Platform
                                    <span>*</span>
                                </label>

                                <select
                                    name="platform_id"
                                    value={
                                        formData.platform_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={saving}
                                >
                                    <option value="">
                                        Select Platform
                                    </option>

                                    {platforms.map(
                                        (platform) => (
                                            <option
                                                key={
                                                    platform.id
                                                }
                                                value={
                                                    platform.id
                                                }
                                            >
                                                {platform.name ||
                                                    platform.platform_name}
                                            </option>
                                        )
                                    )}
                                </select>

                                {formErrors.platform_id && (
                                    <small className="station-form-error">
                                        {
                                            formErrors.platform_id
                                        }
                                    </small>
                                )}
                            </div>

                            {/* TWO COLUMN ROW */}

                            <div className="station-form-row">

                                {/* STATUS */}

                                <div className="station-form-group">
                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            formData.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                    >
                                        <option value="available">
                                            Available
                                        </option>

                                        <option value="occupied">
                                            Occupied
                                        </option>

                                        <option value="maintenance">
                                            Maintenance
                                        </option>

                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                                {/* CURRENT PLAYER */}

                                {formData.status ===
                                    "occupied" && (
                                    <div className="station-form-group">

                                        <label>
                                            Current Player
                                            <span>*</span>
                                        </label>

                                        <select
                                            name="current_player_id"
                                            value={
                                                formData.current_player_id
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            disabled={
                                                saving
                                            }
                                        >
                                            <option value="">
                                                Select Player
                                            </option>

                                            {players.map(
                                                (
                                                    player
                                                ) => (
                                                    <option
                                                        key={
                                                            player.id
                                                        }
                                                        value={
                                                            player.id
                                                        }
                                                    >
                                                        {
                                                            player.full_name
                                                        }{" "}
                                                        (#
                                                        {
                                                            player.id
                                                        }
                                                        )
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        {formErrors.current_player_id && (
                                            <small className="station-form-error">
                                                {
                                                    formErrors.current_player_id
                                                }
                                            </small>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* IP ADDRESS */}

                            <div className="station-form-group">
                                <label>
                                    <Wifi size={13} />
                                    IP Address
                                </label>

                                <input
                                    type="text"
                                    name="ip_address"
                                    value={
                                        formData.ip_address
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. 192.168.1.103"
                                    disabled={saving}
                                />

                                {formErrors.ip_address && (
                                    <small className="station-form-error">
                                        {
                                            formErrors.ip_address
                                        }
                                    </small>
                                )}
                            </div>

                            {/* MAINTENANCE DATE */}

                            {formData.status ===
                                "maintenance" && (
                                <div className="station-form-group">

                                    <label htmlFor="maintenance_date">
                                        <CalendarDays size={13} />
                                        Maintenance Date
                                        <span>*</span>
                                    </label>

                                    <input
                                        type="date"
                                        name="maintenance_date"
                                        value={
                                            formData.maintenance_date
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        disabled={saving}
                                    />

                                    {formErrors.maintenance_date && (
                                        <small className="station-form-error">
                                            {
                                                formErrors.maintenance_date
                                            }
                                        </small>
                                    )}
                                </div>
                            )}

                            {/* LOCATION */}

                            <div className="station-form-group">
                                <label>
                                    <MapPin size={13} />
                                    Location
                                </label>

                                <select
                                    name="location"
                                    value={
                                        formData.location
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={saving}
                                >
                                    <option value="">
                                        Select Location
                                    </option>

                                    <option value="Gaming Area A">
                                        Gaming Area A
                                    </option>

                                    <option value="Gaming Area B">
                                        Gaming Area B
                                    </option>

                                    <option value="Gaming Room A">
                                        Gaming Room A
                                    </option>

                                    <option value="VR Zone">
                                        VR Zone
                                    </option>

                                    <option value="Bowling Area">
                                        Bowling Area
                                    </option>

                                    <option value="Laser Tag Arena">
                                        Laser Tag Arena
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </div>

                            {/* NOTES */}

                            <div className="station-form-group">
                                <label>
                                    <FileText size={13} />
                                    Notes
                                </label>

                                <textarea
                                    name="notes"
                                    value={
                                        formData.notes
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Add any additional notes..."
                                    rows="3"
                                    disabled={saving}
                                />
                            </div>

                            {/* ACTIONS */}

                            <div className="station-form-actions">

                                <button
                                    type="button"
                                    className="station-cancel-btn"
                                    onClick={
                                        handleCloseModal
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="station-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="button-spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {editingStation
                                                ? "Update Station"
                                                : "Add Station"}
                                        </>
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

export default GamingStation;
