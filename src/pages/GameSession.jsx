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

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const role = user?.role_name || "Player";
    const isPlayer = role === "Player";
    const [sessions, setSessions] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const manualEndingSessionsRef = useRef(new Set());
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
    // const [cameras, setCameras] = useState([]);
    // const [selectedCameraId, setSelectedCameraId] = useState("");
    // const [selectedVideo, setSelectedVideo] = useState(null);
    // const [uploadingVideo, setUploadingVideo] = useState(false);
    const [sessionPhotos, setSessionPhotos] = useState([]);
    const [capturingPhoto, setCapturingPhoto] = useState(false);
    const [recording, setRecording] = useState(null);
    const endingSessionsRef = useRef(new Set());
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

            // if (bookingRes.data.success) {
            //     const confirmedBookings =
            //         (
            //             bookingRes.data.bookings || []
            //         ).filter(
            //             (booking) =>
            //                 booking.status ===
            //                 "confirmed" &&
            //                 !activeBookingIds.has(
            //                     String(booking.id)
            //                 )
            //         );

            //     setBookings(confirmedBookings);
            // }


            if (bookingRes.data.success) {
                const now = new Date();

                // Local date and time, matching the session start-time convention.
                const pad = (value) => String(value).padStart(2, "0");

                const today =
                    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

                const currentTime =
                    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

                console.log("BOOKING API RESPONSE:", bookingRes.data);
                console.log("ALL SESSIONS:", allSessions);
                console.log("ACTIVE BOOKING IDS:", [...activeBookingIds]);
                console.log("CURRENT DATE:", today);
                console.log("CURRENT TIME:", currentTime);

                // const eligibleBookings = (
                //     bookingRes.data.bookings || []
                // ).filter((booking) => {
                //     if (
                //         String(booking.status).toLowerCase() !== "confirmed" ||
                //         activeBookingIds.has(String(booking.id))
                //     ) {
                //         return false;
                //     }

                //     // Normalize booking date to YYYY-MM-DD.
                //     const bookingDate = String(
                //         booking.booking_date || ""
                //     ).slice(0, 10);

                //     // Normalize times to HH:mm:ss.
                //     const startTime = String(
                //         booking.start_time || ""
                //     ).slice(0, 8);

                //     const endTime = String(
                //         booking.end_time || ""
                //     ).slice(0, 8);

                //     // Only today's bookings that are currently within
                //     // their reserved time slot can start a session.
                //     return (
                //         bookingDate === today &&
                //         startTime <= currentTime &&
                //         endTime > currentTime
                //     );
                // });


                const eligibleBookings = (
                    bookingRes.data.bookings || []
                ).filter((booking) => {
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

                    const isToday =
                        bookingDate === today;

                    const isWithinTime =
                        startTime <= currentTime &&
                        endTime > currentTime;

                    console.log("BOOKING CHECK:", {
                        id: booking.id,
                        bookingDate,
                        startTime,
                        endTime,
                        status: booking.status,
                        isConfirmed,
                        isActive,
                        isToday,
                        isWithinTime
                    });

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
            console.error(
                "Fetch Bookings Error:",
                err
            );

            setBookings([]);
        } finally {
            setBookingsLoading(false);
        }
    }, []);

    // const fetchCameras = useCallback(async () => {
    //     try {
    //         const res = await api.get("/cameras");

    //         if (res.data.success) {
    //             const activeCameras =
    //                 (res.data.data || []).filter(
    //                     (camera) =>
    //                         camera.status === "active"
    //                 );

    //             setCameras(activeCameras);
    //         }
    //     } catch (err) {
    //         console.error(
    //             "Fetch Cameras Error:",
    //             err
    //         );
    //     }
    // }, []);


    const getById = useCallback(
        async (id) => {
            try {
                setDetailsLoading(true);
                setShowDetail(true);
                setSessionPhotos([]);

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

                    setRecording(
                        sessionData?.recording || null
                    );
                }

                // Load photos separately
                try {
                    const photoRes = await api.get(
                        `/game-session-photos/session/${id}`
                    );

                    if (photoRes.data.success) {
                        setSessionPhotos(
                            photoRes.data.data || []
                        );
                    }
                } catch (photoErr) {
                    console.error(
                        "Get Session Photos Error:",
                        photoErr.response?.data || photoErr
                    );
                }
            } catch (err) {
                console.error(
                    "Get Session Details Error:",
                    err
                );

                setMessage("Failed to load details");
            } finally {
                setDetailsLoading(false);
            }
        },
        []
    );


    const handleCapturePhoto = async (session) => {
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

            // Get cameras assigned to this game
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

            const assignedCameras =
                cameraResponse.data.data;

            // Capture photo from the first assigned camera
            const camera = assignedCameras[0];

            const databaseCameraId = Number(
                camera.camera_id ?? camera.id
            );

            if (
                !Number.isInteger(databaseCameraId) ||
                databaseCameraId <= 0
            ) {
                throw new Error(
                    "Invalid database camera ID."
                );
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
            console.log("PHOTO HTTP STATUS:", response.status);
            console.log("PHOTO CONTENT TYPE:", response.headers.get("content-type"));

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
                "CAPTURE PHOTO RESPONSE:",
                data
            );

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Photo capture failed."
                );
            }

            setMessage(
                "Photo captured and uploaded successfully"
            );
            // Refresh session details and photos if the details modal is open
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

    // const handleUploadRecording = async () => {
    //     if (!selected?.id) {
    //         setMessage("Session not selected");
    //         return;
    //     }

    //     if (!selectedCameraId) {
    //         setMessage("Please select a camera");
    //         return;
    //     }

    //     if (!selectedVideo) {
    //         setMessage("Please select a video file");
    //         return;
    //     }

    //     try {
    //         setUploadingVideo(true);
    //         setMessage("Uploading video...");

    //         const formData = new FormData();

    //         formData.append(
    //             "video",
    //             selectedVideo
    //         );

    //         formData.append(
    //             "session_id",
    //             selected.id
    //         );

    //         formData.append(
    //             "camera_id",
    //             selectedCameraId
    //         );

    //         const res = await api.post(
    //             "/video-recordings/upload",
    //             formData,
    //             {
    //                 headers: {
    //                     "Content-Type":
    //                         "multipart/form-data",
    //                 },
    //             }
    //         );

    //         if (res.data.success) {
    //             setMessage(
    //                 "Recording uploaded successfully"
    //             );

    //             setRecording(res.data.data);

    //             setSelectedVideo(null);
    //             setSelectedCameraId("");

    //             await fetchSessions();

    //             await getById(selected.id);
    //         } else {
    //             setMessage(
    //                 res.data.message ||
    //                 "Failed to upload recording"
    //             );
    //         }
    //     } catch (err) {
    //         console.error(
    //             "Upload Recording Error:",
    //             err
    //         );

    //         setMessage(
    //             err.response?.data?.message ||
    //             "Failed to upload recording"
    //         );
    //     } finally {
    //         setUploadingVideo(false);
    //     }
    // };

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

            const startTime = new Date();

            // Convert to MySQL DATETIME
            const mysqlStartTime =
                `${startTime.getFullYear()}-` +
                `${String(startTime.getMonth() + 1).padStart(2, "0")}-` +
                `${String(startTime.getDate()).padStart(2, "0")} ` +
                `${String(startTime.getHours()).padStart(2, "0")}:` +
                `${String(startTime.getMinutes()).padStart(2, "0")}:` +
                `${String(startTime.getSeconds()).padStart(2, "0")}`;

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
                    status: String(selectedBooking.game_name || "")
                        .toLowerCase()
                        .includes("laser tag")
                        ? "preparing"
                        : "active",
                    recording_status: "not_recorded"
                }
            );

            if (!res.data?.success) {
                console.log("CREATE SESSION RESPONSE:", res.data);
                console.log("SELECTED BOOKING:", selectedBooking);
                console.log("SESSION PAYLOAD:", {
                    user_id: selectedBooking.user_id,
                    game_id: selectedBooking.game_id,
                    station_id: selectedBooking.station_id,
                    booking_id: selectedBooking.id,
                    start_time: mysqlStartTime,
                });
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

            const isLaserTag = String(
                selectedBooking.game_name || ""
            )
                .toLowerCase()
                .includes("laser tag");

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

                try {
                    await stopCameraRecording(sessionId);
                } catch (stopError) {
                    console.error(
                        "CAMERA CLEANUP ERROR:",
                        stopError
                    );
                }

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
            console.error("START GAME SESSION ERROR:", error.message);

            console.error(
                "BACKEND ERROR RESPONSE:",
                JSON.stringify(error.response?.data ?? null, null, 2)
            );

            console.error("HTTP STATUS:", error.response?.status);

            console.error("FULL ERROR:", error);
            setStartError(
                error.response?.data?.message ||
                error.message ||
                "Unable to start game session."
            );

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


    const handleStartGame = async (session) => {
        if (!session?.id || session.status !== "preparing") {
            setMessage("Only a preparing session can be started.");
            return;
        }

        setStarting(true);
        setMessage("");

        try {
            // 1. Change the session to active.
            const activateRes = await api.put(
                `/game-session/${session.id}`,
                {
                    status: "active",
                }
            );

            if (!activateRes.data?.success) {
                throw new Error(
                    activateRes.data?.message ||
                    "Could not activate the game session."
                );
            }

            // 2. Start recording only after the staff clicks Start Game.
            await startCameraRecording({
                sessionId: session.id,
                gameId: session.game_id,
                playerName: session.user_name || "Player",
                gameName: session.game_name || "Laser Tag",
            });

            // 3. Save the recording state.
            const recordingRes = await api.put(
                `/game-session/${session.id}`,
                {
                    recording_status: "recording",
                }
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

            // Stop any cameras that may have started.
            const stopResult = await stopCameraRecording(session.id);

            // Cancel the session so the station can be released.
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
                        cancelRes.data?.message ||
                        "Could not cancel the session.",
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

            if (!gameId) {
                throw new Error(
                    "Game ID is missing."
                );
            }

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

                if (
                    !response.ok ||
                    !data.success
                ) {
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

            const uploadResults =
                data.uploadResults || [];

            const hasFailedUpload =
                uploadResults.some(
                    (item) => item.success !== true
                );

            return {
                success:
                    response.ok &&
                    data.success === true &&
                    !hasFailedUpload,

                stopped:
                    data.stoppedCameras || [],

                uploadResults,

                message:
                    hasFailedUpload
                        ? (
                            uploadResults.find(
                                (item) => item.success !== true
                            )?.message ||
                            "Video upload failed."
                        )
                        : (
                            data.message || ""
                        )
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

    const generateQRCodeForUpload = async (sessionId, cameraResult) => {
        const uploadedRecording = (
            cameraResult?.uploadResults || []
        ).find((item) => item.success);

        if (!uploadedRecording) {
            console.error(
                "QR NOT GENERATED: No successful video upload",
                cameraResult?.uploadResults
            );

            return {
                success: false,
                message: "Video upload failed. QR code was not generated."
            };
        }

        // Extract the recording ID returned by the backend.
        const uploadData = uploadedRecording.data;

        const recordingId =
            uploadData?.data?.id ??
            uploadData?.recording?.id ??
            uploadData?.id;

        if (!recordingId) {
            console.error(
                "QR NOT GENERATED: Recording ID missing",
                uploadData
            );

            return {
                success: false,
                message: "Video uploaded, but its recording ID was not returned."
            };
        }

        const response = await api.post("/qr-codes/video", {
            session_id: sessionId,
            video_recording_id: recordingId
        });

        if (!response.data?.success) {
            throw new Error(
                response.data?.message || "QR code generation failed."
            );
        }

        console.log("VIDEO QR GENERATED:", response.data);

        return {
            success: true,
            data: response.data.data
        };
    };

    const handleEnd = async (session) => {
        // Prevent duplicate clicks for the same session
        if (manualEndingSessionsRef.current.has(session.id)) {
            console.log(
                "End Session already in progress:",
                session.id
            );
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

            // -------------------------------------------------
            // 1. STOP CAMERA + UPLOAD VIDEO FIRST
            // -------------------------------------------------

            console.log(
                "ENDING SESSION - STOPPING CAMERA:",
                session.id
            );

            const cameraResult =
                await stopCameraRecording(session.id);

            console.log(
                "CAMERA STOP RESULT:",
                cameraResult
            );

            if (!cameraResult.success) {
                console.error(
                    "CAMERA STOP / VIDEO UPLOAD FAILED:",
                    cameraResult
                );

                setMessage(
                    cameraResult.message ||
                    "Camera recording could not be stopped. Session remains active."
                );

                await fetchSessions();
                return;
            }

            // -------------------------------------------------
            // 2. VERIFY VIDEO UPLOAD RESULT
            // -------------------------------------------------

            const uploadResults =
                cameraResult.uploadResults || [];

            const failedUploads =
                uploadResults.filter(
                    (item) => item.success !== true
                );

            if (failedUploads.length > 0) {
                console.error(
                    "VIDEO UPLOAD FAILED:",
                    failedUploads
                );

                setMessage(
                    "Camera stopped, but video upload failed. Session remains active."
                );

                await fetchSessions();
                return;
            }

            // -------------------------------------------------
            // 3. GENERATE QR AFTER SUCCESSFUL VIDEO UPLOAD
            // -------------------------------------------------

            try {
                const qrResult =
                    await generateQRCodeForUpload(
                        session.id,
                        cameraResult
                    );

                if (!qrResult.success) {
                    console.error(
                        "QR GENERATION FAILED:",
                        qrResult
                    );

                    setMessage(
                        qrResult.message ||
                        "Video uploaded, but QR code generation failed."
                    );

                    // Do not complete the session yet.
                    await fetchSessions();
                    return;
                }

            } catch (qrError) {
                console.error(
                    "QR Generation Error:",
                    qrError
                );

                setMessage(
                    qrError.response?.data?.message ||
                    qrError.message ||
                    "Video uploaded, but QR code generation failed."
                );

                await fetchSessions();
                return;
            }

            // -------------------------------------------------
            // 4. ONLY NOW MARK SESSION COMPLETED
            // -------------------------------------------------

            const now = new Date();

            const pad = (value) =>
                String(value).padStart(2, "0");

            const endTime =
                `${now.getFullYear()}-` +
                `${pad(now.getMonth() + 1)}-` +
                `${pad(now.getDate())} ` +
                `${pad(now.getHours())}:` +
                `${pad(now.getMinutes())}:` +
                `${pad(now.getSeconds())}`;

            const res = await api.put(
                `/game-session/${session.id}`,
                {
                    end_time: endTime,
                    status: "completed",
                }
            );

            console.log(
                "END SESSION BACKEND RESPONSE:",
                res.data
            );

            if (!res.data?.success) {
                setMessage(
                    res.data?.message ||
                    "Video uploaded and QR generated, but session could not be completed."
                );

                await fetchSessions();
                return;
            }

            // -------------------------------------------------
            // 5. UPDATE LOCAL STATE IMMEDIATELY
            // -------------------------------------------------

            setSessions((prevSessions) =>
                prevSessions.map((item) =>
                    item.id === session.id
                        ? {
                            ...item,
                            status: "completed",
                            end_time: endTime,
                        }
                        : item
                )
            );

            console.log(
                "SESSION COMPLETED:",
                session.id
            );

            setMessage(
                "Session ended, video uploaded and QR code generated successfully."
            );

            // -------------------------------------------------
            // 6. FINAL REFRESH
            // -------------------------------------------------

            await fetchSessions();

        } catch (err) {
            console.error(
                "End Session Error:",
                err
            );

            setMessage(
                err.response?.data?.message ||
                err.message ||
                "Failed to end game session"
            );

            await fetchSessions();

        } finally {
            manualEndingSessionsRef.current.delete(
                session.id
            );
        }
    };

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

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            await fetchSessions();

            setLoading(false);
        };

        load();
    }, [fetchSessions]);


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

    const active = sessions.filter(
        (session) =>
            session.status === "active"
    ).length;

    const closeDetails = () => {
        setShowDetail(false);
        setSelected(null);
        setRecording(null);
    };

    const closeStartModal = () => {
        if (starting) {
            return;
        }

        setShowStart(false);
        setSelectedBookingId("");
        setStartError("");
    };

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


                                        {canManage && sess.status === "preparing" && (
                                            <>
                                                <button
                                                    className="capture-photo-btn"
                                                    onClick={() => handleCapturePhoto(sess)}
                                                    disabled={capturingPhoto || starting}
                                                    title="Capture player photo before the game starts"
                                                >
                                                    <Camera size={15} />
                                                    {capturingPhoto ? "Capturing..." : "Photo"}
                                                </button>

                                                <button
                                                    className="start-session-btn"
                                                    onClick={() => handleStartGame(sess)}
                                                    disabled={starting || capturingPhoto}
                                                    title="Start the game and begin camera recording"
                                                >
                                                    <Play size={15} />
                                                    Start Game
                                                </button>
                                            </>
                                        )}

                                        {canManage && sess.status === "active" && (
                                            <button
                                                className="end-session-btn"
                                                onClick={() => handleEnd(sess)}
                                                disabled={starting}
                                                title="End Session"
                                                aria-label="End Session"
                                            >
                                                <Square size={15} />
                                            </button>
                                        )}

                                    </div>
                                </div>
                            )
                        )}

                    </div>
                )}
            </div>

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