
import { useEffect, useState } from "react";
import api from "../api/axios";

function ReelView({ qrCode }) {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadReel = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    `/qr-codes/reel/${qrCode}`
                );

                if (response.data?.success && response.data?.data) {
                    setData(response.data.data);
                } else {
                    setError(
                        response.data?.message || "Reel is unavailable."
                    );
                }
            } catch (err) {
                console.error("Reel loading error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load this reel. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        if (qrCode) {
            loadReel();
        }
    }, [qrCode]);

    if (!qrCode) {
        return (
            <div style={styles.center}>
                <h2>Video Unavailable</h2>
                <p>Invalid QR code.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={styles.center}>
                <h2>Loading your gameplay...</h2>
            </div>
        );
    }

    if (error || !data?.reel_url) {
        return (
            <div style={styles.center}>
                <h2>Video Unavailable</h2>
                <p>{error || "The gameplay video could not be found."}</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h1>Your Gameplay Reel</h1>

                <video
                    src={data.reel_url}
                    controls
                    playsInline
                    preload="metadata"
                    style={styles.video}
                >
                    Your browser does not support video playback.
                </video>

                <h2>{data.game_name}</h2>

                <p>
                    <strong>Player:</strong> {data.player_name}
                </p>

                <p>
                    <strong>Station:</strong> {data.station_name}
                </p>

                <p>Enjoy your gameplay highlights!</p>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#070A3A",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box",
    },
    card: {
        background: "white",
        color: "#070A3A",
        padding: "24px",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "650px",
        textAlign: "center",
        boxSizing: "border-box",
    },
    video: {
        width: "100%",
        maxHeight: "75vh",
        background: "#000",
        borderRadius: "12px",
        display: "block",
    },
    center: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
    },
};

export default ReelView;
