
function GameSessionStartModal({
    bookings,
    bookingsLoading,
    selectedBookingId,
    setSelectedBookingId,
    starting,
    startError,
    onClose,
    onStart,
}) {
    const selectedBooking = bookings.find(
        (booking) =>
            String(booking.id) === String(selectedBookingId)
    );

    const handleOverlayClick = () => {
        if (!starting) {
            onClose();
        }
    };

    return (
        <div
            className="session-modal-overlay"
            onClick={handleOverlayClick}
        >
            <div
                className="session-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="start-session-title"
            >
                {/* HEADER */}
                <div className="session-modal-header">
                    <div>
                        <h2 id="start-session-title">
                            Start Game Session
                        </h2>

                        <span>
                            Select a confirmed booking to start
                            the session
                        </span>
                    </div>

                    <button
                        type="button"
                        className="session-modal-close"
                        disabled={starting}
                        onClick={onClose}
                        aria-label="Close start session modal"
                    >
                        ×
                    </button>
                </div>

                {/* BODY */}
                <div className="session-modal-body">
                    {startError && (
                        <div
                            className="session-start-error"
                            role="alert"
                        >
                            {startError}
                        </div>
                    )}

                    {bookingsLoading ? (
                        <div
                            className="booking-loading-message"
                            role="status"
                        >
                            Loading bookings...
                        </div>
                    ) : bookings.length === 0 ? (
                        <div
                            className="empty-game-sessions"
                            style={{ padding: "30px" }}
                        >
                            <h3>No Bookings</h3>

                            <p>
                                No confirmed bookings available.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* BOOKING SELECT */}
                            <div className="form-group">
                                <label htmlFor="booking_id">
                                    Select Booking
                                </label>

                                <select
                                    id="booking_id"
                                    name="booking_id"
                                    value={selectedBookingId}
                                    disabled={starting}
                                    onChange={(e) =>
                                        setSelectedBookingId(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Choose booking
                                    </option>

                                    {bookings.map((booking) => (
                                        <option
                                            key={booking.id}
                                            value={booking.id}
                                        >
                                            #{booking.id} -{" "}
                                            {booking.game_name ||
                                                "Game"}{" "}
                                            -{" "}
                                            {booking.user_name ||
                                                booking.player_name ||
                                                "Player"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* SELECTED BOOKING DETAILS */}
                            {selectedBooking && (
                                <div className="selected-booking-details">
                                    <div className="session-detail-row">
                                        <span>Player</span>

                                        <strong>
                                            {selectedBooking.user_name ||
                                                selectedBooking.player_name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="session-detail-row">
                                        <span>Game</span>

                                        <strong>
                                            {selectedBooking.game_name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="session-detail-row">
                                        <span>Station</span>

                                        <strong>
                                            {selectedBooking.station_name ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="session-detail-row">
                                        <span>Booking Time</span>

                                        <strong>
                                            {selectedBooking.start_time ||
                                                "-"}{" "}
                                            -{" "}
                                            {selectedBooking.end_time ||
                                                "-"}
                                        </strong>
                                    </div>

                                    <div className="session-detail-row">
                                        <span>Amount</span>

                                        <strong>
                                            ₹
                                            {Number(
                                                selectedBooking.amount || 0
                                            ).toFixed(2)}
                                        </strong>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* FOOTER */}
                <div className="session-modal-footer">
                    <button
                        type="button"
                        className="session-modal-close-btn"
                        disabled={starting}
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="start-session-btn"
                        disabled={
                            !selectedBookingId ||
                            !selectedBooking ||
                            bookingsLoading ||
                            starting
                        }
                        onClick={onStart}
                    >
                        {starting ? "Starting..." : "Start Game"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GameSessionStartModal;
