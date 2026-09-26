
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import api from "../api/axios";
import "../styles/Camera.css";
import { isAdminOrStaff, isAdmin } from "../utils/auth";

function Camera() {
    const canManage = isAdminOrStaff();
    const canDelete = isAdmin();

    const [cameras, setCameras] = useState([]);
    const [stations, setStations] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingCamera, setEditingCamera] = useState(null);

    const [loading, setLoading] = useState(false);

    // Main page messages
    const [message, setMessage] = useState("");

    // Modal success message
    const [modalMessage, setModalMessage] = useState("");

    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        camera_name: "",
        camera_code: "",
        gaming_station_id: "",
        ip_address: "",
        camera_type: "fixed",
        status: "active",
        location: "",
        notes: ""
    });

    // ==================================================
    // LOAD CAMERAS
    // ==================================================

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [cameraResponse, stationResponse] =
                    await Promise.all([
                        api.get("/cameras"),
                        api.get("/gaming-stations")
                    ]);

                if (cancelled) return;

                setCameras(
                    cameraResponse.data?.data || []
                );

                setStations(
                    stationResponse.data?.data || []
                );
            } catch (err) {
                if (cancelled) return;

                console.error(
                    "Load camera data error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load camera data."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, []);

    // ==================================================
    // FORM CHANGE
    // ==================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        // Clear messages while editing the form
        if (modalMessage) {
            setModalMessage("");
        }

        if (error) {
            setError("");
        }
    };

    // ==================================================
    // OPEN ADD MODAL
    // ==================================================

    const handleAdd = () => {
        setEditingCamera(null);

        setFormData({
            camera_name: "",
            camera_code: "",
            gaming_station_id: "",
            ip_address: "",
            camera_type: "fixed",
            status: "active",
            location: "",
            notes: ""
        });

        setMessage("");
        setModalMessage("");
        setError("");

        setShowModal(true);
    };

    // ==================================================
    // OPEN EDIT MODAL
    // ==================================================

    const handleEdit = (camera) => {
        setEditingCamera(camera);

        setFormData({
            camera_name: camera.camera_name || "",
            camera_code: camera.camera_code || "",
            gaming_station_id:
                camera.gaming_station_id || "",
            ip_address: camera.ip_address || "",
            camera_type:
                camera.camera_type || "fixed",
            status:
                camera.status || "active",
            location: camera.location || "",
            notes: camera.notes || ""
        });

        setMessage("");
        setModalMessage("");
        setError("");

        setShowModal(true);
    };

    // ==================================================
    // CLOSE MODAL
    // ==================================================

    const closeModal = () => {
        // Do not close while success message is being shown
        if (modalMessage) return;

        setShowModal(false);
        setEditingCamera(null);
        setModalMessage("");
        setError("");
    };

    // ==================================================
    // SUBMIT FORM
    // ==================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setModalMessage("");
        setError("");

        try {
            const payload = {
                camera_name:
                    formData.camera_name.trim(),

                camera_code:
                    formData.camera_code.trim() ||
                    null,

                gaming_station_id:
                    Number(
                        formData.gaming_station_id
                    ),

                ip_address:
                    formData.ip_address.trim() ||
                    null,

                camera_type:
                    formData.camera_type,

                status:
                    formData.status,

                location:
                    formData.location.trim() ||
                    null,

                notes:
                    formData.notes.trim() ||
                    null
            };

            // ------------------------------------------
            // EDIT
            // ------------------------------------------

            if (editingCamera) {
                await api.put(
                    `/cameras/${editingCamera.id}`,
                    payload
                );

                setModalMessage(
                    "Camera updated successfully."
                );
            }

            // ------------------------------------------
            // ADD
            // ------------------------------------------

            else {
                await api.post(
                    "/cameras",
                    payload
                );

                setModalMessage(
                    "Camera added successfully."
                );
            }

            // Refresh camera list
            const response =
                await api.get("/cameras");

            setCameras(
                response.data?.data || []
            );

            // Close modal after success message
            setTimeout(() => {
                setShowModal(false);
                setModalMessage("");
                setEditingCamera(null);
            }, 1200);

        } catch (err) {
            console.error(
                "Save camera error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to save camera."
            );
        }
    };

    // ==================================================
    // DELETE CAMERA
    // ==================================================

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this camera?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            // Delete only once
            await api.delete(
                `/cameras/${id}`
            );

            setMessage(
                "Camera deleted successfully."
            );

            const response =
                await api.get("/cameras");

            setCameras(
                response.data?.data || []
            );

        } catch (err) {
            console.error(
                "Delete camera error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to delete camera."
            );
        }
    };

    // ==================================================
    // UI
    // ==================================================

    return (
        <div className="camera-page">

            {/* ========================================== */}
            {/* HEADER */}
            {/* ========================================== */}

            <div className="camera-page-header">

                <div>
                    <h1>
                        Camera Management
                    </h1>

                    <p>
                        Manage gameplay recording
                        cameras and assign them to
                        gaming stations.
                    </p>
                </div>

                {canManage && (
                    <button
                        className="camera-add-btn"
                        onClick={handleAdd}
                    >
                        <Plus size={18} />
                        Add Camera
                    </button>
                )}

            </div>

            {/* ========================================== */}
            {/* MAIN PAGE MESSAGES */}
            {/* ========================================== */}

            {!showModal && message && (
                <div className="camera-success">
                    {message}
                </div>
            )}

            {!showModal && error && (
                <div className="camera-error">
                    {error}
                </div>
            )}

            {/* ========================================== */}
            {/* STATS */}
            {/* ========================================== */}

            <div className="camera-stats">

                <div className="camera-stat-card">
                    <span>
                        Total Cameras
                    </span>

                    <strong>
                        {cameras.length}
                    </strong>
                </div>

                <div className="camera-stat-card">
                    <span>
                        Active
                    </span>

                    <strong>
                        {
                            cameras.filter(
                                (camera) =>
                                    camera.status ===
                                    "active"
                            ).length
                        }
                    </strong>
                </div>

                <div className="camera-stat-card">
                    <span>
                        Inactive
                    </span>

                    <strong>
                        {
                            cameras.filter(
                                (camera) =>
                                    camera.status ===
                                    "inactive"
                            ).length
                        }
                    </strong>
                </div>

                <div className="camera-stat-card">
                    <span>
                        Maintenance
                    </span>

                    <strong>
                        {
                            cameras.filter(
                                (camera) =>
                                    camera.status ===
                                    "maintenance"
                            ).length
                        }
                    </strong>
                </div>

            </div>

            {/* ========================================== */}
            {/* CAMERA TABLE */}
            {/* ========================================== */}

            <div className="camera-card">

                <div className="camera-card-header">

                    <div>
                        <h2>
                            All Cameras
                        </h2>

                        <span>
                            {cameras.length} camera
                            {cameras.length !== 1
                                ? "s"
                                : ""}
                        </span>
                    </div>

                </div>

                {loading ? (

                    <div className="camera-empty">
                        Loading cameras...
                    </div>

                ) : cameras.length === 0 ? (

                    <div className="camera-empty">

                        <h3>
                            No cameras found
                        </h3>

                        <p>
                            Add a camera to start
                            gameplay recording.
                        </p>

                    </div>

                ) : (

                    <div className="camera-table-wrapper">

                        <table className="camera-table">

                            <thead>
                                <tr>
                                    <th>
                                        Camera
                                    </th>

                                    <th>
                                        Code
                                    </th>

                                    <th>
                                        Gaming Station
                                    </th>

                                    <th>
                                        Type
                                    </th>

                                    <th>
                                        IP Address
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Location
                                    </th>

                                    {canManage && (
                                        <th>
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>

                                {cameras.map(
                                    (camera) => (
                                        <tr
                                            key={
                                                camera.id
                                            }
                                        >

                                            <td>
                                                <div className="camera-name">
                                                    {
                                                        camera.camera_name
                                                    }
                                                </div>
                                            </td>

                                            <td>
                                                {
                                                    camera.camera_code ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                {
                                                    camera.station_name ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                <span className="camera-type">
                                                    {
                                                        camera.camera_type
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    camera.ip_address ||
                                                    "—"
                                                }
                                            </td>

                                            <td>
                                                <span
                                                    className={`camera-status ${camera.status}`}
                                                >
                                                    {
                                                        camera.status
                                                    }
                                                </span>
                                            </td>

                                            <td>
                                                {
                                                    camera.location ||
                                                    "—"
                                                }
                                            </td>

                                            {canManage && (
                                                <td>

                                                    <div className="camera-actions">

                                                        {/* EDIT */}

                                                        <button
                                                            className="camera-edit-btn"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    camera
                                                                )
                                                            }
                                                            title="Edit"
                                                        >
                                                            <Pencil
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>

                                                        {/* DELETE */}

                                                        {canDelete && (
                                                            <button
                                                                className="camera-delete-btn"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        camera.id
                                                                    )
                                                                }
                                                                title="Delete"
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        16
                                                                    }
                                                                />
                                                            </button>
                                                        )}

                                                    </div>

                                                </td>
                                            )}

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {/* ========================================== */}
            {/* ADD / EDIT MODAL */}
            {/* ========================================== */}

            {showModal && (

                <div
                    className="camera-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="camera-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="camera-modal-header">

                            <div>

                                <h2>
                                    {editingCamera
                                        ? "Edit Camera"
                                        : "Add Camera"}
                                </h2>

                                <p>
                                    Configure gameplay
                                    recording camera.
                                </p>

                            </div>

                            <button
                                className="camera-close-btn"
                                onClick={closeModal}
                                disabled={
                                    !!modalMessage
                                }
                            >
                                <X size={20} />
                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            className="camera-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="camera-form-grid">

                                {/* CAMERA NAME */}

                                <div className="camera-form-group">

                                    <label>
                                        Camera Name *
                                    </label>

                                    <input
                                        type="text"
                                        name="camera_name"
                                        value={
                                            formData.camera_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. Laser Tag Camera 01"
                                        required
                                    />

                                </div>

                                {/* CAMERA CODE */}

                                <div className="camera-form-group">

                                    <label>
                                        Camera Code
                                    </label>

                                    <input
                                        type="text"
                                        name="camera_code"
                                        value={
                                            formData.camera_code
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="e.g. CAM-001"
                                    />

                                </div>

                                {/* GAMING STATION */}

                                <div className="camera-form-group">

                                    <label>
                                        Gaming Station *
                                    </label>

                                    <select
                                        name="gaming_station_id"
                                        value={
                                            formData.gaming_station_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select Station
                                        </option>

                                        {stations.map(
                                            (station) => (
                                                <option
                                                    key={
                                                        station.id
                                                    }
                                                    value={
                                                        station.id
                                                    }
                                                >
                                                    {
                                                        station.station_name
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* CAMERA TYPE */}

                                <div className="camera-form-group">

                                    <label>
                                        Camera Type
                                    </label>

                                    <select
                                        name="camera_type"
                                        value={
                                            formData.camera_type
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="fixed">
                                            Fixed
                                        </option>

                                        <option value="ptz">
                                            PTZ
                                        </option>

                                        <option value="webcam">
                                            Webcam
                                        </option>

                                    </select>

                                </div>

                                {/* IP ADDRESS */}

                                <div className="camera-form-group">

                                    <label>
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
                                        placeholder="192.168.1.101"
                                    />

                                </div>

                                {/* STATUS */}

                                <div className="camera-form-group">

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
                                    >

                                        <option value="active">
                                            Active
                                        </option>

                                        <option value="inactive">
                                            Inactive
                                        </option>

                                        <option value="maintenance">
                                            Maintenance
                                        </option>

                                    </select>

                                </div>

                                {/* LOCATION */}

                                <div className="camera-form-group">

                                    <label>
                                        Location
                                    </label>

                                    <input
                                        type="text"
                                        name="location"
                                        value={
                                            formData.location
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Laser Tag Area"
                                    />

                                </div>

                                {/* NOTES */}

                                <div className="camera-form-group camera-full-width">

                                    <label>
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
                                        placeholder="Camera details or recording notes..."
                                        rows="3"
                                    />

                                </div>

                            </div>

                            {/* ================================== */}
                            {/* MODAL MESSAGES */}
                            {/* ================================== */}

                            {modalMessage && (
                                <div className="camera-success">
                                    {modalMessage}
                                </div>
                            )}

                            {error && (
                                <div className="camera-error">
                                    {error}
                                </div>
                            )}

                            {/* FORM ACTIONS */}

                            <div className="camera-form-actions">

                                <button
                                    type="button"
                                    className="camera-cancel-btn"
                                    onClick={closeModal}
                                    disabled={
                                        !!modalMessage
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="camera-save-btn"
                                    disabled={
                                        !!modalMessage
                                    }
                                >
                                    {editingCamera
                                        ? "Update Camera"
                                        : "Add Camera"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Camera;
