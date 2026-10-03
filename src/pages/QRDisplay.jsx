import { useEffect, useState } from "react";
import QRCode from "qrcode";
import api from "../api/axios";
function QRDisplay({ qrCode }) {
    const [data, setData] = useState(null);
    const [qrImage, setQrImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadQR = async () => {
            try {
                const response = await api.get(
                    `/qr-codes/video/${qrCode}`
                );

                const result = response.data;
                if (result.success) {
                    const qrData = result.data;

                    setData(qrData);

                    const videoUrl =
                        `${window.location.origin}/video/${qrCode}`;

                    //                 const videoUrl =
                    // `http://10.173.94.209:5173/video/${qrCode}`;

                    const image = await QRCode.toDataURL(videoUrl, {
                        width: 500,
                        margin: 2,
                    });

                    setQrImage(image);
                } else {
                    setError(
                        result.message || "QR code unavailable"
                    );
                }
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "QR code is expired or unavailable."
                );
            } finally {
                setLoading(false);
            }
        };

        loadQR();
    }, [qrCode]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                Loading QR code...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>QR Code Unavailable</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                padding: "20px",
                boxSizing: "border-box",
                width: "100%",
            }}
        >
            <div>
                <h1>Scan to Watch Your Video</h1>

                {qrImage && (
                    <img
                        src={qrImage}
                        alt="Video QR Code"
                        style={{
                            width: "min(500px, 85vw)",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                            margin: "0 auto",
                        }}
                    />
                )}

                <h2>{data.game_name}</h2>

                <p style={{
                    overflowWrap: "anywhere",
                }}>
                    <strong>Player:</strong> {data.player_name}
                </p>

                <p>
                    <strong>Station:</strong> {data.station_name}
                </p>

                <p>
                    Scan this QR code with your phone to watch your
                    gameplay video.
                </p>
            </div>
        </div>
    );
}

export default QRDisplay;

