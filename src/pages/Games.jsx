import { useEffect, useState } from "react";
import {
  Gamepad2,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import api from "../api/axios";
import "../styles/Games.css";

function Games() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role_name || "Player";

  const canManageGames = role === "Admin" || role === "Staff";
  const canDeleteGames = role === "Admin";

  const [games, setGames] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [gameTypes, setGameTypes] = useState([]);

  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    game_name: "",
    platform_id: "",
    game_type_id: "",
    genre: "",
    description: "",
    status: "active",
  });

  const [formErrors, setFormErrors] = useState({
    game_name: "",
    platform_id: "",
    game_type_id: "",
  });

  // -----------------------------------------
  // Show message
  // -----------------------------------------
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  // -----------------------------------------
  // Load games
  // -----------------------------------------
  const loadGames = async () => {
    try {
      const res = await api.get("/games");

      if (res.data?.success) {
        setGames(res.data.games || []);
      } else if (Array.isArray(res.data)) {
        setGames(res.data);
      } else {
        setGames(res.data.games || []);
      }
    } catch (error) {
      console.error("Load games error:", error);
      showMessage("Failed to load games", "error");
    }
  };

  // -----------------------------------------
  // Initial load
  // -----------------------------------------
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [gamesRes, platformsRes, gameTypesRes] =
          await Promise.all([
            api.get("/games"),
            api.get("/platforms"),
            api.get("/game-types"),
          ]);

        if (!isMounted) return;

        // Games
        if (gamesRes.data?.success) {
          setGames(gamesRes.data.games || []);
        } else if (Array.isArray(gamesRes.data)) {
          setGames(gamesRes.data);
        } else {
          setGames(gamesRes.data.games || []);
        }

        // Platforms
        if (platformsRes.data?.success) {
          setPlatforms(platformsRes.data.platforms || []);
        }

        // Game Types
        if (gameTypesRes.data?.success) {
          setGameTypes(gameTypesRes.data.gameTypes || []);
        }
      } catch (error) {
        console.error("Load games page data error:", error);

        if (isMounted) {
          setMessage("Failed to load games data");
          setMessageType("error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // -----------------------------------------
  // Search
  // -----------------------------------------
  const filtered = games.filter((game) => {
    const searchText = filter.toLowerCase();

    return (
      (game.game_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (game.platform_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (game.game_type_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (game.genre || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // -----------------------------------------
  // Add game
  // -----------------------------------------
  const handleAddGame = () => {
    setEditingGame(null);

    setFormData({
      game_name: "",
      platform_id: "",
      game_type_id: "",
      genre: "",
      description: "",
      status: "active",
    });

    setFormErrors({
      game_name: "",
      platform_id: "",
      game_type_id: "",
    });

    setModalOpen(true);
  };

  // -----------------------------------------
  // Edit game
  // -----------------------------------------
  const handleEditGame = (game) => {
    setEditingGame(game);

    setFormData({
      game_name: game.game_name || "",
      platform_id: game.platform_id || "",
      game_type_id: game.game_type_id || "",
      genre: game.genre || "",
      description: game.description || "",
      status: game.status || "active",
    });

    setFormErrors({
      game_name: "",
      platform_id: "",
      game_type_id: "",
    });

    setModalOpen(true);
  };

  // -----------------------------------------
  // Close modal
  // -----------------------------------------
  const handleCloseModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingGame(null);

    setFormErrors({
      game_name: "",
      platform_id: "",
      game_type_id: "",
    });
  };

  // -----------------------------------------
  // Form change
  // -----------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (typeof value === "string" && value.trim()) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // -----------------------------------------
  // Save game
  // -----------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {
      game_name: "",
      platform_id: "",
      game_type_id: "",
    };

    if (!formData.game_name.trim()) {
      errors.game_name = "Game name is required";
    }

    if (!formData.platform_id) {
      errors.platform_id = "Please select a platform";
    }

    if (!formData.game_type_id) {
      errors.game_type_id = "Please select a game type";
    }

    if (
      errors.game_name ||
      errors.platform_id ||
      errors.game_type_id
    ) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({
      game_name: "",
      platform_id: "",
      game_type_id: "",
    });

    setSaving(true);

    try {
      const payload = {
        game_name: formData.game_name.trim(),
        platform_id: Number(formData.platform_id),
        game_type_id: formData.game_type_id
          ? Number(formData.game_type_id)
          : null,
        genre: formData.genre.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (editingGame) {
        await api.put(`/games/${editingGame.id}`, payload);
        showMessage("Game updated successfully");
      } else {
        await api.post("/games", payload);
        showMessage("Game created successfully");
      }

      setModalOpen(false);
      setEditingGame(null);

      await loadGames();
    } catch (error) {
      console.error("Save game error:", error);

      showMessage(
        error.response?.data?.message ||
        "Failed to save game",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------
  // Delete game
  // -----------------------------------------
  const handleDeleteGame = async (game) => {
    if (!canDeleteGames) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${game.game_name}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/games/${game.id}`);

      showMessage("Game deleted successfully");

      await loadGames();
    } catch (error) {
      console.error("Delete game error:", error);

      showMessage(
        error.response?.data?.message ||
        "Failed to delete game",
        "error"
      );
    }
  };

  // -----------------------------------------
  // Loading
  // -----------------------------------------
  if (loading) {
    return (
      <div className="games-state">
        <div className="games-loader"></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="games-page">

      {/* PAGE HEADER */}
      <div className="games-page-header">
        <div className="games-heading">
          <h1>Games Library</h1>

          <p>
            {games.length} games available
            {canManageGames
              ? " • Manage your catalog"
              : " • Browse available games"}
          </p>
        </div>

        <div className="games-header-actions">

          <div className="games-count">
            <Gamepad2 size={14} />
            <strong>{filtered.length}</strong>
            <span>Games</span>
          </div>

          {canManageGames && (
            <button
              type="button"
              className="games-add-btn"
              onClick={handleAddGame}
            >
              <Plus size={16} />
              <span>Add Game</span>
            </button>
          )}

        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`games-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="games-toolbar">

        <div className="games-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search games, platform, type or genre..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <span className="games-results">
          {filtered.length} results
        </span>

      </div>

      {/* EMPTY STATE */}
      {filtered.length === 0 ? (
        <div className="games-empty">

          <div className="games-empty-icon">
            <Gamepad2 size={22} />
          </div>

          <h3>No games found</h3>

          <p>
            {canManageGames
              ? "Try adjusting your search or add a new game."
              : "Try adjusting your search to find a game."}
          </p>

          {canManageGames && (
            <button
              type="button"
              className="games-empty-btn"
              onClick={handleAddGame}
            >
              <Plus size={15} />
              Add Game
            </button>
          )}

        </div>
      ) : (

        <div className="games-grid">

          {filtered.map((game) => {

            const status = (
              game.status || "active"
            ).toLowerCase();

            return (
              <div
                className="game-card"
                key={game.id}
              >

                {/* ACTION BUTTONS */}
                {canManageGames && (
                  <div className="game-card-action">

                    {/* EDIT */}
                    <button
                      type="button"
                      className="game-edit-btn"
                      title="Edit Game"
                      onClick={() =>
                        handleEditGame(game)
                      }
                    >
                      <Pencil size={14} />
                    </button>

                    {/* DELETE */}
                    {canDeleteGames && (
                      <button
                        type="button"
                        className="game-delete-btn"
                        title="Delete Game"
                        onClick={() =>
                          handleDeleteGame(game)
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                  </div>
                )}

                {/* CARD TOP */}
                <div className="game-card-top">

                  <div className="game-icon">
                    <Gamepad2 size={20} />
                  </div>

                  <span
                    className={`game-status game-status-${status}`}
                  >
                    {status}
                  </span>

                </div>

                {/* CARD CONTENT */}
                <div className="game-card-content">

                  <h3>
                    {game.game_name || game.name}
                  </h3>

                  <p>
                    ID #{game.id}

                    <span className="game-dot">
                      •
                    </span>

                    {game.platform_name ||
                      "PC / Console"}
                  </p>

                  {game.game_type_name && (
                    <p>
                      Type: {game.game_type_name}
                    </p>
                  )}

                  {game.genre && (
                    <p>
                      Genre: {game.genre}
                    </p>
                  )}

                  {game.description && (
                    <p className="game-description">
                      {game.description}
                    </p>
                  )}

                </div>

                {/* CARD FOOTER */}
                {/* CARD FOOTER */}
                <div className="game-card-footer">
                  <span
                    className={
                      status === "active"
                        ? "game-available"
                        : status === "maintenance"
                          ? "game-maintenance"
                          : "game-unavailable"
                    }
                  >
                    <span className="game-status-dot">●</span>

                    {status === "active"
                      ? "Available"
                      : status === "maintenance"
                        ? "Maintenance"
                        : "Inactive"}
                  </span>

                  {canManageGames ? (
                    <button
                      type="button"
                      className="game-manage-btn"
                      onClick={() => handleEditGame(game)}
                    >
                      Manage
                    </button>
                  ) : (
                    <span className="game-view-label">
                      View
                    </span>
                  )}
                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div
          className="games-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >

          <div
            className="games-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}
            <div className="games-modal-header">

              <div>

                <h2>
                  {editingGame
                    ? "Edit Game"
                    : "Add Game"}
                </h2>

                <p>
                  {editingGame
                    ? "Update game information"
                    : "Add a new game to the library"}
                </p>

              </div>

              <button
                type="button"
                className="games-modal-close"
                onClick={handleCloseModal}
                disabled={saving}
                title="Close"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}
            <form
              className="games-form"
              onSubmit={handleSubmit}
            >

              {/* GAME NAME */}
              <div className="games-form-group">

                <label>
                  Game Name <span>*</span>
                </label>

                <input
                  type="text"
                  name="game_name"
                  value={formData.game_name}
                  onChange={handleChange}
                  placeholder="Enter game name"
                  disabled={saving}
                />

                {formErrors.game_name && (
                  <span className="games-form-error">
                    {formErrors.game_name}
                  </span>
                )}

              </div>

              {/* PLATFORM + GAME TYPE */}
              <div className="games-form-row">

                <div className="games-form-group">

                  <label>
                    Platform <span>*</span>
                  </label>

                  <select
                    name="platform_id"
                    value={formData.platform_id}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">
                      Select platform
                    </option>

                    {platforms
                      .filter(
                        (platform) =>
                          platform.status === "active"
                      )
                      .map((platform) => (
                        <option
                          key={platform.id}
                          value={platform.id}
                        >
                          {platform.name}
                        </option>
                      ))}
                  </select>

                  {formErrors.platform_id && (
                    <span className="games-form-error">
                      {formErrors.platform_id}
                    </span>
                  )}

                </div>

                <div className="games-form-group">

                  <label>
                    Game Type <span>*</span>
                  </label>

                  <select
                    name="game_type_id"
                    value={formData.game_type_id}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="">
                      Select game type
                    </option>

                    {gameTypes
                      .filter(
                        (gameType) =>
                          gameType.status === "active"
                      )
                      .map((gameType) => (
                        <option
                          key={gameType.id}
                          value={gameType.id}
                        >
                          {gameType.type_name}
                        </option>
                      ))}
                  </select>

                  {formErrors.game_type_id && (
                    <span className="games-form-error">
                      {formErrors.game_type_id}
                    </span>
                  )}

                </div>

              </div>

              {/* GENRE + STATUS */}
              <div className="games-form-row">

                <div className="games-form-group">

                  <label>
                    Genre
                  </label>

                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    placeholder="e.g. Action, Sports"
                    disabled={saving}
                  />

                </div>

                <div className="games-form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="active">
                      Active
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>

                </div>

              </div>

              {/* DESCRIPTION */}
              <div className="games-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter game description"
                  rows="4"
                  disabled={saving}
                />

              </div>

              {/* FORM ACTIONS */}
              <div className="games-form-actions">

                <button
                  type="button"
                  className="games-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="games-save-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingGame
                      ? "Update Game"
                      : "Save Game"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Games;
