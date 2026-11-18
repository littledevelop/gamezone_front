
import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Play, Square, Camera } from "lucide-react";

import api from "../api/axios";
import "../styles/GameSession.css";
import { isAdminOrStaff } from "../utils/auth";
import GameSessionStartModal from "../components/game-session/GameSessionStartModal";
import GameSessionDetailModal from "../components/game-session/GameSessionDetailModal";

const CAMERA_SERVICE_URL = "http://localhost:6100";

function GameSession() {
    const canManage = isAdminOrStaff();

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user?.role_name || "Player";
    const isPlayer = role === "Player";

    const [sessions, setSessions] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [startError, setStartError] = useState("");
    const [showStart, setShowStart] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState("");
    const [bookings, setBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [starting, setStarting] = useState(false);
    const [currentTime, setCurrentTime] = useState(null);
    const [selected, setSelected] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [sessionPhotos, setSessionPhotos] = useState([]);
    const [capturingPhoto, setCapturingPhoto] = useState(false);
    const [recording, setRecording] = useState(null);

    const endingSessionsRef = useRef(new Set());
    const autoEndAttemptedRef = useRef(new Set());
    const finishSessionRef = useRef(null);

    // -------------------------------------------------
    // FETCH SESSIONS
    // -------------------------------------------------

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
                    session =>
                        Number(session.user_id) === Number(user?.id)
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

    // -------------------------------------------------
    // FETCH ELIGIBLE BOOKINGS
    // -------------------------------------------------

    const fetchBookings = useCallback(async () => {
        try {
            setBookingsLoading(true);

            const [bookingRes, sessionRes] = await Promise.all([
                api.get("/booking"),
                api.get("/game-session").catch(() =>
                    api.get("/game-sessions")
                ),
            ]);

            const allSessions = sessionRes.data.success
                ? sessionRes.data.data ||
                sessionRes.data.sessions ||
                []
                : [];

            const activeBookingIds = new Set(
                allSessions
                    .filter(session => session.status === "active")
                    .map(session => String(session.booking_id))
            );

            if (bookingRes.data.success) {
                const now = new Date();
                const pad = value => String(value).padStart(2, "0");

                const today =
                    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

                const currentTime =
                    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

                const eligibleBookings = (
                    bookingRes.data.bookings || []
                ).filter(booking => {
                    const bookingDate = String(
                        booking.booking_date || ""
                    ).slice(0, 10);

                    const startTime = String(
                        booking.start_time || ""
                    ).slice(0, 8);

                    const endTime = String(
                        booking.end_time || ""
                    ).slice(0, 8);

                    const isConfirmed =
                        String(booking.status).toLowerCase() === "confirmed";

                    const isActive =
                        activeBookingIds.has(String(booking.id));

                    const isToday = bookingDate === today;

                    const isWithinTime =
                        startTime <= currentTime &&
                        endTime > currentTime;

                    return (
                        isConfirmed &&
                        !isActive &&
                        isToday &&
                        isWithinTime
                    );
                });

                setBookings(eligibleBookings);
            }
        } catch (err) {
            console.error("Fetch Bookings Error:", err);
            setBookings([]);
        } finally {
            setBookingsLoading(false);
        }
    }, []);

    // -------------------------------------------------
    // GET SESSION DETAILS
    // -------------------------------------------------

    const getById = useCallback(async id => {
        try {
            setDetailsLoading(true);
            setShowDetail(true);
            setSessionPhotos([]);

            const res = await api
                .get(`/game-session/${id}`)
                .catch(() => api.get(`/game-sessions/${id}`));

            if (res.data.success) {
                const sessionData =
                    res.data.data ||
                    res.data.session;

                setSelected(sessionData);
                setRecording(sessionData?.recording || null);
            }

            try {
                const photoRes = await api.get(
                    `/game-session-photos/session/${id}`
                );

                if (photoRes.data.success) {
                    setSessionPhotos(photoRes.data.data || []);
                }
            } catch (photoErr) {
                console.error(
                    "Get Session Photos Error:",
                    photoErr.response?.data || photoErr
                );
            }
        } catch (err) {
            console.error("Get Session Details Error:", err);
            setMessage("Failed to load details");
        } finally {
            setDetailsLoading(false);
        }
    }, []);

    // -------------------------------------------------
    // CAPTURE PLAYER PHOTO
    // -------------------------------------------------

    const handleCapturePhoto = async session => {
        if (!session?.id) {
            setMessage("Session ID not found");
            return;
        }

        if (session.status !== "preparing") {
            setMessage(
                "Photos can only be captured before the game starts"
            );
            return;
        }

        try {
            setCapturingPhoto(true);
            setMessage("Capturing photo...");

            const cameraResponse = await api.get(
                `/game-cameras/game/${session.game_id}`
            );

            if (
                !cameraResponse.data.success ||
                !Array.isArray(cameraResponse.data.data) ||
                cameraResponse.data.data.length === 0
            ) {
                throw new Error(
                    "No active cameras are assigned to this game."
                );
            }

            const camera = cameraResponse.data.data[0];

            const databaseCameraId = Number(
                camera.camera_id ?? camera.id
            );

            if (
                !Number.isInteger(databaseCameraId) ||
                databaseCameraId <= 0
            ) {
                throw new Error("Invalid database camera ID.");
            }

            const cameraId = "camera_1";

            const response = await fetch(
                `${CAMERA_SERVICE_URL}/camera/capture-photo`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        sessionId: session.id,
                        cameraId,
                        databaseCameraId,
                    }),
                }
            );

            let data;

            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error(
                    "Camera service returned an invalid response.",
                    { cause: jsonError }
                );
            }

            console.log("CAPTURE PHOTO RESPONSE:", data);

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Photo capture failed."
                );
            }

            setMessage("Photo captured and uploaded successfully");

            if (showDetail && selected?.id === session.id) {
                await getById(session.id);
            }

            return true;
        } catch (error) {
            console.error("Capture Photo Error:", error);

            setMessage(
                error.message || "Failed to capture photo"
            );

            return false;
        } finally {
            setCapturingPhoto(false);
        }
    };

    // -------------------------------------------------
    // EXISTING INDIVIDUAL VIDEO QR CODE
    // -------------------------------------------------

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
            console.error("Generate QR error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to generate QR code"
            );
        }
    };

    // -------------------------------------------------
    // START SESSION
    // -------------------------------------------------

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
            const selectedBooking = bookings.find(
                booking =>
                    Number(booking.id) === Number(selectedBookingId)
            );

            if (!selectedBooking) {
                throw new Error("Selected booking not found.");
            }

            const startTime = new Date();

            const mysqlStartTime =
                `${startTime.getFullYear()}-` +
                `${String(startTime.getMonth() + 1).padStart(2, "0")}-` +
                `${String(startTime.getDate()).padStart(2, "0")} ` +
                `${String(startTime.getHours()).padStart(2, "0")}:` +
                `${String(startTime.getMinutes()).padStart(2, "0")}:` +
                `${String(startTime.getSeconds()).padStart(2, "0")}`;

            const res = await api.post("/game-session", {
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
                status: String(selectedBooking.game_name || "")
                    .toLowerCase()
                    .includes("laser tag")
                    ? "preparing"
                    : "active",
                recording_status: "not_recorded",
            });

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

            console.log("GAME SESSION CREATED:", sessionId);

            const isLaserTag = String(
                selectedBooking.game_name || ""
            ).toLowerCase().includes("laser tag");

            if (isLaserTag) {
                setMessage(
                    "Laser Tag session prepared. Capture the players' photos, then click Start Game."
                );

                setShowStart(false);
                setSelectedBookingId("");

                await fetchSessions();
                await fetchBookings();

                return;
            }

            try {
                await startCameraRecording({
                    sessionId,
                    gameId: selectedBooking.game_id,
                    playerName:
                        selectedBooking.user_name ||
                        selectedBooking.player_name ||
                        selectedBooking.full_name ||
                        "Player",
                    gameName: selectedBooking.game_name || "Game",
                });

                const recordingRes = await api.put(
                    `/game-session/${sessionId}`,
                    { recording_status: "recording" }
                );

                if (!recordingRes.data?.success) {
                    throw new Error(
                        recordingRes.data?.message ||
                        "Recording started, but the session recording status could not be updated." 
                    );
                }    

                setMessage(
                    "Game session and camera recording started successfully"
                );

                setShowStart(false);
                setSelectedBookingId("");

                await fetchSessions();
                await fetchBookings();
            } catch (cameraError) {
                console.error("CAMERA START ERROR:", cameraError);

                try {
                    await stopCameraRecording(sessionId);
                } catch (stopError) {
                    console.error("CAMERA CLEANUP ERROR:", stopError);
                }

                try {
                    const cancelRes = await api.put(
                        `/game-session/${sessionId}`,
                        {
                            status: "cancelled",
                            end_time: mysqlStartTime,
                            recording_status: "not_recorded",
                        }
                    );

                    if (
                        !cancelRes.data ||
                        cancelRes.data.success !== true
                    ) {
                        setStartError(
                            cancelRes.data?.message ||
                            "Backend could not cancel the game session."
                        );

                        await fetchSessions();
                        return;
                    }

                    console.log("SESSION CANCELLED:", sessionId);
                } catch (cancelError) {
                    console.error(
                        "SESSION CANCELLATION FAILED:",
                        cancelError
                    );

                    setStartError(
                        "Camera recording failed, and the session could not be cancelled. Please refresh and check the session status."
                    );

                    await fetchSessions();
                    return;
                }

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
                error.response?.data || error
            );

            setStartError(
                error.response?.data?.message ||
                error.message ||
                "Unable to start game session."
            );

            if (sessionId) {
                try {
                    await api.put(`/game-session/${sessionId}`, {
                        status: "cancelled",
                        recording_status: "not_recorded",
                    });

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

    // -------------------------------------------------
    // START PREPARING LASER TAG GAME
    // -------------------------------------------------

    const handleStartGame = async session => {
        if (!session?.id || session.status !== "preparing") {
            setMessage("Only a preparing session can be started.");
            return;
        }

        setStarting(true);
        setMessage("");

        try {
            const activateRes = await api.put(
                `/game-session/${session.id}`,
                { status: "active" }
            );

            if (!activateRes.data?.success) {
                throw new Error(
                    activateRes.data?.message ||
                    "Could not activate the game session."
                );
            }

            await startCameraRecording({
                sessionId: session.id,
                gameId: session.game_id,
                playerName: session.user_name || "Player",
                gameName: session.game_name || "Laser Tag",
            });

            const recordingRes = await api.put(
                `/game-session/${session.id}`,
                { recording_status: "recording" }
            );

            if (!recordingRes.data?.success) {
                throw new Error(
                    recordingRes.data?.message ||
                    "Recording started, but the session recording status could not be updated."
                );
            }

            setMessage(
                "Laser Tag game started and camera recording is running."
            );

            await fetchSessions();
            await fetchBookings();
        } catch (error) {
            console.error("START GAME ERROR:", error);

            const stopResult = await stopCameraRecording(session.id);

            try {
                const cancelRes = await api.put(
                    `/game-session/${session.id}`,
                    {
                        status: "cancelled",
                        recording_status: "not_recorded",
                    }
                );

                if (!cancelRes.data?.success) {
                    throw new Error(
                        cancelRes.data && cancelRes.data.message
                            ? cancelRes.data.message
                            : "Could not cancel the session.",
                        { cause: error }
                    );
                }

                setMessage(
                    stopResult.success
                        ? `${error.message} The session was cancelled.`
                        : `${error.message} The session was cancelled, but camera cleanup needs checking.`
                );
            } catch (cancelError) {
                console.error(
                    "SESSION CANCELLATION ERROR:",
                    cancelError
                );

                setMessage(
                    `${error.message} Please check the session and camera status before retrying.`
                );
            }

            await fetchSessions();
            await fetchBookings();
        } finally {
            setStarting(false);
        }
    };

    // -------------------------------------------------
    // START CAMERA RECORDING
    // -------------------------------------------------

    const startCameraRecording = async ({
        sessionId,
        playerName,
        gameName,
        gameId,
    }) => {
        try {
            if (!gameId) {
                throw new Error("Game ID is missing.");
            }

            const cameraResponse = await api.get(
                `/game-cameras/game/${gameId}`
            );

            console.log(
                "GAME CAMERA API RESPONSE:",
                cameraResponse.data
            );

            if (
                !cameraResponse.data.success ||
                !Array.isArray(cameraResponse.data.data)
            ) {
                throw new Error(
                    "Failed to get cameras assigned to the game."
                );
            }

            const assignedCameras = cameraResponse.data.data;

            if (assignedCameras.length === 0) {
                throw new Error(
                    `No active cameras are assigned to game ${gameId}.`
                );
            }

            const startedCameras = [];

            for (
                let index = 0;
                index < assignedCameras.length;
                index++
            ) {
                const camera = assignedCameras[index];
                const cameraId = `camera_${index + 1}`;

                const databaseCameraId = Number(
                    camera.camera_id ?? camera.id
                );

                if (
                    !Number.isInteger(databaseCameraId) ||
                    databaseCameraId <= 0
                ) {
                    throw new Error(
                        `Invalid database camera ID for ${camera.camera_name}.`
                    );
                }

                console.log(
                    `Starting ${camera.camera_name} as ${cameraId}`
                );

                let response;

                try {
                    response = await fetch(
                        `${CAMERA_SERVICE_URL}/camera/start`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                sessionId,
                                playerName,
                                gameName,
                                cameraId,
                                databaseCameraId,
                            }),
                        }
                    );
                } catch (networkError) {
                    console.error(
                        "Camera Service Network Error:",
                        networkError
                    );

                    throw new Error(
                        "Camera service is not running. Please start the camera service on port 6100.",
                        { cause: networkError }
                    );
                }

                let data;

                try {
                    data = await response.json();
                } catch (jsonError) {
                    throw new Error(
                        "Camera service returned an invalid response.",
                        { cause: jsonError }
                    );
                }

                console.log(
                    `Camera Service Response (${cameraId}):`,
                    data
                );

                if (!response.ok || !data.success) {
                    throw new Error(
                        data.message ||
                        `Failed to start camera recording for ${camera.camera_name}.`
                    );
                }

                startedCameras.push({
                    databaseCameraId,
                    cameraId,
                    cameraName: camera.camera_name,
                });

                console.log(
                    `Camera started successfully: ${camera.camera_name} → ${cameraId}`
                );
            }

            if (startedCameras.length !== assignedCameras.length) {
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
            console.error("Camera Start Error:", error);
            throw error;
        }
    };

    // -------------------------------------------------
    // STOP CAMERA RECORDING
    // -------------------------------------------------

    const stopCameraRecording = useCallback(async sessionId => {
        try {
            const response = await fetch(
                `${CAMERA_SERVICE_URL}/camera/stop-session`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ sessionId }),
                }
            );

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "Camera service returned an invalid response."
                );
            }

            console.log("STOP CAMERA RESPONSE:", data);

            return {
                success:
                    response.ok &&
                    data.success === true &&
                    (data.uploadResults || []).length > 0 &&
                    data.uploadResults.every(
                        item => item.success === true
                    ),
                stopped: data.stoppedCameras || [],
                uploadResults: data.uploadResults || [],
                message: data.message || "Camera stop failed.",
            };
        } catch (error) {
            console.error("Camera Stop Error:", error);

            return {
                success: false,
                stopped: [],
                uploadResults: [],
                message:
                    error.message ||
                    "Camera recording could not be stopped.",
            };
        }
    }, []);

    // -------------------------------------------------
    // FINISH SESSION: UPLOADS -> REEL -> QR -> COMPLETED
    // -------------------------------------------------

    const finishSession = useCallback(async (
        session,
        automatic = false
    ) => {
        const sessionId = Number(session?.id);

        if (
            !sessionId ||
            endingSessionsRef.current.has(sessionId)
        ) {
            return;
        }

        endingSessionsRef.current.add(sessionId);

        try {
            setMessage(
                automatic
                    ? `Time expired. Processing session #${sessionId}...`
                    : `Processing session #${sessionId}...`
            );

            // 1. Stop cameras and request uploads.
            const cameraResult =
                await stopCameraRecording(sessionId);

            console.log("CAMERA STOP RESULT:", cameraResult);

            // 2. Get assigned cameras for this game.
            const assignedCameraResponse = await api.get(
                `/game-cameras/game/${session.game_id}`
            );

            const assignedCameras =
                assignedCameraResponse.data?.data || [];

            if (
                !Array.isArray(assignedCameras) ||
                assignedCameras.length === 0
            ) {
                throw new Error(
                    "No cameras are assigned to this game. Reel generation cannot continue."
                );
            }

            // 3. Fetch recordings from the backend.
            // The backend database is the source of truth for uploads.
            const recordingsResponse = await api.get(
                "/video-recordings"
            );

            const recordingsData =
                recordingsResponse.data?.data ||
                recordingsResponse.data?.recordings ||
                [];

            if (!Array.isArray(recordingsData)) {
                throw new Error(
                    "The video-recordings API did not return a recordings list. Please check its response format."
                );
            }

            const completedRecordings = recordingsData.filter(item =>
                Number(item.session_id) === sessionId &&
                String(item.recording_status).toLowerCase() === "completed" &&
                Boolean(item.cloudinary_url)
            );

            // 4. Verify every assigned camera has an uploaded recording.
            const uploadedCameraIds = new Set(
                completedRecordings.map(item =>
                    Number(item.camera_id)
                )
            );

            const missingCameras = assignedCameras.filter(camera => {
                const cameraId = Number(
                    camera.camera_id ?? camera.id
                );

                return !uploadedCameraIds.has(cameraId);
            });

            if (missingCameras.length > 0) {
                const missingNames = missingCameras
                    .map(camera => camera.camera_name || camera.name || "Unknown camera")
                    .join(", ");

                throw new Error(
                    `Some camera recordings are not uploaded yet: ${missingNames}. Session remains active. Please resolve the upload issue and retry End Session.`
                );
            }

            if (completedRecordings.length === 0) {
                throw new Error(
                    cameraResult.message ||
                    "No completed camera recordings were found. Session remains active."
                );
            }

            // 5. Get a representative recording ID.
            // The reels table requires video_recording_id.
            const representativeRecordingId = Number(
                completedRecordings[0].id
            );

            if (
                !Number.isInteger(representativeRecordingId) ||
                representativeRecordingId <= 0
            ) {
                throw new Error(
                    "Uploaded recordings were found, but their recording ID is missing."
                );
            }

            // 6. Mark session completed and release the gaming station.
            const now = new Date();
            const pad = value => String(value).padStart(2, "0");

            const endTime =
                `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
                `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            const completeResponse = await api.put(
                `/game-session/${sessionId}`,
                {
                    end_time: endTime,
                    status: "completed",
                }
            );

            if (!completeResponse.data?.success) {
                throw new Error(
                    completeResponse.data?.message ||
                    "Could not complete the game session."
                );
            }

            setSessions(previous =>
                previous.map(item =>
                    Number(item.id) === sessionId
                        ? {
                            ...item,
                            status: "completed",
                            end_time: endTime,
                        }
                        : item
                )
            );

            await fetchSessions();

            setMessage(
                `Session #${sessionId} completed. Generating reel and QR code...`
            );

            console.log(`SESSION #${sessionId} MARKED COMPLETED`);

            console.log(
                "VERIFIED SESSION RECORDINGS:",
                completedRecordings
            );

            // 6. Create the session reel draft.
            let reelId;

            try {
                const draftResponse = await api.post("/reels", {
                    video_recording_id: representativeRecordingId,
                    title: `Session #${sessionId} - ${session.game_name || "Gameplay"}`,
                    description: `Gameplay highlights for session #${sessionId}`,
                });

                if (!draftResponse.data?.success) {
                    throw new Error(
                        draftResponse.data?.message ||
                        "Could not create reel draft."
                    );
                }

                reelId =
                    draftResponse.data?.data?.id ??
                    draftResponse.data?.reel?.id;
            } catch (draftError) {
                if (draftError.response?.status === 409) {
                    reelId = draftError.response?.data?.data?.id;
                } else {
                    throw draftError;
                }
            }

            if (!reelId) {
                throw new Error(
                    "Reel draft was not created or its ID was not returned."
                );
            }

            // 7. Generate the combined session reel.
            const reelResponse = await api.post(
                `/reels/${reelId}/generate`
            );

            if (!reelResponse.data?.success) {
                throw new Error(
                    reelResponse.data?.message ||
                    "Combined reel generation failed."
                );
            }

            console.log(
                "COMBINED REEL GENERATED:",
                reelResponse.data
            );

            // 8. Generate/reuse the reel QR code.
            const qrResponse = await api.post(
                "/qr-codes/reel",
                {
                    reel_id: reelId,
                }
            );

            if (!qrResponse.data?.success) {
                throw new Error(
                    qrResponse.data?.message ||
                    "Reel QR code generation failed."
                );
            }

            console.log("REEL QR GENERATED:", qrResponse.data);

              setMessage(
    `Session #${sessionId} completed. Combined reel and QR code generated successfully.`
);
           
        } catch (error) {
            console.error(
                "FINISH SESSION ERROR:",
                error.response?.data || error
            );

            

            setMessage(
                error.response?.data?.message ||
                error.message ||
                "Session processing failed. The session has not been marked completed."
            );

            await fetchSessions();
        } finally {
            endingSessionsRef.current.delete(sessionId);
        }
    }, [fetchSessions, stopCameraRecording]);

    // Keep the latest finishSession callback available to automatic ending.
    useEffect(() => {
        finishSessionRef.current = finishSession;
    }, [finishSession]);

    // -------------------------------------------------
    // MANUAL END SESSION
    // -------------------------------------------------

    const handleEnd = async session => {
        if (!session?.id) return;

        if (
            endingSessionsRef.current.has(Number(session.id))
        ) {
            return;
        }

        const confirmEnd = window.confirm(
            `End Session #${session.id} for ${session.user_name}?`
        );

        if (!confirmEnd) return;

        await finishSession(session, false);
    };

    // -------------------------------------------------
    // TIMER
    // -------------------------------------------------

    const getRemainingTime = useCallback(session => {
        if (
            !session ||
            session.status !== "active" ||
            currentTime === null
        ) {
            return null;
        }

        const start = new Date(
            String(session.start_time).replace(" ", "T")
        ).getTime();

        if (Number.isNaN(start)) {
            return null;
        }

        const durationMinutes = Number(
            session.duration_minutes || 60
        );

        const end =
            start +
            durationMinutes * 60 * 1000;

        const remaining = Math.max(
            0,
            end - currentTime
        );

        return Math.floor(remaining / 1000);
    }, [currentTime]);

    const formatTimer = seconds => {
        if (
            seconds === null ||
            seconds === undefined
        ) {
            return "--:--:--";
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return (
            `${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(secs).padStart(2, "0")}`
        );
    };

    // -------------------------------------------------
    // AUTOMATIC END SESSION
    // -------------------------------------------------

    const handleAutoEnd = useCallback(async session => {
        const sessionId = Number(session?.id);

        if (
            !sessionId ||
            endingSessionsRef.current.has(sessionId) ||
            autoEndAttemptedRef.current.has(sessionId)
        ) {
            return;
        }

        // Prevent the timer effect from retrying every second.
        // Staff can still manually retry using End Session.
        autoEndAttemptedRef.current.add(sessionId);

        await finishSessionRef.current?.(session, true);
    }, []);

    // Update the clock every second.
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Check active session timers.
    useEffect(() => {
        if (currentTime === null) return;

        sessions.forEach(session => {
            if (session.status !== "active") return;

            const remaining = getRemainingTime(session);

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

    // -------------------------------------------------
    // INITIAL LOAD
    // -------------------------------------------------

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchSessions();
            setLoading(false);
        };

        load();
    }, [fetchSessions]);

    // -------------------------------------------------
    // FILTERED SESSIONS
    // -------------------------------------------------

    const filtered = sessions.filter(session =>
        (session.user_name || "")
            .toLowerCase()
            .includes(filter.toLowerCase()) ||
        (session.game_name || "")
            .toLowerCase()
            .includes(filter.toLowerCase())
    );

    const active = sessions.filter(
        session => session.status === "active"
    ).length;

    // -------------------------------------------------
    // MODAL CLOSE HANDLERS
    // -------------------------------------------------

    const closeDetails = () => {
        setShowDetail(false);
        setSelected(null);
        setRecording(null);
    };

    const closeStartModal = () => {
        if (starting) return;

        setShowStart(false);
        setSelectedBookingId("");
        setStartError("");
    };

    // -------------------------------------------------
    // LOADING
    // -------------------------------------------------

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

    // -------------------------------------------------
    // UI
    // -------------------------------------------------

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
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>

                <span className="game-session-results">
                    {filtered.length} results
                </span>
            </div>

            {/* MESSAGE */}

            {message && (
                <div
                    className={`game-session-message ${message.toLowerCase().includes("successfully") ||
                        message.toLowerCase().includes("automatically")
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
                        {isPlayer ? "My Sessions" : "All Sessions"}
                    </h2>

                    <span className="session-count">
                        {filtered.length}
                    </span>
                </div>

                {filtered.length === 0 ? (
                    <div className="empty-game-sessions">
                        <div className="empty-icon">🎮</div>

                        <h3>No Game Sessions</h3>

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
                        {filtered.map(sess => (
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
                                        className={`session-status status-${sess.status || "active"
                                            }`}
                                    >
                                        {sess.status || "active"}
                                    </span>
                                </div>

                                {/* CARD DETAILS */}

                                <div className="game-session-details">
                                    {sess.status === "active" && (
                                        <div className="session-timer-row">
                                            <span>Remaining Time</span>

                                            <strong>
                                                {(() => {
                                                    const remaining =
                                                        getRemainingTime(sess);

                                                    return remaining === 0
                                                        ? "Time Expired"
                                                        : formatTimer(remaining);
                                                })()}
                                            </strong>
                                        </div>
                                    )}

                                    <div className="session-detail-row">
                                        <span>Player</span>
                                        <strong>
                                            {sess.user_name || "-"}
                                        </strong>
                                    </div>

                                    <div className="session-detail-row">
                                        <span>Game</span>
                                        <strong>
                                            {sess.game_name || "-"}
                                        </strong>
                                    </div>

                                    <div className="session-detail-row">
                                        <span>Station</span>
                                        <strong>
                                            {sess.station_name || "-"}
                                        </strong>
                                    </div>

                                    <div className="session-detail-row">
                                        <span>Amount</span>
                                        <strong>
                                            ₹
                                            {Number(
                                                sess.amount || 0
                                            ).toFixed(2)}
                                            {" • "}
                                            {sess.payment_status || "pending"}
                                        </strong>
                                    </div>
                                </div>

                                {/* CARD FOOTER */}

                                <div className="game-session-item-footer">
                                    <button
                                        className="view-session-btn"
                                        onClick={() => getById(sess.id)}
                                    >
                                        View Details
                                    </button>

                                    {canManage &&
                                        sess.status === "preparing" && (
                                            <>
                                                <button
                                                    className="capture-photo-btn"
                                                    onClick={() =>
                                                        handleCapturePhoto(sess)
                                                    }
                                                    disabled={
                                                        capturingPhoto || starting
                                                    }
                                                    title="Capture player photo before the game starts"
                                                >
                                                    <Camera size={15} />
                                                    {capturingPhoto
                                                        ? "Capturing..."
                                                        : "Photo"}
                                                </button>

                                                <button
                                                    className="start-session-btn"
                                                    onClick={() =>
                                                        handleStartGame(sess)
                                                    }
                                                    disabled={
                                                        starting || capturingPhoto
                                                    }
                                                    title="Start the game and begin camera recording"
                                                >
                                                    <Play size={15} />
                                                    Start Game
                                                </button>
                                            </>
                                        )}

                                    {canManage &&
                                        sess.status === "active" && (
                                            <button
                                                className="end-session-btn"
                                                onClick={() =>
                                                    handleEnd(sess)
                                                }
                                                disabled={starting}
                                                title="End Session"
                                                aria-label="End Session"
                                            >
                                                <Square size={15} />
                                            </button>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SESSION DETAIL MODAL */}

            {showDetail && (
                <GameSessionDetailModal
                    selected={selected}
                    detailsLoading={detailsLoading}
                    canManage={canManage}
                    recording={recording}
                    sessionPhotos={sessionPhotos}
                    onClose={closeDetails}
                    onGenerateQRCode={handleGenerateQRCode}
                />
            )}

            {/* START SESSION MODAL */}

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
