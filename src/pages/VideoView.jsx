import { useEffect, useState } from "react";
import api from "../api/axios";
function VideoView({ qrCode }) {
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadVideo = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    `/qr-codes/video/${qrCode}`
                );

                const result = response.data;

                if (!result.success) {
                    setError(
                        result.message ||
                        "Video is unavailable or QR code has expired."
                    );
                    return;
                }

                setVideo(result.data);
            } catch (err) {
                console.error("Video loading error:", err);

                setError(
                    "Video is unavailable or QR code has expired."
                );
            } finally {
                setLoading(false);
            }
        };

        if (qrCode) {
            loadVideo();
        }
    }, [qrCode]);

    if (loading) {
        return (
            <div style={{ padding: "50px", textAlign: "center" }}>
                Loading video...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "50px", textAlign: "center" }}>
                <h2>Video Unavailable</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!video) {
        return (
            <div style={{ padding: "50px", textAlign: "center" }}>
                Video not found.
            </div>
        );
    }

    return (
        <div
            style={{
                padding: "30px",
                textAlign: "center",
            }}
        >
            <h2>{video.game_name}</h2>

            <p>
                <strong>Player:</strong> {video.player_name}
            </p>

            <p>
                <strong>Station:</strong> {video.station_name}
            </p>

            <video
                controls
                autoPlay
                style={{
                    width: "100%",
                    maxWidth: "900px",
                    borderRadius: "10px",
                }}
            >
                <source
                    src={video.video_url}
                    type="video/mp4"
                />

                Your browser does not support video playback.
            </video>
        </div>
    );
}

export default VideoView;