import { useEffect, useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Play,
} from "lucide-react";
import api from "../api/axios";
import "../styles/Recording.css";
import { isAdminOrStaff, isAdmin } from "../utils/auth";

function VideoRecording() {
    const canManage = isAdminOrStaff();
    const canDelete = isAdmin();

    const [recordings, setRecordings] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [cameras, setCameras] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editingRecording, setEditingRecording] = useState(null);

    const [loading, setLoading] = useState(false);

    // Main page message
    const [message, setMessage] = useState("");

    // Modal success message
    const [modalMessage, setModalMessage] = useState("");

    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        session_id: "",
        camera_id: "",
        file_name: "",
        file_path: "",
        cloudinary_url: "",
        cloudinary_public_id: "",
        file_size: "",
        duration_seconds: "",
        recording_status: "recording",
    });

    // =====================================================
    // LOAD INITIAL DATA
    // =====================================================

    useEffect(() => {
        let cancelled = false;

        const loadInitialData = async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    recordingResponse,
                    sessionResponse,
                    cameraResponse,
                ] = await Promise.all([
                    api.get("/video-recordings"),
                    api.get("/game-session"),
                    api.get("/cameras"),
                ]);

                if (cancelled) return;

                setRecordings(
                    recordingResponse.data?.data || []
                );

                setSessions(
                    sessionResponse.data?.data || []
                );

                setCameras(
                    cameraResponse.data?.data || []
                );
            } catch (err) {
                if (cancelled) return;

                console.error(
                    "Load recording data error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Failed to load recording data."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadInitialData();

        return () => {
            cancelled = true;
        };
    }, []);

    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (modalMessage) {
            setModalMessage("");
        }

        if (error) {
            setError("");
        }
    };

    // =====================================================
    // ADD RECORDING
    // =====================================================

    const handleAdd = () => {
        setEditingRecording(null);

        setFormData({
            session_id: "",
            camera_id: "",
            file_name: "",
            file_path: "",
            cloudinary_url: "",
            cloudinary_public_id: "",
            file_size: "",
            duration_seconds: "",
            recording_status: "recording",
        });

        setMessage("");
        setModalMessage("");
        setError("");

        setShowModal(true);
    };

    // =====================================================
    // EDIT RECORDING
    // =====================================================

    const handleEdit = (recording) => {
        setEditingRecording(recording);

        setFormData({
            session_id: recording.session_id || "",
            camera_id: recording.camera_id || "",
            file_name: recording.file_name || "",
            file_path: recording.file_path || "",
            cloudinary_url:
                recording.cloudinary_url || "",
            cloudinary_public_id:
                recording.cloudinary_public_id || "",
            file_size:
                recording.file_size ?? "",
            duration_seconds:
                recording.duration_seconds ?? "",
            recording_status:
                recording.recording_status || "recording",
        });

        setMessage("");
        setModalMessage("");
        setError("");

        setShowModal(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (modalMessage) return;

        setShowModal(false);
        setEditingRecording(null);
        setModalMessage("");
        setError("");
    };

    // =====================================================
    // SAVE RECORDING
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setModalMessage("");
        setError("");

        try {
            const payload = {
                session_id: Number(formData.session_id),
                camera_id: Number(formData.camera_id),

                file_name:
                    formData.file_name.trim(),

                file_path:
                    formData.file_path.trim() || null,

                cloudinary_url:
                    formData.cloudinary_url.trim() ||
                    null,

                cloudinary_public_id:
                    formData.cloudinary_public_id.trim() ||
                    null,

                file_size:
                    formData.file_size !== ""
                        ? Number(formData.file_size)
                        : null,

                duration_seconds:
                    formData.duration_seconds !== ""
                        ? Number(
                              formData.duration_seconds
                          )
                        : null,

                recording_status:
                    formData.recording_status,
            };

            if (editingRecording) {
                await api.put(
                    `/video-recordings/${editingRecording.id}`,
                    payload
                );

                setModalMessage(
                    "Recording updated successfully."
                );
            } else {
                await api.post(
                    "/video-recordings",
                    payload
                );

                setModalMessage(
                    "Recording added successfully."
                );
            }

            // Refresh recordings
            const response = await api.get(
                "/video-recordings"
            );

            setRecordings(
                response.data?.data || []
            );

            // Close after success message
            setTimeout(() => {
                setShowModal(false);
                setModalMessage("");
                setEditingRecording(null);
            }, 1200);
        } catch (err) {
            console.error(
                "Save recording error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to save recording."
            );
        }
    };

    // =====================================================
    // DELETE RECORDING
    // =====================================================

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this recording?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setMessage("");

            await api.delete(
                `/video-recordings/${id}`
            );

            setMessage(
                "Recording deleted successfully."
            );

            const response = await api.get(
                "/video-recordings"
            );

            setRecordings(
                response.data?.data || []
            );
        } catch (err) {
            console.error(
                "Delete recording error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to delete recording."
            );
        }
    };

    // =====================================================
    // PLAY RECORDING
    // =====================================================

    const handlePlay = (url) => {
        if (!url) {
            setError(
                "Video URL is not available."
            );
            return;
        }

        window.open(url, "_blank");
    };

    // =====================================================
    // HELPERS
    // =====================================================

    const getStatusClass = (status) => {
        return `recording-status ${status}`;
    };

    const formatDuration = (seconds) => {
        if (
            seconds === null ||
            seconds === undefined ||
            seconds === ""
        ) {
            return "—";
        }

        const totalSeconds = Number(seconds);

        if (Number.isNaN(totalSeconds)) {
            return "—";
        }

        const minutes = Math.floor(
            totalSeconds / 60
        );

        const remainingSeconds =
            totalSeconds % 60;

        return `${minutes}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    const formatFileSize = (size) => {
        if (
            size === null ||
            size === undefined ||
            size === ""
        ) {
            return "—";
        }

        const bytes = Number(size);

        if (Number.isNaN(bytes)) {
            return "—";
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;
        }

        if (bytes < 1024 * 1024 * 1024) {
            return `${(
                bytes /
                (1024 * 1024)
            ).toFixed(1)} MB`;
        }

        return `${(
            bytes /
            (1024 * 1024 * 1024)
        ).toFixed(1)} GB`;
    };

    // =====================================================
    // STATS
    // =====================================================

    const totalRecordings =
        recordings.length;

    const recordingCount =
        recordings.filter(
            (item) =>
                item.recording_status ===
                "recording"
        ).length;

    const completedCount =
        recordings.filter(
            (item) =>
                item.recording_status ===
                "completed"
        ).length;

    const failedCount =
        recordings.filter(
            (item) =>
                item.recording_status ===
                "failed"
        ).length;

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="recording-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="recording-page-header">

                <div>
                    <h1>
                        Video Recordings
                    </h1>

                    <p>
                        Manage and view gameplay
                        video recordings.
                    </p>
                </div>

                {canManage && (
                    <button
                        className="recording-add-btn"
                        onClick={handleAdd}
                    >
                        <Plus size={18} />
                        Add Recording
                    </button>
                )}

            </div>

            {/* =================================================
                PAGE MESSAGES
            ================================================= */}

            {!showModal && message && (
                <div className="recording-success">
                    {message}
                </div>
            )}

            {!showModal && error && (
                <div className="recording-error">
                    {error}
                </div>
            )}

            {/* =================================================
                STATS
            ================================================= */}

            <div className="recording-stats">

                <div className="recording-stat-card">
                    <span>
                        Total Recordings
                    </span>

                    <strong>
                        {totalRecordings}
                    </strong>
                </div>

                <div className="recording-stat-card">
                    <span>
                        Recording
                    </span>

                    <strong>
                        {recordingCount}
                    </strong>
                </div>

                <div className="recording-stat-card">
                    <span>
                        Completed
                    </span>

                    <strong>
                        {completedCount}
                    </strong>
                </div>

                <div className="recording-stat-card">
                    <span>
                        Failed
                    </span>

                    <strong>
                        {failedCount}
                    </strong>
                </div>

            </div>

            {/* =================================================
                RECORDING TABLE
            ================================================= */}

            <div className="recording-card">

                <div className="recording-card-header">

                    <div>
                        <h2>
                            All Recordings
                        </h2>

                        <span>
                            {recordings.length}{" "}
                            recording
                            {recordings.length !==
                            1
                                ? "s"
                                : ""}
                        </span>
                    </div>

                </div>

                {loading ? (
                    <div className="recording-empty">
                        Loading recordings...
                    </div>
                ) : recordings.length === 0 ? (
                    <div className="recording-empty">

                        <h3>
                            No recordings found
                        </h3>

                        <p>
                            Gameplay recordings
                            will appear here.
                        </p>

                    </div>
                ) : (
                    <div className="recording-table-wrapper">

                        <table className="recording-table">

                            <thead>

                                <tr>
                                    <th>
                                        Player
                                    </th>

                                    <th>
                                        Game
                                    </th>

                                    <th>
                                        Station
                                    </th>

                                    <th>
                                        Camera
                                    </th>

                                    <th>
                                        File
                                    </th>

                                    <th>
                                        Duration
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Recorded At
                                    </th>

                                    <th>
                                        Actions
                                    </th>
                                </tr>

                            </thead>

                            <tbody>

                                {recordings.map(
                                    (recording) => (
                                        <tr
                                            key={
                                                recording.id
                                            }
                                        >

                                            {/* PLAYER */}

                                            <td>
                                                <div className="recording-player">
                                                    {recording.player_name ||
                                                        "—"}
                                                </div>
                                            </td>

                                            {/* GAME */}

                                            <td>
                                                {recording.game_name ||
                                                    "—"}
                                            </td>

                                            {/* STATION */}

                                            <td>
                                                {recording.station_name ||
                                                    "—"}
                                            </td>

                                            {/* CAMERA */}

                                            <td>
                                                <div className="recording-camera">

                                                    <span>
                                                        {recording.camera_name ||
                                                            "—"}
                                                    </span>

                                                    {recording.camera_code && (
                                                        <small>
                                                            {
                                                                recording.camera_code
                                                            }
                                                        </small>
                                                    )}

                                                </div>
                                            </td>

                                            {/* FILE */}

                                            <td>
                                                <div className="recording-file">

                                                    <span>
                                                        {recording.file_name ||
                                                            "—"}
                                                    </span>

                                                    <small>
                                                        {formatFileSize(
                                                            recording.file_size
                                                        )}
                                                    </small>

                                                </div>
                                            </td>

                                            {/* DURATION */}

                                            <td>
                                                {formatDuration(
                                                    recording.duration_seconds
                                                )}
                                            </td>

                                            {/* STATUS */}

                                            <td>
                                                <span
                                                    className={getStatusClass(
                                                        recording.recording_status
                                                    )}
                                                >
                                                    {
                                                        recording.recording_status
                                                    }
                                                </span>
                                            </td>

                                            {/* RECORDED AT */}

                                            <td>
                                                {recording.recorded_at
                                                    ? new Date(
                                                          recording.recorded_at
                                                      ).toLocaleString()
                                                    : "—"}
                                            </td>

                                            {/* ACTIONS */}

                                            <td>

                                                <div className="recording-actions">

                                                    {/* PLAY
                                                        Admin / Staff / Player
                                                    */}

                                                    {recording.cloudinary_url && (
                                                        <button
                                                            type="button"
                                                            className="recording-view-btn"
                                                            onClick={() =>
                                                                handlePlay(
                                                                    recording.cloudinary_url
                                                                )
                                                            }
                                                            title="Play Recording"
                                                        >
                                                            <Play
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>
                                                    )}

                                                    {/* EDIT
                                                        Admin / Staff only
                                                    */}

                                                    {canManage && (
                                                        <button
                                                            type="button"
                                                            className="recording-edit-btn"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    recording
                                                                )
                                                            }
                                                            title="Edit Recording"
                                                        >
                                                            <Pencil
                                                                size={
                                                                    16
                                                                }
                                                            />
                                                        </button>
                                                    )}

                                                    {/* DELETE
                                                        Admin only
                                                    */}

                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            className="recording-delete-btn"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    recording.id
                                                                )
                                                            }
                                                            title="Delete Recording"
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

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>
                )}

            </div>

            {/* =================================================
                ADD / EDIT MODAL
            ================================================= */}

            {showModal && (
                <div
                    className="recording-modal-overlay"
                    onClick={closeModal}
                >

                    <div
                        className="recording-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="recording-modal-header">

                            <div>

                                <h2>
                                    {editingRecording
                                        ? "Edit Recording"
                                        : "Add Recording"}
                                </h2>

                                <p>
                                    Configure gameplay
                                    recording details.
                                </p>

                            </div>

                            <button
                                type="button"
                                className="recording-close-btn"
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
                            className="recording-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="recording-form-grid">

                                {/* GAME SESSION */}

                                <div className="recording-form-group">

                                    <label>
                                        Game Session *
                                    </label>

                                    <select
                                        name="session_id"
                                        value={
                                            formData.session_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select Session
                                        </option>

                                        {sessions.map(
                                            (session) => (
                                                <option
                                                    key={
                                                        session.id
                                                    }
                                                    value={
                                                        session.id
                                                    }
                                                >
                                                    Session #
                                                    {
                                                        session.id
                                                    }{" "}
                                                    -{" "}
                                                    {session.game_name ||
                                                        `Game ${session.game_id}`}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* CAMERA */}

                                <div className="recording-form-group">

                                    <label>
                                        Camera *
                                    </label>

                                    <select
                                        name="camera_id"
                                        value={
                                            formData.camera_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            Select Camera
                                        </option>

                                        {cameras.map(
                                            (camera) => (
                                                <option
                                                    key={
                                                        camera.id
                                                    }
                                                    value={
                                                        camera.id
                                                    }
                                                >
                                                    {
                                                        camera.camera_name
                                                    }
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* FILE NAME */}

                                <div className="recording-form-group">

                                    <label>
                                        File Name *
                                    </label>

                                    <input
                                        type="text"
                                        name="file_name"
                                        value={
                                            formData.file_name
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="gameplay_001.mp4"
                                        required
                                    />

                                </div>

                                {/* STATUS */}

                                <div className="recording-form-group">

                                    <label>
                                        Recording Status
                                    </label>

                                    <select
                                        name="recording_status"
                                        value={
                                            formData.recording_status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="recording">
                                            Recording
                                        </option>

                                        <option value="completed">
                                            Completed
                                        </option>

                                        <option value="failed">
                                            Failed
                                        </option>

                                    </select>

                                </div>

                                {/* FILE PATH */}

                                <div className="recording-form-group">

                                    <label>
                                        File Path
                                    </label>

                                    <input
                                        type="text"
                                        name="file_path"
                                        value={
                                            formData.file_path
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="/recordings/gameplay_001.mp4"
                                    />

                                </div>

                                {/* CLOUDINARY URL */}

                                <div className="recording-form-group">

                                    <label>
                                        Cloudinary URL
                                    </label>

                                    <input
                                        type="text"
                                        name="cloudinary_url"
                                        value={
                                            formData.cloudinary_url
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="https://res.cloudinary.com/..."
                                    />

                                </div>

                                {/* CLOUDINARY PUBLIC ID */}

                                <div className="recording-form-group">

                                    <label>
                                        Cloudinary Public ID
                                    </label>

                                    <input
                                        type="text"
                                        name="cloudinary_public_id"
                                        value={
                                            formData.cloudinary_public_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="gamezone/gameplay_001"
                                    />

                                </div>

                                {/* FILE SIZE */}

                                <div className="recording-form-group">

                                    <label>
                                        File Size (bytes)
                                    </label>

                                    <input
                                        type="number"
                                        name="file_size"
                                        value={
                                            formData.file_size
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="0"
                                        placeholder="10485760"
                                    />

                                </div>

                                {/* DURATION */}

                                <div className="recording-form-group">

                                    <label>
                                        Duration (seconds)
                                    </label>

                                    <input
                                        type="number"
                                        name="duration_seconds"
                                        value={
                                            formData.duration_seconds
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        min="0"
                                        placeholder="120"
                                    />

                                </div>

                            </div>

                            {/* MODAL MESSAGE */}

                            {modalMessage && (
                                <div className="recording-success">
                                    {modalMessage}
                                </div>
                            )}

                            {error && (
                                <div className="recording-error">
                                    {error}
                                </div>
                            )}

                            {/* FORM ACTIONS */}

                            <div className="recording-form-actions">

                                <button
                                    type="button"
                                    className="recording-cancel-btn"
                                    onClick={
                                        closeModal
                                    }
                                    disabled={
                                        !!modalMessage
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="recording-save-btn"
                                    disabled={
                                        !!modalMessage
                                    }
                                >
                                    {editingRecording
                                        ? "Update Recording"
                                        : "Add Recording"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}

        </div>
    );
}

export default VideoRecording;