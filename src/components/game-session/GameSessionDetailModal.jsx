
function GameSessionDetailModal({
    selected,
    detailsLoading,
    canManage,
    recording,
    cameras,
    selectedCameraId,
    setSelectedCameraId,
    selectedVideo,
    setSelectedVideo,
    uploadingVideo,
    onClose,
    onUpload,
    onGenerateQRCode,
}) {
    return (
        <div
            className="session-modal-overlay"
            onClick={onClose}
        >
            <div
                className="session-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="session-detail-title"
            >
                {/* HEADER */}
                <div className="session-modal-header">
                    <div>
                        <h2 id="session-detail-title">
                            Session #{selected?.id ?? ""}
                        </h2>

                        <span>
                            Complete session information
                        </span>
                    </div>

                    <button
                        type="button"
                        className="session-modal-close"
                        onClick={onClose}
                        aria-label="Close session details"
                    >
                        ×
                    </button>
                </div>

                {/* CONTENT */}
                {detailsLoading ? (
                    <div
                        className="game-session-loading"
                        style={{ minHeight: "200px" }}
                        role="status"
                    >
                        <div className="loading-spinner" />
                        <p>Loading...</p>
                    </div>
                ) : selected ? (
                    <div className="session-modal-body">
                        <div className="session-detail-row">
                            <span>Player</span>
                            <strong>
                                {selected.user_name || "-"}
                            </strong>
                        </div>

                        <div className="session-detail-row">
                            <span>Game</span>
                            <strong>
                                {selected.game_name || "-"}
                            </strong>
                        </div>

                        <div className="session-detail-row">
                            <span>Station</span>
                            <strong>
                                {selected.station_name || "-"}
                            </strong>
                        </div>

                        <div className="session-detail-row">
                            <span>Status</span>
                            <span
                                className={`session-modal-status status-${selected.status || "unknown"}`}
                            >
                                {selected.status || "Unknown"}
                            </span>
                        </div>

                        <div className="session-detail-row">
                            <span>Duration</span>
                            <strong>
                                {selected.duration_minutes != null
                                    ? `${selected.duration_minutes}m`
                                    : "-"}
                            </strong>
                        </div>

                        <div className="session-detail-row">
                            <span>Amount</span>
                            <strong>
                                ₹
                                {Number(
                                    selected.amount || 0
                                ).toFixed(2)}
                            </strong>
                        </div>

                        {/* GAMEPLAY RECORDING */}
                        {canManage &&
                            selected.status === "completed" && (
                                <div
                                    style={{
                                        marginTop: "25px",
                                        paddingTop: "20px",
                                        borderTop: "1px solid #ddd",
                                    }}
                                >
                                    <h3 style={{ marginBottom: "15px" }}>
                                        Gameplay Recording
                                    </h3>

                                    {recording?.video_url ? (
                                        <div style={{ marginTop: "20px" }}>
                                            <h3>Uploaded Recording</h3>

                                            <video
                                                controls
                                                style={{
                                                    width: "100%",
                                                    maxWidth: "700px",
                                                    marginTop: "10px",
                                                    borderRadius: "10px",
                                                }}
                                            >
                                                <source
                                                    src={recording.video_url}
                                                    type="video/mp4"
                                                />
                                                Your browser does not support
                                                video playback.
                                            </video>

                                            <p style={{ marginTop: "8px" }}>
                                                {recording.file_name ||
                                                    "Gameplay Recording"}
                                            </p>

                                            <p>
                                                Duration:{" "}
                                                {recording.duration_seconds != null
                                                    ? `${recording.duration_seconds} seconds`
                                                    : "-"}
                                            </p>

                                            <button
                                                type="button"
                                                className="start-session-btn"
                                                style={{ marginTop: "15px" }}
                                                disabled={!recording.id}
                                                onClick={onGenerateQRCode}
                                            >
                                                Generate QR Code
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* CAMERA SELECTION */}
                                            <div className="form-group">
                                                <label htmlFor="recording_camera">
                                                    Camera
                                                </label>

                                                <select
                                                    id="recording_camera"
                                                    value={selectedCameraId}
                                                    disabled={uploadingVideo}
                                                    onChange={(e) =>
                                                        setSelectedCameraId(
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select Camera
                                                    </option>

                                                    {cameras.map((camera) => (
                                                        <option
                                                            key={camera.id}
                                                            value={camera.id}
                                                        >
                                                            {camera.camera_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* VIDEO FILE */}
                                            <div className="form-group">
                                                <label htmlFor="recording_video">
                                                    Video File
                                                </label>

                                                <input
                                                    id="recording_video"
                                                    type="file"
                                                    accept="video/*"
                                                    disabled={uploadingVideo}
                                                    onChange={(e) =>
                                                        setSelectedVideo(
                                                            e.target.files?.[0] ||
                                                            null
                                                        )
                                                    }
                                                />
                                            </div>

                                            {/* UPLOAD */}
                                            <button
                                                type="button"
                                                className="start-session-btn"
                                                disabled={
                                                    uploadingVideo ||
                                                    !selectedCameraId ||
                                                    !selectedVideo
                                                }
                                                onClick={onUpload}
                                            >
                                                {uploadingVideo
                                                    ? "Uploading..."
                                                    : "Upload Recording"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                    </div>
                ) : (
                    <div className="session-modal-body">
                        <p>Session details could not be loaded.</p>
                    </div>
                )}

                {/* FOOTER */}
                <div className="session-modal-footer">
                    <button
                        type="button"
                        className="session-modal-close-btn"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GameSessionDetailModal;
