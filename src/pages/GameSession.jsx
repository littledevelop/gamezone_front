import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Play, Square } from "lucide-react";

import api from "../api/axios";
import "../styles/GameSession.css";
import { isAdminOrStaff } from "../utils/auth";
import GameSessionStartModal from "../components/game-session/GameSessionStartModal";
import GameSessionDetailModal from "../components/game-session/GameSessionDetailModal";


const CAMERA_SERVICE_URL = "http://localhost:6100";

function GameSession() {
    // =========================================================
    // USER / ROLE
    // =========================================================

    const canManage = isAdminOrStaff();

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const role = user?.role_name || "Player";
    const isPlayer = role === "Player";

    // =========================================================
    // SESSIONS
    // =========================================================

    const [sessions, setSessions] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const manualEndingSessionsRef = useRef(new Set());
    // =========================================================
    // MESSAGES
    // =========================================================

    const [message, setMessage] = useState("");
    const [startError, setStartError] = useState("");

    // =========================================================
    // START SESSION
    // =========================================================

    const [showStart, setShowStart] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState("");
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [starting, setStarting] = useState(false);

    // =========================================================
    // TIMER
    // =========================================================

    const [currentTime, setCurrentTime] = useState(null);

    // =========================================================
    // SESSION DETAILS
    // =========================================================

    const [selected, setSelected] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // =========================================================
    // RECORDING
    // =========================================================

    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [recording, setRecording] = useState(null);

    // =========================================================
    // PREVENT DUPLICATE AUTO END REQUESTS
    // =========================================================

    const endingSessionsRef = useRef(new Set());

    // =========================================================
    // FETCH SESSIONS
    // =========================================================

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

            const visibleSessions = isPlayer
                ? allSessions.filter(
                    (session) =>
                        Number(session.user_id) ===
                        Number(user?.id)
                )
                : allSessions;

            setSessions(visibleSessions);
        } catch (err) {
            console.error(
                "Fetch Sessions Error:",
                err
            );

            setMessage(
                err.response?.data?.message ||
                "Failed to load sessions"
            );
        }
    }, [isPlayer, user?.id]);

    // =========================================================
    // FETCH CONFIRMED BOOKINGS
    // =========================================================

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
                            booking.status ===
                            "confirmed" &&
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

    // =========================================================
    // FETCH CAMERAS
    // =========================================================

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

    // =========================================================
    // GET SESSION DETAILS
    // =========================================================

    const getById = useCallback(
        async (id) => {
            try {
                setDetailsLoading(true);
                setShowDetail(true);

                const res = await api
                    .get(`/game-session/${id}`)
                    .catch(() =>
                        api.get(
                            `/game-sessions/${id}`
                        )
                    );

                if (res.data.success) {
                    const sessionData =
                        res.data.data ||
                        res.data.session;

                    setSelected(sessionData);

                    setRecording(
                        sessionData?.recording ||
                        null
                    );

                    setSelectedCameraId("");
                    setSelectedVideo(null);

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

    // =========================================================
    // UPLOAD GAMEPLAY RECORDING
    // =========================================================

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

            formData.append(
                "video",
                selectedVideo
            );

            formData.append(
                "session_id",
                selected.id
            );

            formData.append(
                "camera_id",
                selectedCameraId
            );

            const res = await api.post(
                "/video-recordings/upload",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );

            if (res.data.success) {
                setMessage(
                    "Recording uploaded successfully"
                );

                setRecording(res.data.data);

                setSelectedVideo(null);
                setSelectedCameraId("");

                await fetchSessions();

                await getById(selected.id);
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
            setUploadingVideo(false);
        }
    };

    // =========================================================
    // GENERATE QR CODE
    // =========================================================

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
                    video_recording_id:
                        recording.id,
                }
            );

            if (response.data.success) {
                alert(
                    "QR code generated successfully. QR Display will update automatically."
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

    // =========================================================
    // START SESSION
    // =========================================================

    const handleStart = async () => {
        if (!selectedBookingId) {
            setStartError("Please select a booking.");
            return;
        }

        setStarting(true);
        setStartError("");
        setMessage("");

        let sessionId = null;

        try {
            // -------------------------------------------------
            // FIND SELECTED BOOKING
            // -------------------------------------------------

            const selectedBooking = bookings.find(
                (booking) =>
                    Number(booking.id) ===
                    Number(selectedBookingId)
            );

            if (!selectedBooking) {
                throw new Error("Selected booking not found.");
            }

            // -------------------------------------------------
            // START TIME
            // -------------------------------------------------

            const startTime = new Date();

            // Convert to MySQL DATETIME
            const mysqlStartTime =
                `${startTime.getFullYear()}-` +
                `${String(startTime.getMonth() + 1).padStart(2, "0")}-` +
                `${String(startTime.getDate()).padStart(2, "0")} ` +
                `${String(startTime.getHours()).padStart(2, "0")}:` +
                `${String(startTime.getMinutes()).padStart(2, "0")}:` +
                `${String(startTime.getSeconds()).padStart(2, "0")}`;

            // -------------------------------------------------
            // CREATE GAME SESSION
            // -------------------------------------------------

            const res = await api.post(
                "/game-session",
                {
                    user_id: selectedBooking.user_id,
                    game_id: selectedBooking.game_id,
                    station_id: selectedBooking.station_id,
                    booking_id: selectedBooking.id,
                    start_time: mysqlStartTime,
                    duration_minutes:
                        selectedBooking.duration_minutes ??
                        selectedBooking.duration ??
                        0,
                    amount: selectedBooking.amount ?? 0,
                    status: "active",
                    recording_status: "not_recorded"
                }
            );

            if (!res.data?.success) {
                throw new Error(
                    res.data?.message ||
                    "Game session could not be created."
                );
            }

            sessionId = res.data.gameSession_id;

            if (!sessionId) {
                throw new Error(
                    "Game session ID was not returned by the server."
                );
            }

            console.log(
                "GAME SESSION CREATED:",
                sessionId
            );

            // -------------------------------------------------
            // START CAMERA RECORDING
            // -------------------------------------------------

            try {
                await startCameraRecording({
                    sessionId,
                    gameId: selectedBooking.game_id,
                    playerName:
                        selectedBooking.user_name ||
                        selectedBooking.player_name ||
                        selectedBooking.full_name ||
                        "Player",
                    gameName:
                        selectedBooking.game_name ||
                        "Game"
                });

                // -------------------------------------------------
                // CAMERA STARTED SUCCESSFULLY
                // -------------------------------------------------

                setMessage(
                    "Game session and camera recording started successfully"
                );

                setShowStart(false);
                setSelectedBookingId("");

                await fetchSessions();
                await fetchBookings();

            } catch (cameraError) {

                console.error(
                    "CAMERA START ERROR:",
                    cameraError
                );

                // -------------------------------------------------
                // STOP ANY CAMERA RECORDING THAT MAY HAVE STARTED
                // -------------------------------------------------

                try {
                    await stopCameraRecording(sessionId);
                } catch (stopError) {
                    console.error(
                        "CAMERA CLEANUP ERROR:",
                        stopError
                    );
                }

                // -------------------------------------------------
                // CANCEL GAME SESSION
                // -------------------------------------------------

                try {
                    const cancelRes = await api.put(
                        `/game-session/${sessionId}`,
                        {
                            status: "cancelled",
                            end_time: mysqlStartTime,
                            recording_status: "not_recorded"
                        }
                    );



                    if (
                        !cancelRes.data ||
                        cancelRes.data.success !== true
                    ) {
                        console.error(
                            "Backend could not cancel the game session:",
                            cancelRes.data
                        );

                        setStartError(
                            cancelRes.data &&
                                cancelRes.data.message
                                ? cancelRes.data.message
                                : "Backend could not cancel the game session."
                        );

                        await fetchSessions();
                        return;
                    }





                    console.log(
                        "SESSION CANCELLED:",
                        sessionId
                    );




                } catch (cancelError) {
                    console.error(
                        "SESSION CANCELLATION FAILED - FULL ERROR:",
                        cancelError
                    );

                    console.error(
                        "HTTP STATUS:",
                        cancelError.response
                            ? cancelError.response.status
                            : "No HTTP response"
                    );

                    console.error(
                        "BACKEND RESPONSE:",
                        cancelError.response
                            ? cancelError.response.data
                            : "No backend response"
                    );

                    console.error(
                        "ERROR MESSAGE:",
                        cancelError.message
                    );




                    setStartError(
                        "Camera recording failed, and the session could not be cancelled. Please refresh and check the session status."
                    );

                    await fetchSessions();
                    return;
                }

                // -------------------------------------------------
                // CAMERA FAILED BUT SESSION CANCELLED
                // -------------------------------------------------

                setStartError(
                    cameraError.message ||
                    "Camera recording could not start. Game session was cancelled."
                );

                await fetchSessions();
                await fetchBookings();

                return;
            }

        } catch (error) {

            console.error(
                "START GAME SESSION ERROR:",
                error.response?.data ||
                error.message
            );

            setStartError(
                error.response?.data?.message ||
                error.message ||
                "Unable to start game session."
            );

            // -------------------------------------------------
            // IF SESSION WAS CREATED BUT SOMETHING FAILED
            // -------------------------------------------------

            if (sessionId) {
                try {
                    await api.put(
                        `/game-session/${sessionId}`,
                        {
                            status: "cancelled",
                            recording_status: "not_recorded"
                        }
                    );

                    console.log(
                        "FAILED START SESSION CANCELLED:",
                        sessionId
                    );

                } catch (cancelError) {
                    console.error(
                        "FAILED START SESSION CANCELLATION ERROR:",
                        cancelError.response?.data ||
                        cancelError.message
                    );
                }
            }

            await fetchSessions();
            await fetchBookings();

        } finally {
            setStarting(false);
        }
    };


    // =========================================================
    // START CAMERA RECORDING
    // =========================================================

    const startCameraRecording = async ({
        sessionId,
        playerName,
        gameName,
        gameId,
    }) => {
        try {
            console.log(
                "START CAMERA DATA:",
                {
                    sessionId,
                    playerName,
                    gameName,
                    gameId,
                }
            );

            // =================================================
            // VALIDATE GAME ID
            // =================================================

            if (!gameId) {
                throw new Error(
                    "Game ID is missing."
                );
            }

            // =================================================
            // GET CAMERAS ASSIGNED TO GAME
            // =================================================

            const cameraResponse =
                await api.get(
                    `/game-cameras/game/${gameId}`
                );

            console.log(
                "GAME CAMERA API RESPONSE:",
                cameraResponse.data
            );

            if (
                !cameraResponse.data.success ||
                !Array.isArray(
                    cameraResponse.data.data
                )
            ) {
                throw new Error(
                    "Failed to get cameras assigned to the game."
                );
            }

            const assignedCameras =
                cameraResponse.data.data;

            // =================================================
            // CAMERA IS COMPULSORY
            // =================================================

            if (
                assignedCameras.length === 0
            ) {
                throw new Error(
                    `No active cameras are assigned to game ${gameId}.`
                );
            }

            console.log(
                "Assigned Cameras:",
                assignedCameras
            );

            const startedCameras = [];

            // =================================================
            // START EVERY ASSIGNED CAMERA
            // =================================================

            for (
                let index = 0;
                index <
                assignedCameras.length;
                index++
            ) {
                const camera =
                    assignedCameras[index];

                /*
                 * TEMPORARY CAMERA SERVICE ID
                 *
                 * This will be replaced with the
                 * actual physical camera mapping
                 * in the next step.
                 */
                const cameraId = `camera_${index + 1}`;

                const databaseCameraId = Number(
                    camera.camera_id ?? camera.id
                );

                if (!Number.isInteger(databaseCameraId) ||
                    databaseCameraId <= 0) {
                    throw new Error(
                        `Invalid database camera ID for ${camera.camera_name}.`
                    );
                }
                console.log(
                    `Starting ${camera.camera_name} as ${cameraId}`
                );

                let response;

                try {
                    console.log("camera network error");
                    response =
                        await fetch(
                            `${CAMERA_SERVICE_URL}/camera/start`,
                            {
                                method:
                                    "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",
                                },

                                body:
                                    JSON.stringify(
                                        {
                                            sessionId,

                                            playerName,

                                            gameName,

                                            cameraId,
                                            databaseCameraId,
                                        }
                                    ),
                            }
                        );
                } catch (networkError) {
                    console.error(
                        "Camera Service Network Error:",
                        networkError
                    );

                    throw new Error(
                        `Camera service is not running. Please start the camera service on port 6100.`,
                        {
                            cause: networkError,
                        }
                    );
                }

                // =================================================
                // HANDLE NON-JSON / EMPTY RESPONSE
                // =================================================

                let data;

                try {
                    data =
                        await response.json();
                } catch (
                jsonError
                ) {
                    console.error(
                        "Invalid camera service response:",
                        jsonError
                    );

                    throw new Error(
                        "Camera service returned an invalid response.",
                        {
                            cause: jsonError,
                        }
                    );
                }

                console.log(
                    `Camera Service Response (${cameraId}):`,
                    data
                );

                // =================================================
                // CAMERA START FAILED
                // =================================================

                if (
                    !response.ok ||
                    !data.success
                ) {
                    throw new Error(
                        data.message ||
                        `Failed to start camera recording for ${camera.camera_name}.`
                    );
                }

                // =================================================
                // CAMERA START SUCCESS
                // =================================================
                startedCameras.push({
                    databaseCameraId,
                    cameraId,
                    cameraName: camera.camera_name,
                });
                console.log(
                    `Camera started successfully: ${camera.camera_name} → ${cameraId}`
                );
            }

            // =================================================
            // VERIFY ALL CAMERAS STARTED
            // =================================================

            if (
                startedCameras.length !==
                assignedCameras.length
            ) {
                throw new Error(
                    "Not all assigned cameras were started."
                );
            }

            console.log(
                "ALL ASSIGNED CAMERAS STARTED:",
                startedCameras
            );

            return {
                success: true,
                cameras: startedCameras,
            };
        } catch (error) {
            console.error(
                "Camera Start Error:",
                error || "Failed to start the camera"
            );

            // IMPORTANT:
            // Re-throw the error so handleStart()
            // can cancel the game session.

            throw error;
        }
    };

    // =========================================================
    // STOP CAMERA RECORDING
    // =========================================================

    const stopCameraRecording = async (sessionId) => {
        try {
            console.log(
                "STOP CAMERA REQUEST FOR SESSION:",
                sessionId
            );

            const response = await fetch(
                `${CAMERA_SERVICE_URL}/camera/stop-session`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        sessionId,
                    }),
                }
            );

            let data;

            try {
                data = await response.json();
            } catch (jsonError) {
                console.error(
                    "Camera stop invalid response:",
                    jsonError
                );

                const error = new Error(
                    "Camera service returned an invalid response."
                );

                error.cause = jsonError;
                throw error;
            }

            console.log(
                "STOP CAMERA RESPONSE:",
                data
            );

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Camera recording could not be stopped."
                );
            }

            return {
                success: true,
                stopped:
                    data.stoppedCameras || [],
            };

        } catch (error) {
            console.error(
                "Camera Stop Error:",
                error
            );

            return {
                success: false,
                stopped: [],
                message:
                    error.message ||
                    "Camera recording could not be stopped."
            };
        }
    };

    // =========================================================
    // END SESSION
    // =========================================================


    const handleEnd = async (session) => {
        // Prevent duplicate clicks for the same session
        if (manualEndingSessionsRef.current.has(session.id)) {
            console.log("End Session already in progress:", session.id);
            return;
        }

        manualEndingSessionsRef.current.add(session.id);

        try {
            const confirmEnd = window.confirm(
                `End Session #${session.id} for ${session.user_name}?`
            );

            if (!confirmEnd) {
                return;
            }

            setMessage("");

            const now = new Date();
            const pad = (value) => String(value).padStart(2, "0");

            const endTime =
                `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
                `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            const res = await api.put(`/game-session/${session.id}`, {
                end_time: endTime,
                status: "completed",
            });

            if (!res.data.success) {
                setMessage(res.data.message || "Failed to end game session");
                return;
            }

            // Stop the camera once and report its result separately
            try {
                const cameraResult = await stopCameraRecording(session.id);

                if (cameraResult.success) {
                    setMessage(
                        "Game session and camera recording ended successfully"
                    );
                } else {
                    setMessage(
                        "Game session ended, but camera recording could not be stopped"
                    );
                }
            } catch (cameraError) {
                console.error("Camera Stop Error:", cameraError);

                setMessage(
                    "Game session ended, but camera recording could not be stopped"
                );
            }

            await fetchSessions();
        } catch (err) {
            console.error("End Session Error:", err);

            setMessage(
                err.response?.data?.message ||
                "Failed to end game session"
            );
        } finally {
            // Allow another attempt after this operation finishes
            manualEndingSessionsRef.current.delete(session.id);
        }
    };


    // =========================================================
    // GET REMAINING TIME
    // =========================================================

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

    // =========================================================
    // FORMAT TIMER
    // =========================================================

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

    // =========================================================
    // AUTOMATICALLY END EXPIRED SESSION
    // =========================================================

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
                    String(value).padStart(
                        2,
                        "0"
                    );

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
                        end_time:
                            endTime,

                        status:
                            "completed",
                    }
                );

                if (res.data.success) {
                    await stopCameraRecording(
                        session.id
                    );

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

    // =========================================================
    // TIMER - UPDATE EVERY SECOND
    // =========================================================

    useEffect(() => {
        const timer =
            setInterval(() => {
                setCurrentTime(
                    Date.now()
                );
            }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    // =========================================================
    // AUTOMATIC SESSION EXPIRY CHECK
    // =========================================================

    useEffect(() => {
        if (currentTime === null) {
            return;
        }

        sessions.forEach((session) => {
            if (
                session.status !==
                "active"
            ) {
                return;
            }

            const remaining =
                getRemainingTime(
                    session
                );

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

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            await fetchSessions();

            setLoading(false);
        };

        load();
    }, [fetchSessions]);

    // =========================================================
    // FILTERED SESSIONS
    // =========================================================

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

    // =========================================================
    // ACTIVE SESSION COUNT
    // =========================================================

    const active = sessions.filter(
        (session) =>
            session.status === "active"
    ).length;

    // =========================================================
    // CLOSE DETAILS MODAL
    // =========================================================

    const closeDetails = () => {
        setShowDetail(false);
        setSelected(null);
        setRecording(null);
        setSelectedCameraId("");
        setSelectedVideo(null);
    };

    // =========================================================
    // CLOSE START MODAL
    // =========================================================

    const closeStartModal = () => {
        if (starting) {
            return;
        }

        setShowStart(false);
        setSelectedBookingId("");
        setStartError("");
    };

    // =========================================================
    // LOADING SCREEN
    // =========================================================

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

    // =========================================================
    // MAIN UI
    // =========================================================

    return (
        <div className="game-session-page">

            {/* HEADER */}

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
                        disabled={starting}
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

            {/* SEARCH */}

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

            {/* MESSAGE */}

            {message && (
                <div
                    className={`game-session-message ${message
                        .toLowerCase()
                        .includes(
                            "successfully"
                        ) ||
                        message
                            .toLowerCase()
                            .includes(
                                "automatically"
                            )
                        ? "success"
                        : ""
                        }`}
                >
                    {message}
                </div>
            )}

            {/* SESSION LIST */}

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
                                            className={`session-status status-${sess.status ||
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
                                                ).toFixed(
                                                    2
                                                )}

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

            {/* =================================================
                SESSION DETAILS MODAL
            ================================================= */}

            {showDetail && (
                <GameSessionDetailModal
                    selected={selected}
                    detailsLoading={detailsLoading}
                    canManage={canManage}
                    recording={recording}
                    cameras={cameras}
                    selectedCameraId={selectedCameraId}
                    setSelectedCameraId={setSelectedCameraId}
                    selectedVideo={selectedVideo}
                    setSelectedVideo={setSelectedVideo}
                    uploadingVideo={uploadingVideo}
                    onClose={closeDetails}
                    onUpload={handleUploadRecording}
                    onGenerateQRCode={handleGenerateQRCode}
                />
            )}

            {/* =================================================
                START SESSION MODAL
            ================================================= */}

            {showStart && (
                <GameSessionStartModal
                    bookings={bookings}
                    bookingsLoading={bookingsLoading}
                    selectedBookingId={selectedBookingId}
                    setSelectedBookingId={setSelectedBookingId}
                    starting={starting}
                    startError={startError}
                    onClose={closeStartModal}
                    onStart={handleStart}
                />
            )}
        </div>
    );
}

export default GameSession;