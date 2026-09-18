
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
        sessions: 0,
        bookings: 0
    });

        const [loading, setLoading] = useState(true);

    useEffect(() => {
    const loadStats = async () => {
        try {
            const [games, stations, sessions, bookings] =
                await Promise.all([
                    api.get("/games"),
                    api.get("/gaming-stations"),
                    api.get("/game-session"),
                    api.get("/booking")
                ]);

            const sessionData = sessions.data.data || [];
            
            const activeSessions = sessionData.filter((session)=>session.status === "active").length;
            
            const bookingData = bookings.data.bookings || [];

            const today = new Date();

          const todayBookings = bookingData.filter((booking) => {
    const bookingDate = new Date(booking.booking_date);

    return (
        bookingDate.getDate() === today.getDate() &&
        bookingDate.getMonth() === today.getMonth() &&
        bookingDate.getFullYear() === today.getFullYear()
    );
}).length;
            setStats({
                games: games.data.count || 0,
                stations: stations.data.data?.length || 0,
                activeSessions,
                todayBookings
            });

        } catch (error) {
            console.error(
                "Dashboard data error:",
                error.response?.data || error.message
            );
        } finally {
            setLoading(false);
        }
    };

    loadStats();
}, []);
    /* =========================================
       ADMIN DASHBOARD
    ========================================= */

    const renderAdminDashboard = () => {
        return (
            <>
                <div className="page-header">
                    <div>
                        <h1>Welcome back, {userName} 👋</h1>

                        <p>
                            Manage your GameZone operations and monitor
                            today's activity.
                        </p>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() => setActivePage("Bookings")}
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
                              {loading ? "..." : stats.games}

                        </span>

                        <span className="stat-trend">
                            +2 this week ▲
                        </span>
                    </div>

                    <div className="stat-card green">
                        <span className="stat-label">
                            Gaming Stations
                        </span>

                        <span className="stat-value">
                              {loading ? "..." : stats.stations}

                        </span>

                        <span className="stat-trend">
                            All operational
                        </span>
                    </div>

                    <div className="stat-card amber">
                        <span className="stat-label">
                            Active Sessions
                        </span>

                        <span className="stat-value">
                                                       {loading ? "..." : stats.activeSessions}

                        </span>

                        <span className="stat-trend">
                            2 live now
                        </span>
                    </div>

                    <div className="stat-card purple">
                        <span className="stat-label">
                            Today's Bookings
                        </span>

                        <span className="stat-value">
                           {loading ? "..." : stats.todayBookings}

                        </span>

                        <span className="stat-trend">
                            +4 vs yesterday ▲
                        </span>
                    </div>

                </div>

                {/* ADMIN CONTENT */}

                <div className="dashboard-grid">

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
                                        <strong>Bookings</strong>
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
                                        <strong>Game Sessions</strong>
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
                                        <strong>Gaming Stations</strong>
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
                                        <strong>Games</strong>
                                        <span>
                                            Manage games
                                        </span>
                                    </div>
                                </button>

                            </div>

                        </div>
                    </div>

                    <div className="card">

                        <div className="card-header">
                            <h2 className="card-title">
                                System Overview
                            </h2>
                        </div>

                        <div className="card-body">

                            <div className="overview-row">
                                <span>System Status</span>

                                <span className="status-badge status-active">
                                    ● Online
                                </span>
                            </div>

                            <div className="overview-row">
                                <span>User Role</span>

                                <strong>
                                    Administrator
                                </strong>
                            </div>

                            <div className="overview-row">
                                <span>Account</span>

                                <span className="status-badge status-active">
                                    Active
                                </span>
                            </div>

                            <div className="overview-row">
                                <span>GameZone System</span>

                                <strong>
                                    Zestopia v1.0
                                </strong>
                            </div>

                            <div className="occupancy-box">

                                <div className="occupancy-head">
                                    <span>
                                        Station Occupancy
                                    </span>

                                    <span className="occupancy-percent">
                                        68%
                                    </span>
                                </div>

                                <div className="occupancy-bar">
                                    <div
                                        className="occupancy-fill"
                                        style={{ width: "68%" }}
                                    />
                                </div>

                                <p className="occupancy-note">
                                    5 of 8 stations in use
                                </p>

                            </div>

                        </div>
                    </div>

                </div>
            </>
        );
    };


    /* =========================================
       STAFF DASHBOARD
    ========================================= */

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
                        onClick={() => setActivePage("Bookings")}
                    >
                        + New Booking
                    </button>
                </div>

                <div className="stats-grid">

                    <div className="stat-card blue">
                        <span className="stat-label">
                            Today's Bookings
                        </span>

                        <span className="stat-value">
                            12
                        </span>

                        <span className="stat-trend">
                            4 upcoming
                        </span>
                    </div>

                    <div className="stat-card green">
                        <span className="stat-label">
                            Available Stations
                        </span>

                        <span className="stat-value">
                            3
                        </span>

                        <span className="stat-trend">
                            5 currently occupied
                        </span>
                    </div>

                    <div className="stat-card amber">
                        <span className="stat-label">
                            Active Sessions
                        </span>

                        <span className="stat-value">
                            3
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
                            5
                        </span>

                        <span className="stat-trend">
                            Need attention
                        </span>
                    </div>

                </div>

                <div className="dashboard-grid">

                    <div className="card">

                        <div className="card-header">
                            <h2 className="card-title">
                                Staff Quick Actions
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
                                            Today's Bookings
                                        </strong>

                                        <span>
                                            Check reservations
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
                                            Start or monitor games
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
                                            Stations
                                        </strong>

                                        <span>
                                            Check station status
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
                                            View available games
                                        </span>
                                    </div>
                                </button>

                            </div>

                        </div>
                    </div>

                    <div className="card">

                        <div className="card-header">
                            <h2 className="card-title">
                                Today's Operations
                            </h2>
                        </div>

                        <div className="card-body">

                            <div className="overview-row">
                                <span>Station Status</span>

                                <span className="status-badge status-active">
                                    ● Operational
                                </span>
                            </div>

                            <div className="overview-row">
                                <span>Active Sessions</span>

                                <strong>
                                    3 Running
                                </strong>
                            </div>

                            <div className="overview-row">
                                <span>Upcoming Bookings</span>

                                <strong>
                                    4
                                </strong>
                            </div>

                            <div className="overview-row">
                                <span>Shift Status</span>

                                <span className="status-badge status-active">
                                    Active
                                </span>
                            </div>

                        </div>
                    </div>

                </div>
            </>
        );
    };


    /* =========================================
       PLAYER DASHBOARD
    ========================================= */

    const renderPlayerDashboard = () => {
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

                    <button
                        className="btn-primary"
                        onClick={() => setActivePage("Bookings")}
                    >
                        + Book a Game
                    </button>

                </div>

                <div className="stats-grid">

                    <div className="stat-card blue">

                        <span className="stat-label">
                            Upcoming Bookings
                        </span>

                        <span className="stat-value">
                            2
                        </span>

                        <span className="stat-trend">
                            Next booking today
                        </span>

                    </div>

                    <div className="stat-card green">

                        <span className="stat-label">
                            Active Session
                        </span>

                        <span className="stat-value">
                            1
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
                            24
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
                            VIP
                        </span>

                        <span className="stat-trend">
                            Active membership
                        </span>

                    </div>

                </div>

                <div className="dashboard-grid">

                    <div className="card">

                        <div className="card-header">
                            <h2 className="card-title">
                                Gaming Shortcuts
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
                                            My Bookings
                                        </strong>

                                        <span>
                                            View your reservations
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
                                            Game Session
                                        </strong>

                                        <span>
                                            View active sessions
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
                                            Browse Games
                                        </strong>

                                        <span>
                                            Explore available games
                                        </span>
                                    </div>
                                </button>

                                <button
                                    className="quick-action"
                                >
                                    <span className="quick-action-icon">
                                        <Crown size={18} />
                                    </span>

                                    <div>
                                        <strong>
                                            My Membership
                                        </strong>

                                        <span>
                                            View membership details
                                        </span>
                                    </div>
                                </button>

                            </div>

                        </div>
                    </div>

                    <div className="card">

                        <div className="card-header">
                            <h2 className="card-title">
                                My Gaming Status
                            </h2>
                        </div>

                        <div className="card-body">

                            <div className="overview-row">

                                <span>
                                    Current Session
                                </span>

                                <span className="status-badge status-active">
                                    ● Active
                                </span>

                            </div>

                            <div className="overview-row">

                                <span>
                                    Next Booking
                                </span>

                                <strong>
                                    Today, 6:00 PM
                                </strong>

                            </div>

                            <div className="overview-row">

                                <span>
                                    Membership
                                </span>

                                <strong>
                                    VIP
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

                            <div className="occupancy-box">

                                <div className="occupancy-head">

                                    <span>
                                        Today's Gaming Time
                                    </span>

                                    <span className="occupancy-percent">
                                        2.5 hrs
                                    </span>

                                </div>

                                <div className="occupancy-bar">

                                    <div
                                        className="occupancy-fill"
                                        style={{ width: "62%" }}
                                    />

                                </div>

                                <p className="occupancy-note">
                                    2.5 of 4 hours used today
                                </p>

                            </div>

                        </div>
                    </div>

                </div>
            </>
        );
    };


    /* =========================================
       ROLE SWITCH
    ========================================= */

    if (role === "Admin") {
        return renderAdminDashboard();
    }

    if (role === "Staff") {
        return renderStaffDashboard();
    }

    return renderPlayerDashboard();
}

export default DashboardHome;
