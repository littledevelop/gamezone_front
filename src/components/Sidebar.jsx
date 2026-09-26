import {
    LayoutDashboard,
    Gamepad2,
    Monitor,
    Camera,
    Crown,
    CalendarDays,
    PlayCircle,
    CreditCard,
    Video,
    User,
    LogOut,
    X,
} from "lucide-react";

function Sidebar({
    activePage,
    setActivePage,
    onLogout,
    sidebarOpen,
    setSidebarOpen,
}) {
    // --------------------------------------------------
    // CURRENT USER / ROLE
    // --------------------------------------------------

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user?.role_name || "Player";

    // --------------------------------------------------
    // ROLE BASED MENU
    // --------------------------------------------------

    const menuByRole = {
        Admin: [
            {
                label: "Dashboard",
                icon: LayoutDashboard,
            },
            {
                label: "Games",
                icon: Gamepad2,
            },
            {
                label: "Gaming Station",
                icon: Monitor,
            },
            {
                label: "Cameras",
                icon: Camera,
            },
            {
                label: "Memberships",
                icon: Crown,
            },
            {
                label: "Bookings",
                icon: CalendarDays,
            },
            {
                label: "Game Session",
                icon: PlayCircle,
            },
            {
                label: "Payments",
                icon: CreditCard,
            },
            {
                label: "Recordings",
                icon: Video,
            },
            {
                label: "Profile",
                icon: User,
            },
        ],

        Staff: [
            {
                label: "Dashboard",
                icon: LayoutDashboard,
            },
            {
                label: "Games",
                icon: Gamepad2,
            },
            {
                label: "Gaming Station",
                icon: Monitor,
            },
            {
                label: "Memberships",
                icon: Crown,
            },
            {
                label: "Bookings",
                icon: CalendarDays,
            },
            {
                label: "Game Session",
                icon: PlayCircle,
            },
            {
                label: "Payments",
                icon: CreditCard,
            },
            {
                label: "Recordings",
                icon: Video,
            },
            {
                label: "Profile",
                icon: User,
            },
        ],

        Player: [
            {
                label: "Dashboard",
                icon: LayoutDashboard,
            },
            {
                label: "Games",
                icon: Gamepad2,
            },
            {
                label: "My Bookings",
                icon: CalendarDays,
            },
            {
                label: "My Membership",
                icon: Crown,
            },
            {
                label: "My Game Sessions",
                icon: PlayCircle,
            },
            {
                label: "My Payments",
                icon: CreditCard,
            },
            {
                label: "My Recordings",
                icon: Video,
            },
            {
                label: "Profile",
                icon: User,
            },
        ],
    };

    const menuItems = menuByRole[role] || menuByRole.Player;

    // --------------------------------------------------
    // HANDLE MENU CLICK
    // --------------------------------------------------

    const handleMenuClick = (page) => {
        setActivePage(page);

        // Close mobile sidebar after selecting a page
        if (setSidebarOpen) {
            setSidebarOpen(false);
        }
    };

    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------

    const handleLogout = () => {
        if (setSidebarOpen) {
            setSidebarOpen(false);
        }

        onLogout();
    };

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    return (
        <>
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <button
                    type="button"
                    className="sidebar-overlay"
                    aria-label="Close menu"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`sidebar ${
                    sidebarOpen ? "sidebar-open" : ""
                }`}
            >
                {/* -------------------------------------- */}
                {/* LOGO */}
                {/* -------------------------------------- */}

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

                    {/* Mobile Close Button */}
                    <button
                        className="sidebar-close"
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* -------------------------------------- */}
                {/* ROLE */}
                {/* -------------------------------------- */}

                <div className="sidebar-role">
                    <span className="sidebar-role-dot"></span>

                    <div>
                        <div className="sidebar-role-name">
                            {role}
                        </div>

                        <div className="sidebar-role-text">
                            {role === "Admin"
                                ? "Full Management"
                                : role === "Staff"
                                ? "Operations"
                                : "Player Account"}
                        </div>
                    </div>
                </div>

                {/* -------------------------------------- */}
                {/* NAVIGATION */}
                {/* -------------------------------------- */}

                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">
                        Main Menu
                    </div>

                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.label}
                                type="button"
                                className={`sidebar-nav-item ${
                                    activePage === item.label
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleMenuClick(item.label)
                                }
                            >
                                <span className="nav-icon">
                                    <Icon
                                        size={19}
                                        strokeWidth={1.8}
                                    />
                                </span>

                                <span className="nav-label">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>

                {/* -------------------------------------- */}
                {/* LOGOUT */}
                {/* -------------------------------------- */}

                <div className="sidebar-footer">
                    <button
                        type="button"
                        className="sidebar-nav-item logout-item"
                        onClick={handleLogout}
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