import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import GamesPage from "../pages/Games";
import GamingStation from "../pages/GamingStation";
import Memberships from "../pages/Memberships";
import Booking from "../pages/Booking";
import GameSession from "../pages/GameSession";
import Payments from "../pages/Payments";
import DashboardHome from "../pages/DashboardHome";
import "../styles/Dashboard.css";

function Dashboard({ onLogout }) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user?.role_name;
    const [activePage, setActivePage] = useState("Dashboard");

    const menuItems = ["Dashboard", "Games", "Gaming Station", "Memberships", "Bookings", "Game Session", "Payments"];

    const roleMenuItems = {
        Admin: menuItems,
        Staff: menuItems,
        Player: ["Dashboard", "Games", "Bookings", "Game Session"],
    };


    const visibleMenuItems = roleMenuItems[role] || [];

    const renderPage = () => {
        switch (activePage) {
            case "Dashboard": return <DashboardHome user={user} setActivePage={setActivePage} />;
            case "Games": return <GamesPage />;
            case "Gaming Station": return <GamingStation />;
            case "Memberships": return <Memberships />;
            case "Bookings": return <Booking />;
            case "Game Session": return <GameSession />;
            case "Payments": return <Payments />;
            default: return <div className="empty-state"><h3>Page not available</h3><p>This page is not available yet.</p></div>;
        }
    };

    return (
        <div className="app">
            <div className="app-layout">
                <Sidebar activePage={activePage} setActivePage={setActivePage} visibleMenuItems={visibleMenuItems} onLogout={onLogout} />
                <div className="main-wrapper">
                    <Navbar />
                    <main className="page-content">{renderPage()}</main>
                </div>
            </div>
        </div>
    );
}



export default Dashboard;