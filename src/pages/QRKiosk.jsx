import { useEffect, useState } from "react";
import QRCode from "qrcode";
import api from "../api/axios";

function QRKiosk() {
    const [data, setData] = useState(null);
    const [qrImage, setQrImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadLatestQR = async () => {
        try {
            const response = await api.get("/qr-codes/latest");

            const result = response.data;

            if (result.success && result.data) {
                const qrData = result.data;

                setData(qrData);

                const videoUrl =
                    `${window.location.origin}/video/${qrData.qr_code}`;

                const image = await QRCode.toDataURL(videoUrl, {
                    width: 600,
                    margin: 2,
                });

                setQrImage(image);
                setError("");
            } else {
                setData(null);
                setQrImage("");
            }
        } catch (err) {
            console.error("Kiosk QR error:", err);
            setError("Unable to check for new QR code.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
    const checkQR = async () => {
        await loadLatestQR();
    };

    checkQR();

    const interval = setInterval(checkQR, 5000);

    return () => clearInterval(interval);
}, []);

    if (loading) {
        return (
            <div style={styles.center}>
                <h2>Loading...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.center}>
                <h2>GameZone</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={styles.center}>
                <h1>GAMEZONE</h1>

                <h2>Waiting for your gameplay...</h2>

                <p>
                    Your gameplay video and QR code will appear here
                    after the game is completed.
                </p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>

                <h1>Scan to Watch Your Gameplay</h1>

                {qrImage && (
                    <img
                        src={qrImage}
                        alt="Gameplay QR Code"
                        style={styles.qr}
                    />
                )}

                <h2>{data.game_name}</h2>

                <p>
                    <strong>Player:</strong>{" "}
                    {data.player_name}
                </p>

                <p>
                    <strong>Station:</strong>{" "}
                    {data.station_name}
                </p>

                <p style={styles.instruction}>
                    Scan this QR code with your phone
                    to watch your gameplay video.
                </p>

                <p style={styles.expiry}>
                    This QR code is available temporarily.
                </p>

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
        textAlign: "center",
        padding: "30px",
        boxSizing: "border-box",
        color: "white",
    },

    card: {
        background: "white",
        color: "#070A3A",
        padding: "30px",
        borderRadius: "20px",
        maxWidth: "700px",
        width: "100%",
    },

    qr: {
        width: "600px",
        maxWidth: "80vw",
        height: "auto",
    },

    center: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "30px",
    },

    instruction: {
        fontSize: "18px",
        fontWeight: "600",
    },

    expiry: {
        fontSize: "14px",
        color: "#666",
    },
};

export default QRKiosk;