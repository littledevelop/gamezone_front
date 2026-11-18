
import { useCallback, useEffect, useState } from "react";
import {
    Film,
    RefreshCw,
    Play,
    Video,
    Clock,
    User,
    Gamepad2,
    AlertCircle,
    CheckCircle,
    Loader2,
    QrCode,
} from "lucide-react";

import api from "../api/axios";
import "../styles/Reels.css";

function Reels() {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [generatingQRId, setGeneratingQRId] = useState(null);

    const fetchReels = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/reels");

            setReels(response.data?.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load reels. Please try again."
            );
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        const loadReels = async () => {
            await fetchReels();
        };

        loadReels();
    }, [fetchReels]);

    const handleGenerate = async (reelId) => {
        if (!window.confirm("Are you sure you want to generate this reel?")) {
            return;
        }

        try {
            setGeneratingId(reelId);
            setError("");
            setSuccess("");

            const response = await api.post(`/reels/${reelId}/generate`);

            setSuccess(
                response.data?.message ||
                `Reel #${reelId} generation completed successfully.`
            );

            await fetchReels();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Reel generation failed. Please check the backend logs."
            );

            await fetchReels();
        } finally {
            setGeneratingId(null);
        }
    };

    const handleGenerateQR = async (reelId) => {
        if (!window.confirm(`Generate QR code for Reel #${reelId}?`)) {
            return;
        }

        try {
            setGeneratingQRId(reelId);
            setError("");
            setSuccess("");

            const response = await api.post("/qr-codes/reel", {
                reel_id: reelId,
            });

            setSuccess(
                response.data?.message ||
                `QR code generated successfully for Reel #${reelId}.`
            );

        } catch (err) {
            console.error("Reel QR generation error:", err);

            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Unable to generate QR code. Please check the backend logs."
            );
        } finally {
            setGeneratingQRId(null);
        }
    };

    const filteredReels = reels.filter((reel) => {
        const searchText = search.toLowerCase();

        return [
            reel.id,
            reel.player_name,
            reel.game_name,
            reel.status,
        ].some((value) =>
            String(value || "").toLowerCase().includes(searchText)
        );
    });

    const getStatusClass = (status) => {
        const value = String(status || "draft").toLowerCase();

        if (value === "published") return "reel-status published";
        if (value === "processing") return "reel-status processing";
        if (value === "failed") return "reel-status failed";

        return "reel-status draft";
    };

    const getVideoUrl = (reel) =>
        reel.cloudinary_url ||
        reel.reel_url ||
        reel.video_url ||
        "";

    const formatDuration = (duration) => {
        if (!duration) return "Not available";

        const seconds = Number(duration);

        if (!Number.isFinite(seconds)) return duration;

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
    };

    return (
        <div className="reels-page">
            <div className="reels-page-header">
                <div>
                    <h1>Gameplay Reels</h1>
                    <p>
                        Generate and manage highlight videos from gameplay
                        recordings.
                    </p>
                </div>

                <button
                    className="reels-refresh-btn"
                    onClick={() => fetchReels(true)}
                    disabled={loading || generatingId !== null}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {success && (
                <div className="reels-message reels-success">
                    <CheckCircle size={17} />
                    {success}
                </div>
            )}

            {error && (
                <div className="reels-message reels-error">
                    <AlertCircle size={17} />
                    {error}
                </div>
            )}

            <div className="reels-summary">
                <div className="reels-stat-card">
                    <span>Total Reels</span>
                    <strong>{reels.length}</strong>
                </div>

                <div className="reels-stat-card">
                    <span>Published</span>
                    <strong>
                        {reels.filter(
                            (reel) =>
                                String(reel.status).toLowerCase() === "published"
                        ).length}
                    </strong>
                </div>

                <div className="reels-stat-card">
                    <span>Drafts</span>
                    <strong>
                        {reels.filter(
                            (reel) =>
                                String(reel.status).toLowerCase() === "draft"
                        ).length}
                    </strong>
                </div>

                <div className="reels-stat-card">
                    <span>Processing</span>
                    <strong>
                        {reels.filter(
                            (reel) =>
                                String(reel.status).toLowerCase() === "processing"
                        ).length}
                    </strong>
                </div>
            </div>

            <div className="reels-toolbar">
                <input
                    type="text"
                    placeholder="Search by reel, player or game..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <span>{filteredReels.length} reels</span>
            </div>

            <div className="reels-list-card">
                <div className="reels-list-header">
                    <div>
                        <h2>All Reels</h2>
                        <span>Gameplay highlight videos</span>
                    </div>
                </div>

                {loading ? (
                    <div className="reels-loading">
                        <Loader2 className="reels-spinner" size={28} />
                        <p>Loading reels...</p>
                    </div>
                ) : filteredReels.length === 0 ? (
                    <div className="reels-empty">
                        <Film size={42} />
                        <h3>No reels found</h3>
                        <p>
                            Create a reel draft from a completed gameplay
                            recording to get started.
                        </p>
                    </div>
                ) : (
                    <div className="reels-grid">
                        {filteredReels.map((reel) => {
                            const videoUrl = getVideoUrl(reel);
                            const isGenerating = generatingId === reel.id;

                            return (
                                <div className="reel-card" key={reel.id}>
                                    <div className="reel-card-preview">
                                        {videoUrl ? (
                                            <video
                                                src={videoUrl}
                                                controls
                                                preload="metadata"
                                            />
                                        ) : (
                                            <div className="reel-preview-placeholder">
                                                <Film size={42} />
                                                <span>Reel not generated</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="reel-card-body">
                                        <div className="reel-card-title">
                                            <h3>Reel #{reel.id}</h3>
                                            <span className={getStatusClass(reel.status)}>
                                                {reel.status || "draft"}
                                            </span>
                                        </div>

                                        <div className="reel-info">
                                            <div>
                                                <User size={15} />
                                                <span>
                                                    {reel.player_name || "Unknown Player"}
                                                </span>
                                            </div>

                                            <div>
                                                <Gamepad2 size={15} />
                                                <span>
                                                    {reel.game_name || "Unknown Game"}
                                                </span>
                                            </div>

                                            <div>
                                                <Video size={15} />
                                                <span>
                                                    Session #{reel.session_id || "N/A"}
                                                </span>
                                            </div>

                                            <div>
                                                <Clock size={15} />
                                                <span>
                                                    {formatDuration(reel.duration)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="reel-card-actions">
                                            {videoUrl && (
                                                <a
                                                    href={videoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="reel-view-btn"
                                                >
                                                    <Play size={15} />
                                                    View Reel
                                                </a>
                                            )}

                                            {String(reel.status).toLowerCase() !==
                                                "published" && (
                                                    <button
                                                        className="reel-generate-btn"
                                                        onClick={() => handleGenerate(reel.id)}
                                                        disabled={
                                                            generatingId !== null ||
                                                            loading
                                                        }
                                                    >
                                                        {isGenerating ? (
                                                            <>
                                                                <Loader2
                                                                    size={15}
                                                                    className="reels-spinner"
                                                                />
                                                                Generating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Film size={15} />
                                                                Generate Reel
                                                            </>
                                                        )}
                                                    </button>
                                                )}

                                            {String(reel.status).toLowerCase() === "published" && videoUrl && (
                                                <button
                                                    className="reel-generate-btn"
                                                    onClick={() => handleGenerateQR(reel.id)}
                                                    disabled={
                                                        generatingQRId !== null ||
                                                        generatingId !== null ||
                                                        loading
                                                    }
                                                >
                                                    {generatingQRId === reel.id ? (
                                                        <>
                                                            <Loader2
                                                                size={15}
                                                                className="reels-spinner"
                                                            />
                                                            Generating QR...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <QrCode size={15} />
                                                            Generate QR
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Reels;
