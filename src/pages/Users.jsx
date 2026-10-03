import { useEffect, useState } from "react";
import {
    UserPlus,
    Users as UsersIcon,
    Pencil,
    X,
} from "lucide-react";
import "../styles/Users.css";
import api from "../api/axios";

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        mobile: "",
        email: "",
        password: "",
        role_id: "3",
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // =====================================================
    // LOAD PLAYERS
    // =====================================================

    const refreshUsers = async () => {
        try {
            const response = await api.get("/users");

            setUsers(response.data.data || []);
        } catch (err) {
            console.error(
                "Users API ERROR:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Failed to refresh users."
            );
        }
    };

    useEffect(() => {
        let cancelled = false;

        const fetchUsers = async () => {
            try {
                const response = await api.get("/users");
                if (!cancelled) {
                    setUsers(response.data.data || []);
                }
            } catch (err) {
                console.error(
                    "Users API ERROR:",
                    err.response?.data || err.message
                );

                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Failed to load users."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchUsers();

        return () => {
            cancelled = true;
        };
    }, []);
    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // =====================================================
    // CREATE USER
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            const response = await api.post("/users", {
                full_name: formData.full_name,
                mobile: formData.mobile,
                email: formData.email,
                password: formData.password,
                role_id: Number(formData.role_id),
            });

            setMessage(
                response.data.message ||
                "User created successfully."
            );

            setFormData({
                full_name: "",
                mobile: "",
                email: "",
                password: "",
                role_id: "3",
            });

            setShowForm(false);

            refreshUsers();

        } catch (err) {
            console.error(
                "Create User ERROR:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Failed to create user."
            );
        }
    };
    // =====================================================
    // EDIT USER
    // =====================================================

    const handleEdit = (user) => {
        setEditingUser({
            id: user.id,
            full_name: user.full_name || "",
            mobile: user.mobile || "",
            email: user.email || "",
            role_id: String(user.role_id),
            password: "",
        });

        setMessage("");
        setError("");
        setShowEditForm(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;

        setEditingUser((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");
        setEditLoading(true);

        try {
            const payload = {
                full_name: editingUser.full_name,
                mobile: editingUser.mobile,
                email: editingUser.email,
                role_id: Number(editingUser.role_id),
            };

            // Only send password when Admin entered a new one
            if (editingUser.password) {
                payload.password = editingUser.password;
            }

            const response = await api.put(
                `/users/${editingUser.id}`,
                payload
            );

            setMessage(
                response.data.message ||
                "User updated successfully."
            );

            setShowEditForm(false);
            setEditingUser(null);

            await refreshUsers();

        } catch (err) {
            console.error(
                "Update User ERROR:",
                err.response?.data || err.message
            );

            setError(
                err.response?.data?.message ||
                "Failed to update user."
            );
        } finally {
            setEditLoading(false);
        }
    };

    // =====================================================
    // UI
    // =====================================================

    return (
        <div>

            {/* PAGE HEADER */}

            <div className="page-header">

                <div>
                    <h1>User Management</h1>

                    <p>
                        Manage Staff and Players in your GameZone system.
                    </p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => {
                        setShowForm(true);
                        setMessage("");
                        setError("");
                    }}
                >
                    <UserPlus size={18} />
                    Add User
                </button>

            </div>


            {/* MESSAGE */}

            {message && (
                <div className="status-badge status-active">
                    {message}
                </div>
            )}

            {error && (
                <div className="status-badge status-inactive">
                    {error}
                </div>
            )}


            {/* CREATE USER FORM */}

            {showForm && (
                <div className="card">

                    <div className="card-header">

                        <h2 className="card-title">
                            Add New User
                        </h2>

                        <button
                            className="card-action"
                            onClick={() => {
                                setShowForm(false);
                                setError("");
                            }}
                        >
                            Cancel
                        </button>

                    </div>


                    <div className="card-body">

                        <form onSubmit={handleSubmit}>

                            <div className="form-grid">

                                {/* NAME */}

                                <div className="form-group">

                                    <label>
                                        Full Name
                                    </label>

                                    <input
                                        type="text"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        required
                                    />

                                </div>


                                {/* MOBILE */}

                                <div className="form-group">

                                    <label>
                                        Mobile
                                    </label>

                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        placeholder="Enter mobile number"
                                        required
                                    />

                                </div>


                                {/* EMAIL */}

                                <div className="form-group">

                                    <label>
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter email"
                                        required
                                    />

                                </div>


                                {/* PASSWORD */}

                                <div className="form-group">

                                    <label>
                                        Password
                                    </label>

                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                        required
                                    />

                                </div>


                                {/* ROLE */}

                                <div className="form-group">

                                    <label>
                                        Role
                                    </label>

                                    <select
                                        name="role_id"
                                        value={formData.role_id}
                                        onChange={handleChange}
                                    >
                                        <option value="3">
                                            Player
                                        </option>

                                        <option value="2">
                                            Staff
                                        </option>
                                    </select>

                                </div>

                            </div>


                            <div style={{ marginTop: "20px" }}>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    Create User
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}


            {/* USERS LIST */}

            <div className="card">

                <div className="card-header">

                    <h2 className="card-title">
                        Registered Users
                    </h2>

                    <UsersIcon size={20} />

                </div>


                <div className="card-body">

                    {loading ? (

                        <p>
                            Loading users...
                        </p>

                    ) : users.length === 0 ? (

                        <div className="empty-state">

                            <UsersIcon size={40} />

                            <h3>
                                No Users Found
                            </h3>

                            <p>
                                Create your first Staff or Player using Add User.
                            </p>

                        </div>

                    ) : (

                        <div className="users-table-wrapper">

                            <table className="users-table">

                                <thead>

                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Mobile</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Action</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {users.map((user) => (

                                        <tr key={user.id}>

                                            <td className="user-id">
                                                #{user.id}
                                            </td>

                                            <td className="user-name">
                                                <strong>
                                                    {user.full_name}
                                                </strong>
                                            </td>

                                            <td className="user-phone">
                                                {user.mobile}
                                            </td>

                                            <td className="user-email">
                                                {user.email}
                                            </td>

                                            <td>
                                                <span className="user-role">
                                                    {user.role_name}
                                                </span>
                                            </td>

                                            <td className="user-actions">
                                                <button
                                                    type="button"
                                                    className="user-edit-btn"
                                                    onClick={() => handleEdit(user)}
                                                    title="Edit User"
                                                >
                                                    <Pencil size={16} />
                                                    Edit
                                                </button>
                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

                {/* EDIT USER MODAL */}

                {showEditForm && editingUser && (
                    <div className="user-modal-overlay">

                        <div className="user-modal">

                            <div className="user-modal-header">

                                <div>
                                    <h2>Edit User</h2>
                                    <p>Update Staff or Player details.</p>
                                </div>

                                <button
                                    type="button"
                                    className="user-modal-close"
                                    onClick={() => {
                                        setShowEditForm(false);
                                        setEditingUser(null);
                                        setError("");
                                    }}
                                >
                                    <X size={20} />
                                </button>

                            </div>

                            <form
                                onSubmit={handleUpdateUser}
                                className="user-modal-body"
                            >

                                <div className="form-grid">

                                    <div className="form-group">
                                        <label>Full Name</label>

                                        <input
                                            type="text"
                                            name="full_name"
                                            value={editingUser.full_name}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Mobile</label>

                                        <input
                                            type="tel"
                                            name="mobile"
                                            value={editingUser.mobile}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Email</label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={editingUser.email}
                                            onChange={handleEditChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Role</label>

                                        <select
                                            name="role_id"
                                            value={editingUser.role_id}
                                            onChange={handleEditChange}
                                        >
                                            <option value="3">
                                                Player
                                            </option>

                                            <option value="2">
                                                Staff
                                            </option>
                                        </select>
                                    </div>

                                    <div className="form-group user-password-field">
                                        <label>
                                            New Password
                                            <span> (optional)</span>
                                        </label>

                                        <input
                                            type="password"
                                            name="password"
                                            value={editingUser.password}
                                            onChange={handleEditChange}
                                            placeholder="Leave blank to keep current password"
                                        />
                                    </div>

                                </div>


                            </form>

                        </div>

                        <div className="user-modal-actions">

                            <button
                                type="button"
                                className="user-cancel-btn"
                                onClick={() => {
                                    setShowEditForm(false);
                                    setEditingUser(null);
                                }}
                                disabled={editLoading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={editLoading}
                            >
                                {editLoading
                                    ? "Updating..."
                                    : "Update User"}
                            </button>

                        </div>
                    </div>
                )}

            </div>

        </div>
    );
}

export default Users;