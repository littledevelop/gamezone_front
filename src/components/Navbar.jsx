import { Bell, Search } from "lucide-react";
import { getStoredUser } from "../utils/auth";
import "../styles/Navbar.css";

function Navbar() {
    const user = getStoredUser();

    return (
        <header className="navbar">
            {/* Left - Search */}
            <div className="navbar-left">
                <div className="navbar-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search games, stations, bookings..."
                    />
                </div>
            </div>

            {/* Right - Actions */}
            <div className="navbar-right">
                <button className="navbar-notification">
                    <Bell size={19} />
                    <span className="notification-dot"></span>
                </button>

                <div className="navbar-user">
                    <div className="navbar-avatar">
                        {user?.full_name?.charAt(0)?.toUpperCase() || "A"}
                    </div>

                    <div className="navbar-user-info">
                        <strong>
                            {user?.full_name || "Admin"}
                        </strong>
                        <span>
                            {user?.role_name || "Administrator"}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;