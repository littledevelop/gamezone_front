import { useState } from "react";
import api from "../api/axios.js";
import "../styles/Login.css";

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(""); setStatus(""); setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setStatus("success");
        setMessage("Login successful. Redirecting...");
        setTimeout(() => onLogin(), 600);
      } else {
        setStatus("error");
        setMessage(res.data.message || "Login failed");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Unable to connect");
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card login-card-glass">
        <div className="login-brand">
          <div className="login-logo">
            <img src="/Zestopia_Logo_CDR15.jpg.jpeg" alt="Zestopia GameZone" />
          </div>
          <p>GAMEZONE MANAGEMENT</p>
        </div>

        <div className="login-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your GameZone dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="login-form" noValidate>
          <div className="login-field">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@zestopia.com" required />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          {message && <div className={`login-message ${status}`}>{message}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div className="login-footer">
             <span>Zestopia GameZone • Secure Access</span>
        </div>
      </div>
    </div>
  );
}
export default Login;