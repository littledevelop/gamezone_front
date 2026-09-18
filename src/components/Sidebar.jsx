
import {
    LayoutDashboard,
    Gamepad2,
    Monitor,
    Crown,
    CalendarDays,
    PlayCircle,
    CreditCard,
    LogOut,
    X
} from "lucide-react";

function Sidebar({
    activePage,
    setActivePage,
    visibleMenuItems,
    onLogout,
    sidebarOpen,
    setSidebarOpen
}) {
    const menuIcons = {
        Dashboard: LayoutDashboard,
        Games: Gamepad2,
        "Gaming Station": Monitor,
        Memberships: Crown,
        Bookings: CalendarDays,
        "Game Session": PlayCircle,
        Payments: CreditCard,
    };

    const getMenuLabel = (item) => {
        const labels = {
            Dashboard: "Dashboard",
            Games: "Games",
            "Gaming Station": "Gaming Station",
            Memberships: "Memberships",
            Bookings: "Bookings",
            "Game Session": "Game Session",
            Payments: "Payments",
        };

        return labels[item] || item;
    };

    return (
        <>
            {sidebarOpen && (
                <button
                    className="sidebar-overlay"
                    aria-label="Close menu"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

                <div className="sidebar-band">

                    <div className="sidebar-logo-image">
                        <img
                            src="/Zestopia_Logo_CDR15.jpg.jpeg"
                            alt="Zestopia GameZone"
                        />

                        <div className="logo-sub">
                            GAMEZONE
                        </div>
                    </div>

                    <button
                        className="sidebar-close"
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>

                </div>

                <nav className="sidebar-nav">

                    <div className="sidebar-section-title">
                        Main Menu
                    </div>

                    {visibleMenuItems.map((item) => {

                        const Icon = menuIcons[item];

                        return (
                            <button
                                key={item}
                                type="button"
                                className={`sidebar-nav-item ${
                                    activePage === item ? "active" : ""
                                }`}
                                onClick={() => setActivePage(item)}
                            >
                                <span className="nav-icon">
                                    {Icon && (
                                        <Icon
                                            size={19}
                                            strokeWidth={1.8}
                                        />
                                    )}
                                </span>

                                <span className="nav-label">
                                    {getMenuLabel(item)}
                                </span>
                            </button>
                        );
                    })}

                </nav>

                <div className="sidebar-footer">

                    <button
                        type="button"
                        className="sidebar-nav-item logout-item"
                        onClick={onLogout}
                    >
                        <span className="nav-icon">
                            <LogOut
                                size={19}
                                strokeWidth={1.8}
                            />
                        </span>

                        <span className="nav-label">
                            Logout
                        </span>
                    </button>

                </div>

            </aside>
        </>
    );
}

export default Sidebar;
