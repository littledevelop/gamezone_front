import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import VideoView from "./pages/VideoView.jsx";
import "./styles/App.css";
import QRDisplay from "./pages/QRDisplay.jsx";
import QRKiosk from "./pages/QRKiosk.jsx";
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(
        !!localStorage.getItem("token")
    );

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsLoggedIn(false);
    };

    // Public video page opened from QR code
    const path = window.location.pathname;

    if (path === "/qr-display") {
        return <QRKiosk />;
    }

    if (path.startsWith("/qr/")) {
        const qrCode = path.replace("/qr/", "");

        return <QRDisplay qrCode={qrCode} />;
    }

    if (path.startsWith("/video/")) {
        const qrCode = path.replace("/video/", "");

        return <VideoView qrCode={qrCode} />;
    }

    return (
        <div>
            {isLoggedIn ? (
                <Dashboard onLogout={handleLogout} />
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;
