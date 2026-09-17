import {  useState } from "react";
import { CalendarDays, PlayCircle, Monitor, Gamepad2 } from "lucide-react";

function DashboardHome({ user, setActivePage }) {
    const [stats] = useState({
        games: 24,
        stations: 8,
        sessions: 3,
        bookings: 12
    });

    // When API ready:
    // useEffect(() => { fetch('/api/stats').then(r=>r.json()).then(setStats) }, [])

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Welcome back, {user?.full_name || 'GameZone Admin'} 👋</h1>
                    <p>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • Manage your operations</p>
                </div>
                <button className="btn-primary" onClick={() => setActivePage("Bookings")}>
                    + New Booking
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card blue">
                    <span className="stat-label">Total Games</span>
                    <span className="stat-value">{stats.games}</span>
                    <span className="stat-trend">+2 this week ▲</span>
                </div>
                <div className="stat-card green">
                    <span className="stat-label">Gaming Stations</span>
                    <span className="stat-value">{stats.stations}</span>
                    <span className="stat-trend">All operational</span>
                </div>
                <div className="stat-card amber">
                    <span className="stat-label">Active Sessions</span>
                    <span className="stat-value">{stats.sessions}</span>
                    <span className="stat-trend">2 live now</span>
                </div>
                <div className="stat-card purple">
                    <span className="stat-label">Today's Bookings</span>
                    <span className="stat-value">{stats.bookings}</span>
                    <span className="stat-trend">+4 vs yesterday ▲</span>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header"><h2 className="card-title">Quick Actions</h2></div>
                    <div className="card-body">
                        <div className="quick-actions">
                            <button className="quick-action" onClick={() => setActivePage("Bookings")}><span className="quick-action-icon"><CalendarDays size={18} color="white" /></span><div><strong>Bookings</strong><span>Manage reservations</span></div></button>
                            <button className="quick-action" onClick={() => setActivePage("Game Session")}><span className="quick-action-icon"><PlayCircle size={18} color="white" /></span><div><strong>Game Sessions</strong><span>Monitor active sessions</span></div></button>
                            <button className="quick-action" onClick={() => setActivePage("Gaming Station")}><span className="quick-action-icon"><Monitor size={18} color="white" /></span><div><strong>Gaming Stations</strong><span>Manage available stations</span></div></button>
                            <button className="quick-action" onClick={() => setActivePage("Games")}><span className="quick-action-icon"><Gamepad2 size={18} color="white" /></span><div><strong>Games</strong><span>Manage games and platforms</span></div></button>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h2 className="card-title">System Overview</h2></div>
                    <div className="card-body">
                        <div className="overview-row"><span>System Status</span><span className="status-badge status-active">● Online</span></div>
                        <div className="overview-row"><span>User Role</span><strong>{user?.role_name || "Admin"}</strong></div>
                        <div className="overview-row"><span>Account</span><span className="status-badge status-active">Active</span></div>
                        <div className="overview-row"><span>GameZone System</span><strong>Zestopia v1.0</strong></div>
                        <div className="occupancy-box">
                            <div className="occupancy-head"><span>Station Occupancy</span><span className="occupancy-percent">68%</span></div>
                            <div className="occupancy-bar"><div className="occupancy-fill" style={{ width: '68%' }}></div></div>
                            <p className="occupancy-note">5 of 8 stations in use</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
export default DashboardHome;