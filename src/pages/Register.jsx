import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  MapPin,
} from "lucide-react";

import "./Auth.css";

function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage("Account created successfully! You can now log in.");

      setFormData({
        full_name: "",
        email: "",
        mobile: "",
        password: "",
        role: "",
      });

    } catch (error) {
      setMessage(error.message || "Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">
          <span style={{
            background: "#2563eb",
            color: "white",
            padding: "8px 12px",
            borderRadius: "10px",
            marginRight: "12px"
          }}>
            N
          </span>
          NearNest.
        </div>

        <div className="auth-heading">
          <span>JOIN NEARNEST</span>
          <h1>Create your account</h1>
          <p>Discover and connect with services around you.</p>
        </div>

        <form onSubmit={handleRegister}>

          <label>Full name</label>
          <div className="auth-input">
            <User size={18} />
            <input
              type="text"
              name="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <label>Email address</label>
          <div className="auth-input">
            <Mail size={18} />
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <label>Mobile number</label>
          <div className="auth-input">
            <Phone size={18} />
            <input
              type="tel"
              name="mobile"
              placeholder="Enter your mobile number"
              value={formData.mobile}
              onChange={handleChange}
              pattern="[0-9]{10}"
              maxLength="10"
              required
            />
          </div>

          <label>Password</label>
          <div className="auth-input">
            <Lock size={18} />
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              minLength="8"
              required
            />
          </div>

          <label>Account type</label>
          <div className="auth-input">
            <User size={18} />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="" disabled>
                Select account type
              </option>
              <option value="user">Regular User</option>
              <option value="provider">Service Provider</option>
            </select>
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
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={18} />}
          </button>

        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Log in</Link>
        </p>

        <div className="auth-footer">
          <MapPin size={15} />
          Your neighbourhood, all in one place.
        </div>

      </div>
    </div>
  );
}

export default Register;