import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Play, Square } from "lucide-react";

import api from "../api/axios";
import "../styles/GameSession.css";
import { isAdminOrStaff } from "../utils/auth";

function GameSession() {
    // ==================================================
    // USER / ROLE
    // ==================================================

    const canManage = isAdminOrStaff();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const role = user?.role_name || "Player";
    const isPlayer = role === "Player";

    // ==================================================
    // STATE
    // ==================================================

    // Sessions
    const [sessions, setSessions] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);

    // Messages
    const [message, setMessage] = useState("");
    const [startError, setStartError] = useState("");

    // Start Session
    const [showStart, setShowStart] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState("");
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [starting, setStarting] = useState(false);

    // Timer
    const [currentTime, setCurrentTime] = useState(null);

    // Session Details
    const [selected, setSelected] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Recording
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [recording, setRecording] = useState(null);

    // Prevent duplicate automatic end requests
    const endingSessionsRef = useRef(new Set());

    // ==================================================
    // FETCH SESSIONS
    // ==================================================

    const fetchSessions = useCallback(async () => {
        try {
            const res = await api
                .get("/game-session")
                .catch(() => api.get("/game-sessions"));

            let allSessions = [];

            if (res.data.success) {
                allSessions =
                    res.data.data ||
                    res.data.sessions ||
                    [];
            } else if (Array.isArray(res.data)) {
                allSessions = res.data;
            }

            // Player can see only their own sessions
            const visibleSessions = isPlayer
                ? allSessions.filter(
                    (session) =>
                        Number(session.user_id) ===
                        Number(user?.id)
                )
                : allSessions;

            setSessions(visibleSessions);
        } catch (err) {
            console.error("Fetch Sessions Error:", err);

            setMessage(
                err.response?.data?.message ||
                "Failed to load sessions"
            );
        }
    }, [isPlayer, user?.id]);

    // ==================================================
    // FETCH CONFIRMED BOOKINGS
    // ==================================================

    const fetchBookings = useCallback(async () => {
        try {
            setBookingsLoading(true);

            const [bookingRes, sessionRes] =
                await Promise.all([
                    api.get("/booking"),

                    api
                        .get("/game-session")
                        .catch(() =>
                            api.get("/game-sessions")
                        ),
                ]);

            const allSessions =
                sessionRes.data.success
                    ? sessionRes.data.data ||
                    sessionRes.data.sessions ||
                    []
                    : [];

            // Get booking IDs which already have active sessions
            const activeBookingIds = new Set(
                allSessions
                    .filter(
                        (session) =>
                            session.status === "active"
                    )
                    .map((session) =>
                        String(session.booking_id)
                    )
            );

            if (bookingRes.data.success) {
                const confirmedBookings =
                    (
                        bookingRes.data.bookings || []
                    ).filter(
                        (booking) =>
                            booking.status === "confirmed" &&
                            !activeBookingIds.has(
                                String(booking.id)
                            )
                    );

                setBookings(confirmedBookings);
            }
        } catch (err) {
            console.error(
                "Fetch Bookings Error:",
                err
            );

            setBookings([]);
        } finally {
            setBookingsLoading(false);
        }
    }, []);

    // ==================================================
    // FETCH CAMERAS
    // ==================================================

    const fetchCameras = useCallback(async () => {
        try {
            const res = await api.get("/cameras");

            if (res.data.success) {
                const activeCameras =
                    (res.data.data || []).filter(
                        (camera) =>
                            camera.status === "active"
                    );

                setCameras(activeCameras);
            }
        } catch (err) {
            console.error(
                "Fetch Cameras Error:",
                err
            );
        }
    }, []);

    // ==================================================
    // GET SESSION DETAILS
    // ==================================================

    const getById = useCallback(
        async (id) => {
            try {
                setDetailsLoading(true);
                setShowDetail(true);

                const res = await api
                    .get(`/game-session/${id}`)
                    .catch(() =>
                        api.get(`/game-sessions/${id}`)
                    );

                if (res.data.success) {
                    const sessionData =
                        res.data.data ||
                        res.data.session;

                    setSelected(sessionData);

                    // Load existing gameplay recording
                    setRecording(
                        sessionData?.recording || null
                    );

                    // Reset upload controls
                    setSelectedCameraId("");
                    setSelectedVideo(null);

                    // Cameras are only needed for Admin / Staff
                    if (canManage) {
                        await fetchCameras();
                    }
                }
            } catch (err) {
                console.error(
                    "Get Session Details Error:",
                    err
                );

                setMessage(
                    "Failed to load details"
                );
            } finally {
                setDetailsLoading(false);
            }
        },
        [canManage, fetchCameras]
    );

    // ==================================================
    // UPLOAD GAMEPLAY RECORDING
    // ==================================================

    const handleUploadRecording = async () => {
    if (!selected?.id) {
        setMessage("Session not selected");
        return;
    }

    if (!selectedCameraId) {
        setMessage("Please select a camera");
        return;
    }

    if (!selectedVideo) {
        setMessage("Please select a video file");
        return;
    }

    try {
        setUploadingVideo(true);
        setMessage("Uploading video...");

        const formData = new FormData();

        formData.append("video", selectedVideo);
        formData.append("session_id", selected.id);
        formData.append("camera_id", selectedCameraId);

        console.log("1. Starting video upload...");

        const res = await api.post(
            "/video-recordings/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        console.log("2. Upload API response:", res.data);

        if (res.data.success) {
            setMessage("Recording uploaded successfully");

            setRecording(res.data.data);

            setSelectedVideo(null);
            setSelectedCameraId("");

            console.log("3. Upload successful");

            await fetchSessions();

            console.log("4. Sessions refreshed");

            await getById(selected.id);

            console.log("5. Session details refreshed");
        } else {
            setMessage(
                res.data.message ||
                "Failed to upload recording"
            );
        }

    } catch (err) {
        console.error(
            "Upload Recording Error:",
            err
        );

        setMessage(
            err.response?.data?.message ||
            "Failed to upload recording"
        );
    } finally {
        console.log("6. Upload process finished");
        setUploadingVideo(false);
    }
};

    //handle generate QR CODE
    // ==================================================
// GENERATE QR CODE
// ==================================================

const handleGenerateQRCode = async () => {
    try {
        if (!selected?.id) {
            alert("Session ID not found");
            return;
        }

        if (!recording?.id) {
            alert("Video recording not found");
            return;
        }

        const response = await api.post(
            "/qr-codes/video",
            {
                session_id: selected.id,
                video_recording_id: recording.id,
            }
        );

        if (response.data.success) {
            const qrCode =
                response.data.data.qr_code;

            window.open(
                `/qr/${qrCode}`,
                "_blank"
            );
        } else {
            alert(
                response.data.message ||
                "Failed to generate QR code"
            );
        }

    } catch (error) {
        console.error(
            "Generate QR error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to generate QR code"
        );
    }
};

    // ==================================================
    // START SESSION
    // ==================================================

    const handleStart = async (e) => {
        e.preventDefault();

        if (!selectedBookingId) {
            setStartError(
                "Please select a booking."
            );
            return;
        }

        const booking = bookings.find(
            (item) =>
                String(item.id) ===
                String(selectedBookingId)
        );

        if (!booking) {
            setStartError(
                "Selected booking not found"
            );
            return;
        }

        try {
            setStarting(true);
            setStartError("");
            setMessage("");

            // Current date/time
            const now = new Date();

            const pad = (value) =>
                String(value).padStart(2, "0");

            const startTime =
                `${now.getFullYear()}-${pad(
                    now.getMonth() + 1
                )}-${pad(now.getDate())} ` +
                `${pad(now.getHours())}:${pad(
                    now.getMinutes()
                )}:${pad(now.getSeconds())}`;

            // Booking start time
            const startParts =
                String(
                    booking.start_time
                )
                    .substring(0, 8)
                    .split(":")
                    .map(Number);

            // Booking end time
            const endParts =
                String(
                    booking.end_time
                )
                    .substring(0, 8)
                    .split(":")
                    .map(Number);

            const startMinutes =
                startParts[0] * 60 +
                startParts[1];

            const endMinutes =
                endParts[0] * 60 +
                endParts[1];

            let durationMinutes =
                endMinutes -
                startMinutes;

            // Handle overnight booking
            if (durationMinutes < 0) {
                durationMinutes += 24 * 60;
            }

            const res = await api.post(
                "/game-session",
                {
                    user_id: booking.user_id,
                    game_id: booking.game_id,
                    station_id: booking.station_id,
                    booking_id: booking.id,

                    start_time: startTime,

                    duration_minutes:
                        durationMinutes,

                    amount:
                        booking.amount || 0,

                    status: "active",

                    recording_status:
                        "not_recorded",
                }
            );

            if (res.data.success) {
                setMessage(
                    "Game session started successfully"
                );

                setShowStart(false);
                setSelectedBookingId("");
                setStartError("");

                await Promise.all([
                    fetchSessions(),
                    fetchBookings(),
                ]);
            } else {
                setStartError(
                    res.data.message ||
                    "Failed to start session"
                );
            }
        } catch (err) {
            console.error(
                "Start Session Error:",
                err
            );

            setStartError(
                err.response?.data?.message ||
                "Failed to start game session"
            );
        } finally {
            setStarting(false);
        }
    };

    // ==================================================
    // END SESSION
    // ==================================================

    const handleEnd = async (session) => {
        const confirmEnd =
            window.confirm(
                `End Session #${session.id} for ${session.user_name}?`
            );

        if (!confirmEnd) {
            return;
        }

        try {
            setMessage("");

            const now = new Date();

            const pad = (value) =>
                String(value).padStart(2, "0");

            const endTime =
                `${now.getFullYear()}-${pad(
                    now.getMonth() + 1
                )}-${pad(now.getDate())} ` +
                `${pad(now.getHours())}:${pad(
                    now.getMinutes()
                )}:${pad(now.getSeconds())}`;

            const res = await api.put(
                `/game-session/${session.id}`,
                {
                    end_time: endTime,
                    status: "completed",
                }
            );

            if (res.data.success) {
                setMessage(
                    "Game session ended successfully"
                );

                await fetchSessions();
            } else {
                setMessage(
                    res.data.message ||
                    "Failed to end game session"
                );
            }
        } catch (err) {
            console.error(
                "End Session Error:",
                err
            );

            setMessage(
                err.response?.data?.message ||
                "Failed to end game session"
            );
        }
    };

    // ==================================================
    // GET REMAINING TIME
    // ==================================================

    const getRemainingTime = useCallback(
        (session) => {
            if (
                !session ||
                session.status !== "active" ||
                currentTime === null
            ) {
                return null;
            }

            const start = new Date(
                String(
                    session.start_time
                ).replace(" ", "T")
            ).getTime();

            if (Number.isNaN(start)) {
                return null;
            }

            const durationMinutes =
                Number(
                    session.duration_minutes ||
                    60
                );

            const end =
                start +
                durationMinutes *
                60 *
                1000;

            const remaining =
                Math.max(
                    0,
                    end - currentTime
                );

            return Math.floor(
                remaining / 1000
            );
        },
        [currentTime]
    );

    // ==================================================
    // FORMAT TIMER
    // ==================================================

    const formatTimer = (seconds) => {
        if (
            seconds === null ||
            seconds === undefined
        ) {
            return "--:--:--";
        }

        const hours =
            Math.floor(
                seconds / 3600
            );

        const minutes =
            Math.floor(
                (seconds % 3600) / 60
            );

        const secs =
            seconds % 60;

        return (
            `${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(secs).padStart(2, "0")}`
        );
    };

    // ==================================================
    // AUTOMATICALLY END EXPIRED SESSION
    // ==================================================

    const handleAutoEnd = useCallback(
        async (session) => {
            if (
                endingSessionsRef.current.has(
                    session.id
                )
            ) {
                return;
            }

            endingSessionsRef.current.add(
                session.id
            );

            try {
                const now = new Date();

                const pad = (value) =>
                    String(value).padStart(2, "0");

                const endTime =
                    `${now.getFullYear()}-${pad(
                        now.getMonth() + 1
                    )}-${pad(
                        now.getDate()
                    )} ` +
                    `${pad(
                        now.getHours()
                    )}:${pad(
                        now.getMinutes()
                    )}:${pad(
                        now.getSeconds()
                    )}`;

                const res = await api.put(
                    `/game-session/${session.id}`,
                    {
                        end_time: endTime,
                        status: "completed",
                    }
                );

                if (res.data.success) {
                    setMessage(
                        `Session #${session.id} ended automatically — time expired`
                    );

                    await fetchSessions();
                }
            } catch (err) {
                console.error(
                    "Auto End Session Error:",
                    err
                );

                endingSessionsRef.current.delete(
                    session.id
                );
            }
        },
        [fetchSessions]
    );

    // ==================================================
    // TIMER - UPDATE EVERY SECOND
    // ==================================================

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    // ==================================================
    // AUTOMATIC SESSION EXPIRY CHECK
    // ==================================================

    useEffect(() => {
        if (currentTime === null) {
            return;
        }

        sessions.forEach((session) => {
            if (session.status !== "active") {
                return;
            }

            const remaining =
                getRemainingTime(session);

            if (remaining === 0) {
                handleAutoEnd(session);
            }
        });
    }, [
        currentTime,
        sessions,
        getRemainingTime,
        handleAutoEnd,
    ]);

    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            await fetchSessions();

            setLoading(false);
        };

        load();
    }, [fetchSessions]);

    // ==================================================
    // FILTERED SESSIONS
    // ==================================================

    const filtered = sessions.filter(
        (session) =>
            (session.user_name || "")
                .toLowerCase()
                .includes(
                    filter.toLowerCase()
                ) ||
            (session.game_name || "")
                .toLowerCase()
                .includes(
                    filter.toLowerCase()
                )
    );

    // ==================================================
    // ACTIVE SESSION COUNT
    // ==================================================

    const active = sessions.filter(
        (session) =>
            session.status === "active"
    ).length;

    // ==================================================
    // CLOSE DETAILS MODAL
    // ==================================================

    const closeDetails = () => {
        setShowDetail(false);
        setSelected(null);
        setRecording(null);
        setSelectedCameraId("");
        setSelectedVideo(null);
    };

    // ==================================================
    // CLOSE START MODAL
    // ==================================================

    const closeStartModal = () => {
        setShowStart(false);
        setSelectedBookingId("");
        setStartError("");
    };

    // ==================================================
    // LOADING SCREEN
    // ==================================================

    if (loading) {
        return (
            <div className="game-session-page">
                <div className="game-session-loading">
                    <div className="loading-spinner"></div>

                    <p>
                        Loading game sessions...
                    </p>
                </div>
            </div>
        );
    }

    // ==================================================
    // MAIN UI
    // ==================================================

    return (
        <div className="game-session-page">

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="game-session-header">

                <div>
                    <h1>
                        {isPlayer
                            ? "My Game Sessions"
                            : "Game Sessions"}
                    </h1>

                    <p>
                        {sessions.length} sessions •{" "}
                        {active} active now •{" "}
                        {isPlayer
                            ? "View your gameplay sessions"
                            : "Monitor live gameplay"}
                    </p>
                </div>

                {canManage && (
                    <button
                        className="start-session-btn"
                        onClick={async () => {
                            setShowStart(true);
                            setStartError("");
                            setMessage("");

                            await fetchBookings();
                        }}
                    >
                        <Play size={14} />

                        Start Session
                    </button>
                )}
            </div>

            {/* ==================================================
                SEARCH
            ================================================== */}

            <div className="game-session-search-row">

                <label
                    htmlFor="session_search"
                    className="sr-only"
                >
                    Search player or game
                </label>

                <div className="game-session-search">

                    <Search size={16} />

                    <input
                        id="session_search"
                        name="session_search"
                        type="search"
                        placeholder="Search player, game..."
                        value={filter}
                        onChange={(e) =>
                            setFilter(
                                e.target.value
                            )
                        }
                    />
                </div>

                <span className="game-session-results">
                    {filtered.length} results
                </span>
            </div>

            {/* ==================================================
                MESSAGE
            ================================================== */}

            {message && (
                <div
                    className={`game-session-message ${
                        message
                            .toLowerCase()
                            .includes("successfully") ||
                        message
                            .toLowerCase()
                            .includes("automatically")
                            ? "success"
                            : ""
                    }`}
                >
                    {message}
                </div>
            )}

            {/* ==================================================
                SESSION LIST
            ================================================== */}

            <div className="game-session-list-section">

                <div className="section-header">

                    <h2>
                        {isPlayer
                            ? "My Sessions"
                            : "All Sessions"}
                    </h2>

                    <span className="session-count">
                        {filtered.length}
                    </span>
                </div>

                {filtered.length === 0 ? (

                    /* EMPTY STATE */

                    <div className="empty-game-sessions">

                        <div className="empty-icon">
                            🎮
                        </div>

                        <h3>
                            No Game Sessions
                        </h3>

                        <p>
                            {filter
                                ? "No sessions match your search."
                                : isPlayer
                                    ? "You have no game sessions yet."
                                    : "No game sessions are available."}
                        </p>
                    </div>

                ) : (

                    /* SESSION CARDS */

                    <div className="game-session-grid">

                        {filtered.map(
                            (sess) => (
                                <div
                                    className="game-session-item"
                                    key={sess.id}
                                >

                                    {/* CARD HEADER */}

                                    <div className="game-session-item-header">

                                        <span className="session-number">
                                            Session #{sess.id}
                                        </span>

                                        <span
                                            className={`session-status status-${
                                                sess.status ||
                                                "active"
                                            }`}
                                        >
                                            {sess.status ||
                                                "active"}
                                        </span>
                                    </div>

                                    {/* CARD DETAILS */}

                                    <div className="game-session-details">

                                        {/* TIMER */}

                                        {sess.status ===
                                            "active" && (
                                                <div className="session-timer-row">

                                                    <span>
                                                        Remaining Time
                                                    </span>

                                                    <strong>
                                                        {(() => {
                                                            const remaining =
                                                                getRemainingTime(
                                                                    sess
                                                                );

                                                            return remaining ===
                                                                0
                                                                ? "Time Expired"
                                                                : formatTimer(
                                                                    remaining
                                                                );
                                                        })()}
                                                    </strong>
                                                </div>
                                            )}

                                        {/* PLAYER */}

                                        <div className="session-detail-row">

                                            <span>
                                                Player
                                            </span>

                                            <strong>
                                                {sess.user_name ||
                                                    "-"}
                                            </strong>
                                        </div>

                                        {/* GAME */}

                                        <div className="session-detail-row">

                                            <span>
                                                Game
                                            </span>

                                            <strong>
                                                {sess.game_name ||
                                                    "-"}
                                            </strong>
                                        </div>

                                        {/* STATION */}

                                        <div className="session-detail-row">

                                            <span>
                                                Station
                                            </span>

                                            <strong>
                                                {sess.station_name ||
                                                    "-"}
                                            </strong>
                                        </div>

                                        {/* AMOUNT */}

                                        <div className="session-detail-row">

                                            <span>
                                                Amount
                                            </span>

                                            <strong>
                                                ₹
                                                {Number(
                                                    sess.amount ||
                                                    0
                                                ).toFixed(2)}

                                                {" • "}

                                                {sess.payment_status ||
                                                    "pending"}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* CARD FOOTER */}

                                    <div className="game-session-item-footer">

                                        <button
                                            className="view-session-btn"
                                            onClick={() =>
                                                getById(
                                                    sess.id
                                                )
                                            }
                                        >
                                            View Details
                                        </button>

                                        {canManage &&
                                            sess.status ===
                                            "active" && (
                                                <button
                                                    className="end-session-btn"
                                                    onClick={() =>
                                                        handleEnd(
                                                            sess
                                                        )
                                                    }
                                                    title="End Session"
                                                    aria-label="End Session"
                                                >
                                                    <Square
                                                        size={15}
                                                    />
                                                </button>
                                            )}
                                    </div>

                                </div>
                            )
                        )}

                    </div>
                )}
            </div>

            {/* ==================================================
                SESSION DETAILS MODAL
            ================================================== */}

            {showDetail && (
                <div
                    className="session-modal-overlay"
                    onClick={closeDetails}
                >
                    <div
                        className="session-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="session-modal-header">

                            <div>
                                <h2>
                                    Session #{selected?.id}
                                </h2>

                                <span>
                                    Complete session information
                                </span>
                            </div>

                            <button
                                className="session-modal-close"
                                onClick={closeDetails}
                            >
                                ×
                            </button>
                        </div>

                        {/* MODAL CONTENT */}

                        {detailsLoading ? (

                            <div
                                className="game-session-loading"
                                style={{
                                    minHeight: "200px",
                                }}
                            >
                                <div className="loading-spinner"></div>

                                <p>
                                    Loading...
                                </p>
                            </div>

                        ) : selected ? (

                            <div className="session-modal-body">

                                {/* PLAYER */}

                                <div className="session-detail-row">

                                    <span>
                                        Player
                                    </span>

                                    <strong>
                                        {selected.user_name ||
                                            "-"}
                                    </strong>
                                </div>

                                {/* GAME */}

                                <div className="session-detail-row">

                                    <span>
                                        Game
                                    </span>

                                    <strong>
                                        {selected.game_name ||
                                            "-"}
                                    </strong>
                                </div>

                                {/* STATION */}

                                <div className="session-detail-row">

                                    <span>
                                        Station
                                    </span>

                                    <strong>
                                        {selected.station_name ||
                                            "-"}
                                    </strong>
                                </div>

                                {/* STATUS */}

                                <div className="session-detail-row">

                                    <span>
                                        Status
                                    </span>

                                    <span
                                        className={`session-modal-status status-${selected.status}`}
                                    >
                                        {selected.status}
                                    </span>
                                </div>

                                {/* DURATION */}

                                <div className="session-detail-row">

                                    <span>
                                        Duration
                                    </span>

                                    <strong>
                                        {selected.duration_minutes
                                            ? `${selected.duration_minutes}m`
                                            : "-"}
                                    </strong>
                                </div>

                                {/* AMOUNT */}

                                <div className="session-detail-row">

                                    <span>
                                        Amount
                                    </span>

                                    <strong>
                                        ₹
                                        {Number(
                                            selected.amount ||
                                            0
                                        ).toFixed(2)}
                                    </strong>
                                </div>

                                {/* ==================================================
                                    GAMEPLAY RECORDING
                                ================================================== */}

                                {canManage &&
                                    selected.status ===
                                    "completed" && (

                                        <div
                                            style={{
                                                marginTop: "25px",
                                                paddingTop: "20px",
                                                borderTop:
                                                    "1px solid #ddd",
                                            }}
                                        >

                                            <h3
                                                style={{
                                                    marginBottom:
                                                        "15px",
                                                }}
                                            >
                                                Gameplay Recording
                                            </h3>

                                            {/* ======================================
                                                EXISTING RECORDING
                                            ====================================== */}

                                            {recording?.video_url ? (

                                                <div
                                                    style={{
                                                        marginTop:
                                                            "20px",
                                                    }}
                                                >

                                                    <h3>
                                                        Uploaded Recording
                                                    </h3>

                                                    <video
                                                        controls
                                                        style={{
                                                            width:
                                                                "100%",
                                                            maxWidth:
                                                                "700px",
                                                            marginTop:
                                                                "10px",
                                                            borderRadius:
                                                                "10px",
                                                        }}
                                                    >
                                                        <source
                                                            src={
                                                                recording.video_url
                                                            }
                                                            type="video/mp4"
                                                        />

                                                        Your browser does not support video playback.
                                                    </video>

                                                    <p
                                                        style={{
                                                            marginTop:
                                                                "8px",
                                                        }}
                                                    >
                                                        {recording.file_name ||
                                                            "Gameplay Recording"}
                                                    </p>

                                                    <p>
                                                        Duration:{" "}
                                                        {recording.duration_seconds
                                                            ? `${recording.duration_seconds} seconds`
                                                            : "-"}
                                                    </p>

                                                    {/* QR BUTTON WILL BE ADDED HERE */}

                                                    <button
                                                        className="start-session-btn"
                                                        style={{
                                                            marginTop:
                                                                "15px",
                                                        }}
                                                        onClick={handleGenerateQRCode}
                                                    >
                                                        Generate QR Code
                                                    </button>

                                                </div>

                                            ) : (

                                                /* ==================================
                                                    NO RECORDING -> UPLOAD FORM
                                                ================================== */

                                                <>

                                                    {/* CAMERA */}

                                                    <div className="form-group">

                                                        <label htmlFor="recording_camera">
                                                            Camera
                                                        </label>

                                                        <select
                                                            id="recording_camera"
                                                            value={
                                                                selectedCameraId
                                                            }
                                                            onChange={(e) =>
                                                                setSelectedCameraId(
                                                                    e.target.value
                                                                )
                                                            }
                                                        >

                                                            <option value="">
                                                                Select Camera
                                                            </option>

                                                            {cameras.map(
                                                                (
                                                                    camera
                                                                ) => (
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

                                                    {/* VIDEO FILE */}

                                                    <div className="form-group">

                                                        <label htmlFor="recording_video">
                                                            Video File
                                                        </label>

                                                        <input
                                                            id="recording_video"
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={(e) =>
                                                                setSelectedVideo(
                                                                    e
                                                                        .target
                                                                        .files?.[0] ||
                                                                    null
                                                                )
                                                            }
                                                        />

                                                    </div>

                                                    {/* UPLOAD BUTTON */}

                                                    <button
                                                        className="start-session-btn"
                                                        disabled={
                                                            uploadingVideo ||
                                                            !selectedCameraId ||
                                                            !selectedVideo
                                                        }
                                                        onClick={
                                                            handleUploadRecording
                                                        }
                                                    >
                                                        {uploadingVideo
                                                            ? "Uploading..."
                                                            : "Upload Recording"}
                                                    </button>

                                                </>
                                            )}

                                        </div>
                                    )}

                            </div>

                        ) : null}

                        {/* MODAL FOOTER */}

                        <div className="session-modal-footer">

                            <button
                                className="session-modal-close-btn"
                                onClick={closeDetails}
                            >
                                Close
                            </button>

                        </div>

                    </div>
                </div>
            )}

            {/* ==================================================
                START SESSION MODAL
            ================================================== */}

            {showStart && (
                <div
                    className="session-modal-overlay"
                    onClick={closeStartModal}
                >

                    <div
                        className="session-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="session-modal-header">

                            <div>

                                <h2>
                                    Start Game Session
                                </h2>

                                <span>
                                    Select a confirmed booking
                                    to start the session
                                </span>

                            </div>

                            <button
                                className="session-modal-close"
                                onClick={
                                    closeStartModal
                                }
                            >
                                ×
                            </button>

                        </div>

                        {/* MODAL BODY */}

                        <div className="session-modal-body">

                            {/* START ERROR */}

                            {startError && (
                                <div className="session-start-error">
                                    {startError}
                                </div>
                            )}

                            {/* LOADING */}

                            {bookingsLoading ? (

                                <div className="booking-loading-message">
                                    Loading bookings...
                                </div>

                            ) : bookings.length === 0 ? (

                                /* NO BOOKINGS */

                                <div
                                    className="empty-game-sessions"
                                    style={{
                                        padding: "30px",
                                    }}
                                >

                                    <h3>
                                        No Bookings
                                    </h3>

                                    <p>
                                        No confirmed bookings available.
                                    </p>

                                </div>

                            ) : (

                                /* BOOKING SELECTION */

                                <>

                                    <div className="form-group">

                                        <label htmlFor="booking_id">
                                            Select Booking
                                        </label>

                                        <select
                                            id="booking_id"
                                            name="booking_id"
                                            value={
                                                selectedBookingId
                                            }
                                            onChange={(e) =>
                                                setSelectedBookingId(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="">
                                                Choose booking
                                            </option>

                                            {bookings.map(
                                                (booking) => (
                                                    <option
                                                        key={
                                                            booking.id
                                                        }
                                                        value={
                                                            booking.id
                                                        }
                                                    >
                                                        #{booking.id} -{" "}
                                                        {
                                                            booking.game_name
                                                        }{" "}
                                                        -{" "}
                                                        {
                                                            booking.user_name
                                                        }
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>

                                    {/* SELECTED BOOKING DETAILS */}

                                    {selectedBookingId &&
                                        (() => {
                                            const booking =
                                                bookings.find(
                                                    (item) =>
                                                        String(
                                                            item.id
                                                        ) ===
                                                        String(
                                                            selectedBookingId
                                                        )
                                                );

                                            if (!booking) {
                                                return null;
                                            }

                                            return (
                                                <div className="selected-booking-details">

                                                    {/* PLAYER */}

                                                    <div className="session-detail-row">

                                                        <span>
                                                            Player
                                                        </span>

                                                        <strong>
                                                            {
                                                                booking.user_name
                                                            }
                                                        </strong>

                                                    </div>

                                                    {/* GAME */}

                                                    <div className="session-detail-row">

                                                        <span>
                                                            Game
                                                        </span>

                                                        <strong>
                                                            {
                                                                booking.game_name
                                                            }
                                                        </strong>

                                                    </div>

                                                    {/* STATION */}

                                                    <div className="session-detail-row">

                                                        <span>
                                                            Station
                                                        </span>

                                                        <strong>
                                                            {
                                                                booking.station_name
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>
                                            );
                                        })()}

                                </>
                            )}

                        </div>

                        {/* MODAL FOOTER */}

                        <div className="session-modal-footer">

                            <button
                                className="session-modal-close-btn"
                                onClick={
                                    closeStartModal
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="start-session-btn"
                                disabled={
                                    !selectedBookingId ||
                                    starting
                                }
                                onClick={
                                    handleStart
                                }
                            >
                                {starting
                                    ? "Starting..."
                                    : "Start Game"}
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default GameSession;