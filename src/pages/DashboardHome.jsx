import {
    CalendarDays,
    PlayCircle,
    Monitor,
    Gamepad2,
    Crown,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/axios";

function DashboardHome({ user, setActivePage }) {

    const role = user?.role_name || "Player";
    const userName = user?.full_name || "User";

    const [stats, setStats] = useState({
        games: 0,
        stations: 0,
        activeSessions: 0,
        todayBookings: 0,
        availableStations: 0,
    });

    const [loading, setLoading] = useState(true);

    const [todayBookingList, setTodayBookingList] = useState([]);
    const [bookingList, setBookingList] = useState([]);
    const [stationList, setStationList] = useState([]);
    const [activeSessionList, setActiveSessionList] = useState([]);
    const [membership, setMembership] = useState(null);
    const [todayGamingMinutes, setTodayGamingMinutes] = useState(0);


    // =========================================================
    // LOAD DASHBOARD DATA
    // =========================================================

    useEffect(() => {

        const loadStats = async () => {

            try {

                const games = await api.get("/games");
                const stations = await api.get("/gaming-stations");
                const sessions = await api.get("/game-session");
                const bookings = await api.get("/booking");


                // =================================================
                // PREPARE API DATA
                // =================================================

                const sessionData =
                    sessions.data.data || [];

                const bookingData =
                    bookings.data.bookings || [];

                const stationData =
                    stations.data.data || [];


                // =================================================
                // PLAYER BOOKING FILTER
                // =================================================

                const currentBookingData =
                    role === "Player"
                        ? bookingData.filter(
                            (booking) =>
                                Number(booking.user_id) ===
                                Number(user?.id)
                        )
                        : bookingData;


                setBookingList(currentBookingData);
                setStationList(stationData);


                // =================================================
                // MEMBERSHIP
                // =================================================

                let membershipData = null;

                if (role === "Player") {

                    try {

                        const membershipResponse =
                            await api.get(
                                "/memberships/my-membership"
                            );

                        membershipData =
                            membershipResponse.data.membership ||
                            null;

                    } catch (error) {

                        console.error(
                            "Membership API ERROR:",
                            error.response?.data ||
                            error.message
                        );

                    }

                }

                setMembership(membershipData);


                // =================================================
                // TODAY'S BOOKINGS
                // =================================================

                const today = new Date();

                const todayBookings =
                    currentBookingData.filter((booking) => {

                        if (!booking.booking_date) {
                            return false;
                        }

                        const bookingDate =
                            new Date(booking.booking_date);

                        return (
                            bookingDate.getDate() ===
                            today.getDate() &&

                            bookingDate.getMonth() ===
                            today.getMonth() &&

                            bookingDate.getFullYear() ===
                            today.getFullYear()
                        );

                    });


                // =================================================
                // ACTIVE SESSIONS
                // =================================================

                const activeSessions =
                    sessionData.filter(
                        (session) =>
                            session.status === "active"
                    );


                // =================================================
                // TODAY'S GAMING TIME
                // =================================================

                const now = new Date();

                const startOfToday = new Date();

                startOfToday.setHours(
                    0,
                    0,
                    0,
                    0
                );

                let gamingMinutes = 0;


                sessionData

                    .filter(
                        (session) =>
                            Number(session.user_id) ===
                            Number(user?.id)
                    )

                    .forEach((session) => {

                        if (!session.start_time) {
                            return;
                        }

                        const sessionStart =
                            new Date(
                                session.start_time
                            );


                        const sessionEnd =
                            session.status === "active"
                                ? now
                                : session.end_time
                                    ? new Date(
                                        session.end_time
                                    )
                                    : null;


                        if (!sessionEnd) {
                            return;
                        }


                        // Ignore sessions that ended before today

                        if (
                            sessionEnd <=
                            startOfToday
                        ) {
                            return;
                        }


                        // If session started before today,
                        // count only from today's midnight.

                        const effectiveStart =
                            sessionStart <
                                startOfToday
                                ? startOfToday
                                : sessionStart;


                        const duration =
                            (
                                sessionEnd -
                                effectiveStart
                            ) /
                            (1000 * 60);


                        if (duration > 0) {
                            gamingMinutes += duration;
                        }

                    });


                setTodayGamingMinutes(
                    Math.round(gamingMinutes)
                );


                // =================================================
                // AVAILABLE STATIONS
                // =================================================

                const availableStations =
                    stationData.filter(
                        (station) =>
                            station.status ===
                            "available"
                    ).length;


                // =================================================
                // SET STATS
                // =================================================

                setStats({

                    games:
                        games.data.count || 0,

                    stations:
                        stationData.length,

                    activeSessions:
                        activeSessions.length,

                    todayBookings:
                        todayBookings.length,

                    availableStations:
                        availableStations,

                });


                setTodayBookingList(
                    todayBookings
                );


                // =================================================
                // PLAYER ACTIVE SESSIONS
                // =================================================

                setActiveSessionList(

                    role === "Player"

                        ? activeSessions.filter(
                            (session) =>
                                Number(
                                    session.user_id
                                ) ===
                                Number(user?.id)
                        )

                        : activeSessions

                );

            } catch (error) {

                console.error(
                    "Dashboard API ERROR"
                );

                console.error(
                    "Status:",
                    error.response?.status
                );

                console.error(
                    "Message:",
                    error.response?.data
                );

                console.error(
                    "URL:",
                    error.config?.url
                );

            } finally {

                setLoading(false);

            }

        };


        loadStats();

    }, [role, user?.id]);


    // =========================================================
    // ADMIN DASHBOARD
    // =========================================================

    const renderAdminDashboard = () => {

        const occupiedStations =
            stationList.filter(
                (station) =>
                    station.status === "occupied"
            ).length;


        const occupancyPercent =
            stats.stations > 0
                ? Math.round(
                    (
                        occupiedStations /
                        stats.stations
                    ) * 100
                )
                : 0;


        return (
            <>

                <div className="page-header">

                    <div>

                        <h1>
                            Welcome back, {userName} 👋
                        </h1>

                        <p>
                            Manage your GameZone operations and monitor
                            today's activity.
                        </p>

                    </div>


                    <button
                        className="btn-primary"
                        onClick={() =>
                            setActivePage("Bookings")
                        }
                    >
                        + New Booking
                    </button>

                </div>


                {/* ADMIN STATS */}

                <div className="stats-grid">

                    <div className="stat-card blue">

                        <span className="stat-label">
                            Total Games
                        </span>

                        <span className="stat-value">
                            {loading
                                ? "..."
                                : stats.games}
                        </span>

                        <span className="stat-trend">
                            Available in GameZone
                        </span>

                    </div>


                    <div className="stat-card green">

                        <span className="stat-label">
                            Gaming Stations
                        </span>

                        <span className="stat-value">
                            {loading
                                ? "..."
                                : stats.stations}
                        </span>

                        <span className="stat-trend">
                            All registered stations
                        </span>

                    </div>


                    <div className="stat-card amber">

                        <span className="stat-label">
                            Active Sessions
                        </span>

                        <span className="stat-value">
                            {loading
                                ? "..."
                                : stats.activeSessions}
                        </span>

                        <span className="stat-trend">
                            {stats.activeSessions} live now
                        </span>

                    </div>


                    <div className="stat-card purple">

                        <span className="stat-label">
                            Today's Bookings
                        </span>

                        <span className="stat-value">
                            {loading
                                ? "..."
                                : stats.todayBookings}
                        </span>

                        <span className="stat-trend">
                            Today's reservations
                        </span>

                    </div>

                </div>


                {/* ADMIN CONTENT */}

                <div className="dashboard-grid">


                    {/* QUICK ACTIONS */}

                    <div className="card">

                        <div className="card-header">

                            <h2 className="card-title">
                                Quick Actions
                            </h2>

                        </div>


                        <div className="card-body">

                            <div className="quick-actions">


                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        setActivePage("Bookings")
                                    }
                                >

                                    <span className="quick-action-icon">
                                        <CalendarDays size={18} />
                                    </span>

                                    <div>

                                        <strong>
                                            Bookings
                                        </strong>

                                        <span>
                                            Manage reservations
                                        </span>

                                    </div>

                                </button>


                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        setActivePage("Game Session")
                                    }
                                >

                                    <span className="quick-action-icon">
                                        <PlayCircle size={18} />
                                    </span>

                                    <div>

                                        <strong>
                                            Game Sessions
                                        </strong>

                                        <span>
                                            Monitor active sessions
                                        </span>

                                    </div>

                                </button>


                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        setActivePage("Gaming Station")
                                    }
                                >

                                    <span className="quick-action-icon">
                                        <Monitor size={18} />
                                    </span>

                                    <div>

                                        <strong>
                                            Gaming Stations
                                        </strong>

                                        <span>
                                            Manage stations
                                        </span>

                                    </div>

                                </button>


                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        setActivePage("Games")
                                    }
                                >

                                    <span className="quick-action-icon">
                                        <Gamepad2 size={18} />
                                    </span>

                                    <div>

                                        <strong>
                                            Games
                                        </strong>

                                        <span>
                                            Manage games
                                        </span>

                                    </div>

                                </button>


                            </div>

                        </div>

                    </div>


                    {/* SYSTEM OVERVIEW */}

                    <div className="card">

                        <div className="card-header">

                            <h2 className="card-title">
                                System Overview
                            </h2>

                        </div>


                        <div className="card-body">

                            <div className="overview-row">

                                <span>
                                    System Status
                                </span>

                                <span className="status-badge status-active">
                                    ● Online
                                </span>

                            </div>


                            <div className="overview-row">

                                <span>
                                    User Role
                                </span>

                                <strong>
                                    Administrator
                                </strong>

                            </div>


                            <div className="overview-row">

                                <span>
                                    Account
                                </span>

                                <span className="status-badge status-active">
                                    Active
                                </span>

                            </div>


                            <div className="overview-row">

                                <span>
                                    GameZone System
                                </span>

                                <strong>
                                    Zestopia v1.0
                                </strong>

                            </div>


                            {/* STATION OCCUPANCY */}

                            <div className="occupancy-box">

                                <div className="occupancy-head">

                                    <span>
                                        Station Occupancy
                                    </span>

                                    <span className="occupancy-percent">

                                        {loading
                                            ? "..."
                                            : `${occupancyPercent}%`}

                                    </span>

                                </div>


                                <div className="occupancy-bar">

                                    <div
                                        className="occupancy-fill"
                                        style={{
                                            width:
                                                `${occupancyPercent}%`,
                                        }}
                                    />

                                </div>


                                <p className="occupancy-note">

                                    {loading
                                        ? "Loading station status..."
                                        : `${occupiedStations} of ${stats.stations} stations in use`}

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </>
        );

    };


    // =========================================================
    // STAFF DASHBOARD
    // =========================================================

    const renderStaffDashboard = () => {

        return (
            <>

                <div className="page-header">

                    <div>

                        <h1>
                            Good day, {userName} 👋
                        </h1>

                        <p>
                            Here's what is happening at GameZone today.
                        </p>

                    </div>


                    <button
                        className="btn-primary"
                        onClick={() =>
                            setActivePage("Bookings")
                        }
                    >
                        + New Booking
                    </button>

                </div>


                {/* STAFF STATS */}

                <div className="stats-grid">

                    <div className="stat-card blue">

                        <span className="stat-label">
                            Today's Bookings
                        </span>

                        <span className="stat-value">
                            {loading
                                ? "..."
                                : stats.todayBookings}
                        </span>

                        <span className="stat-trend">
                            Today's reservations
                        </span>

                    </div>


                    <div className="stat-card green">

                        <span className="stat-label">
                            Available Stations
                        </span>

                        <span className="stat-value">
                            {loading
                                ? "..."
                                : stats.availableStations}
                        </span>

                        <span className="stat-trend">
                            Ready for players
                        </span>

                    </div>


                    <div className="stat-card amber">

                        <span className="stat-label">
                            Active Sessions
                        </span>

                        <span className="stat-value">
                            {loading
                                ? "..."
                                : stats.activeSessions}
                        </span>

                        <span className="stat-trend">
                            Currently playing
                        </span>

                    </div>


                    <div className="stat-card purple">

                        <span className="stat-label">
                            Pending Tasks
                        </span>

                        <span className="stat-value">
                            —
                        </span>

                        <span className="stat-trend">
                            Task tracking not available
                        </span>

                    </div>

                </div>


                <div className="dashboard-grid staff-dashboard-grid">


                    {/* TODAY'S BOOKINGS */}

                    <div className="card">

                        <div className="card-header">

                            <h2 className="card-title">
                                Today's Bookings
                            </h2>

                            <button
                                className="card-action"
                                onClick={() =>
                                    setActivePage("Bookings")
                                }
                            >
                                View All
                            </button>

                        </div>


                        <div className="card-body">

                            {loading ? (

                                <p>
                                    Loading bookings...
                                </p>

                            ) : todayBookingList.length === 0 ? (

                                <div className="empty-bookings">

                                    <CalendarDays size={32} />

                                    <strong>
                                        No bookings for today
                                    </strong>

                                    <span>
                                        There are no reservations scheduled for today.
                                    </span>

                                </div>

                            ) : (

                                <div className="booking-list">

                                    {todayBookingList.map(
                                        (booking) => (

                                            <div
                                                className="booking-item"
                                                key={booking.id}
                                            >

                                                <div className="booking-main">

                                                    <strong>
                                                        #{booking.id}{" "}
                                                        {booking.user_name}
                                                    </strong>

                                                    <span>
                                                        {booking.game_name}
                                                    </span>

                                                    <span>
                                                        {booking.station_name}
                                                    </span>

                                                </div>


                                                <div className="booking-time">

                                                    <strong>
                                                        {booking.start_time} -{" "}
                                                        {booking.end_time}
                                                    </strong>

                                                    <span
                                                        className={`status-badge ${
                                                            booking.status ===
                                                            "confirmed"
                                                                ? "status-active"
                                                                : "status-pending"
                                                        }`}
                                                    >
                                                        ● {booking.status}
                                                    </span>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </div>


                    {/* STATION STATUS */}

                    <div className="card">

                        <div className="card-header">

                            <h2 className="card-title">
                                Station Status
                            </h2>

                            <button
                                className="card-action"
                                onClick={() =>
                                    setActivePage("Gaming Station")
                                }
                            >
                                View All
                            </button>

                        </div>


                        <div className="card-body">

                            {loading ? (

                                <p>
                                    Loading stations...
                                </p>

                            ) : stationList.length === 0 ? (

                                <p>
                                    No stations found.
                                </p>

                            ) : (

                                <div className="station-list">

                                    {stationList.map(
                                        (station) => (

                                            <div
                                                className="station-item"
                                                key={station.id}
                                            >

                                                <div className="station-main">

                                                    <strong>
                                                        {station.station_name}
                                                    </strong>

                                                    <span>
                                                        {station.platform_name}
                                                    </span>

                                                </div>


                                                <span
                                                    className={`status-badge ${
                                                        station.status ===
                                                        "available"
                                                            ? "status-active"
                                                            : "status-occupied"
                                                    }`}
                                                >
                                                    ● {station.status}
                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </div>


                    {/* ACTIVE SESSIONS */}

                    <div className="card">

                        <div className="card-header">

                            <h2 className="card-title">
                                Active Sessions
                            </h2>

                            <button
                                className="card-action"
                                onClick={() =>
                                    setActivePage("Game Session")
                                }
                            >
                                View All
                            </button>

                        </div>


                        <div className="card-body">

                            {loading ? (

                                <p>
                                    Loading sessions...
                                </p>

                            ) : activeSessionList.length === 0 ? (

                                <p>
                                    No active sessions.
                                </p>

                            ) : (

                                <div className="session-list">

                                    {activeSessionList.map(
                                        (session) => (

                                            <div
                                                className="session-item"
                                                key={session.id}
                                            >

                                                <div className="session-main">

                                                    <strong>
                                                        {session.user_name}
                                                    </strong>

                                                    <span>
                                                        {session.game_name}
                                                    </span>

                                                    <span>
                                                        {session.station_name}
                                                    </span>

                                                </div>


                                                <div className="session-info">

                                                    <span className="status-badge status-active">
                                                        ● Active
                                                    </span>

                                                    <span>
                                                        Started{" "}
                                                        {new Date(
                                                            session.start_time
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            }
                                                        )}
                                                    </span>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                </div>

            </>
        );

    };


    // =========================================================
    // PLAYER DASHBOARD
    // =========================================================

    const renderPlayerDashboard = () => {

        // =====================================================
        // UPCOMING BOOKINGS
        // =====================================================

        const upcomingBookings =
            bookingList

                .filter((booking) => {

                    if (
                        booking.status ===
                        "cancelled"
                    ) {
                        return false;
                    }

                    if (
                        !booking.booking_date ||
                        !booking.start_time
                    ) {
                        return false;
                    }

                    const datePart =
                        booking.booking_date.split("T")[0];

                    const bookingDateTime =
                        new Date(
                            `${datePart}T${booking.start_time}`
                        );

                    return (
                        bookingDateTime >=
                        new Date()
                    );

                })

                .sort((a, b) => {

                    const aDate =
                        new Date(
                            `${a.booking_date.split("T")[0]}T${a.start_time}`
                        );

                    const bDate =
                        new Date(
                            `${b.booking_date.split("T")[0]}T${b.start_time}`
                        );

                    return aDate - bDate;

                });


        const nextBooking =
            upcomingBookings[0];


        return (
            <>

                <div className="page-header">

                    <div>

                        <h1>
                            Welcome, {userName} 🎮
                        </h1>

                        <p>
                            Manage your bookings and gaming sessions.
                        </p>

                    </div>


                    {/* =========================================
                        PLAYER BOOK GAME BUTTON
                    ========================================= */}

                    <button
                        className="btn-primary"
                        onClick={() => {

                            sessionStorage.setItem(
                                "openCreateBooking",
                                "true"
                            );

                            setActivePage("Bookings");

                        }}
                    >
                        + Book a Game
                    </button>

                </div>


                {/* PLAYER STATS */}

                <div className="stats-grid">


                    <div className="stat-card blue">

                        <span className="stat-label">
                            Upcoming Bookings
                        </span>

                        <span className="stat-value">

                            {loading
                                ? "..."
                                : upcomingBookings.length}

                        </span>

                        <span className="stat-trend">
                            Upcoming reservations
                        </span>

                    </div>


                    <div className="stat-card green">

                        <span className="stat-label">
                            Active Session
                        </span>

                        <span className="stat-value">

                            {loading
                                ? "..."
                                : activeSessionList.length}

                        </span>

                        <span className="stat-trend">
                            Currently playing
                        </span>

                    </div>


                    <div className="stat-card amber">

                        <span className="stat-label">
                            Games Available
                        </span>

                        <span className="stat-value">

                            {loading
                                ? "..."
                                : stats.games}

                        </span>

                        <span className="stat-trend">
                            Ready to play
                        </span>

                    </div>


                    <div className="stat-card purple">

                        <span className="stat-label">
                            Membership
                        </span>

                        <span className="stat-value">

                            {loading
                                ? "..."
                                : membership
                                    ? membership.membership_type_name
                                    : "None"}

                        </span>

                        <span className="stat-trend">

                            {membership
                                ? membership.status ===
                                    "active"
                                    ? "Active membership"
                                    : "Inactive membership"
                                : "No active membership"}

                        </span>

                    </div>

                </div>


                <div className="dashboard-grid">


                    {/* GAMING SHORTCUTS */}

                    <div className="card">

                        <div className="card-header">

                            <h2 className="card-title">
                                Gaming Shortcuts
                            </h2>

                        </div>


                        <div className="card-body">

                            <div className="quick-actions">


                                {/* MY BOOKINGS */}

                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        setActivePage(
                                            "My Bookings"
                                        )
                                    }
                                >

                                    <span className="quick-action-icon">
                                        <CalendarDays size={18} />
                                    </span>

                                    <div>

                                        <strong>
                                            My Bookings
                                        </strong>

                                        <span>
                                            View your reservations
                                        </span>

                                    </div>

                                </button>


                                {/* MY GAME SESSIONS */}

                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        setActivePage(
                                            "My Game Sessions"
                                        )
                                    }
                                >

                                    <span className="quick-action-icon">
                                        <PlayCircle size={18} />
                                    </span>

                                    <div>

                                        <strong>
                                            Game Session
                                        </strong>

                                        <span>
                                            View active sessions
                                        </span>

                                    </div>

                                </button>


                                {/* BROWSE GAMES */}

                                <button
                                    className="quick-action"
                                    onClick={() =>
                                        setActivePage(
                                            "Games"
                                        )
                                    }
                                >

                                    <span className="quick-action-icon">
                                        <Gamepad2 size={18} />
                                    </span>

                                    <div>

                                        <strong>
                                            Browse Games
                                        </strong>

                                        <span>
                                            Explore available games
                                        </span>

                                    </div>

                                </button>


                                {/* MY MEMBERSHIP */}

                                <button
                                    className="quick-action membership-shortcut"
                                    onClick={() =>
                                        setActivePage(
                                            "My Membership"
                                        )
                                    }
                                >

                                    <span className="quick-action-icon">
                                        <Crown size={18} />
                                    </span>


                                    <div className="membership-shortcut-content">

                                        <strong>
                                            My Membership
                                        </strong>


                                        {loading ? (

                                            <span>
                                                Loading membership...
                                            </span>

                                        ) : membership ? (

                                            <>

                                                <span>
                                                    {
                                                        membership.membership_type_name
                                                    }
                                                </span>

                                                <small
                                                    className={
                                                        membership.status ===
                                                        "active"
                                                            ? "membership-active"
                                                            : "membership-inactive"
                                                    }
                                                >
                                                    ●{" "}
                                                    {
                                                        membership.status
                                                    }
                                                </small>

                                            </>

                                        ) : (

                                            <span>
                                                No active membership
                                            </span>

                                        )}

                                    </div>

                                </button>


                            </div>

                        </div>

                    </div>


                    {/* MY GAMING STATUS */}

                    <div className="card">

                        <div className="card-header">

                            <h2 className="card-title">
                                My Gaming Status
                            </h2>

                        </div>


                        <div className="card-body">


                            {/* CURRENT SESSION */}

                            <div className="overview-row">

                                <span>
                                    Current Session
                                </span>

                                <span
                                    className={`status-badge ${
                                        activeSessionList.length > 0
                                            ? "status-active"
                                            : "status-inactive"
                                    }`}
                                >

                                    ●{" "}

                                    {activeSessionList.length > 0
                                        ? "Active"
                                        : "No Active Session"}

                                </span>

                            </div>


                            {/* NEXT BOOKING */}

                            <div className="overview-row">

                                <span>
                                    Next Booking
                                </span>

                                <strong>

                                    {loading
                                        ? "..."
                                        : nextBooking

                                            ? new Date(
                                                `${nextBooking.booking_date.split("T")[0]}T${nextBooking.start_time}`
                                            ).toLocaleTimeString(
                                                [],
                                                {
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                }
                                            )

                                            : "No booking"}

                                </strong>

                            </div>


                            {/* MEMBERSHIP */}

                            <div className="overview-row">

                                <span>
                                    Membership
                                </span>

                                <strong>

                                    {loading
                                        ? "..."
                                        : membership
                                            ? membership.membership_type_name
                                            : "None"}

                                </strong>

                            </div>


                            {/* ACCOUNT */}

                            <div className="overview-row">

                                <span>
                                    Account
                                </span>

                                <span className="status-badge status-active">
                                    Active
                                </span>

                            </div>


                            {/* GAMING TIME */}

                            <div className="occupancy-box">

                                <div className="occupancy-head">

                                    <span>
                                        Today's Gaming Time
                                    </span>

                                    <span className="occupancy-percent">

                                        {loading
                                            ? "..."
                                            : `${Math.floor(
                                                todayGamingMinutes / 60
                                            )}h ${
                                                todayGamingMinutes % 60
                                            }m`}

                                    </span>

                                </div>


                                <div className="occupancy-bar">

                                    <div
                                        className="occupancy-fill"
                                        style={{
                                            width:
                                                `${Math.min(
                                                    (
                                                        todayGamingMinutes /
                                                        240
                                                    ) * 100,
                                                    100
                                                )}%`,
                                        }}
                                    />

                                </div>


                                <p className="occupancy-note">

                                    {todayGamingMinutes === 0
                                        ? "No gaming time recorded today."
                                        : "Gaming time calculated from today's sessions."}

                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </>
        );

    };


    // =========================================================
    // ROLE SWITCH
    // =========================================================

    if (role === "Admin") {
        return renderAdminDashboard();
    }


    if (role === "Staff") {
        return renderStaffDashboard();
    }


    return renderPlayerDashboard();

}


export default DashboardHome;