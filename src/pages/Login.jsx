import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Mail, Lock, ArrowRight } from "lucide-react";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Login successful!");

if (data.user.role === "admin") {
  navigate("/admin");
} else if (data.user.role === "provider") {
  navigate("/provider");
} else {
  navigate("/");
}
    } catch (error) {
      setMessage(error.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <Link to="/" className="auth-brand">
          <span className="brand-icon">N</span>
          NearNest<span className="brand-dot">.</span>
        </Link>

        <div className="auth-heading">
          <span>WELCOME BACK</span>
          <h1>Log in to NearNest</h1>
          <p>Discover and connect with services around you.</p>
        </div>

        <form onSubmit={handleLogin}>
          <label>Email address</label>
          <div className="auth-input">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label>Password</label>
          <div className="auth-input">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <p role="status" style={{ marginTop: "12px" }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log in"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Create account</Link>
        </p>

        <div className="auth-footer">
          <MapPin size={15} />
          Your neighbourhood, all in one place.
        </div>

      </div>
    </div>
  );
}

export default Login;