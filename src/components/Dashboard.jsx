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
import Camera from "../pages/Camera";
import "../styles/Dashboard.css";

function Dashboard({ onLogout }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role_name;

  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --------------------------------------------------
  // ROLE BASED MENU
  // --------------------------------------------------

  const roleMenuItems = {
    Admin: [
      "Dashboard",
      "Games",
      "Gaming Station",
      "Cameras",
      "Memberships",
      "Bookings",
      "Game Session",
      "Payments",
      "Recordings",
      "Profile",
    ],

    Staff: [
      "Dashboard",
      "Games",
      "Gaming Station",
      "Cameras",
      "Memberships",
      "Bookings",
      "Game Session",
      "Payments",
      "Recordings",
      "Profile",
    ],

    Player: [
      "Dashboard",
      "Games",
      "My Bookings",
      "My Membership",
      "My Game Sessions",
      "My Payments",
      "My Recordings",
      "Profile",
    ],
  };

  const visibleMenuItems = roleMenuItems[role] || [];

  // --------------------------------------------------
  // PAGE CHANGE
  // --------------------------------------------------

  const handlePageChange = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  // --------------------------------------------------
  // RENDER PAGE
  // --------------------------------------------------

  const renderPage = () => {
    switch (activePage) {
      case "Dashboard":
        return <DashboardHome user={user} setActivePage={handlePageChange} />;

      case "Games":
        return <GamesPage setActivePage={handlePageChange} />;

      case "Gaming Station":
        return <GamingStation />;

      case "Cameras":
        return <Camera />;

      case "Memberships":
      case "My Membership":
        return <Memberships />;

      case "Bookings":
        return <Booking pageType="Bookings" setActivePage={handlePageChange} />;

      case "My Bookings":
        return (
          <Booking pageType="My Bookings" setActivePage={handlePageChange} />
        );
      case "Game Session":
      case "My Game Sessions":
        return <GameSession />;

      case "Payments":
      case "My Payments":
        return <Payments />;

      case "Recordings":
      case "My Recordings":
        return (
          <div className="empty-state">
            <h3>Recordings</h3>
            <p>Gameplay recordings will appear here.</p>
          </div>
        );

      case "Profile":
        return (
          <div className="empty-state">
            <h3>Profile</h3>
            <p>Profile page will appear here.</p>
          </div>
        );

      default:
        return (
          <div className="empty-state">
            <h3>Page not available</h3>
            <p>This page is not available yet.</p>
          </div>
        );
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="app">
      <div className="app-layout">
        <Sidebar
          activePage={activePage}
          setActivePage={handlePageChange}
          visibleMenuItems={visibleMenuItems}
          onLogout={onLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="main-wrapper">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />

          <main className="page-content">{renderPage()}</main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
