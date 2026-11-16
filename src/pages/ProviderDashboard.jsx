import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import {
  Store,
  PlusCircle,
  ClipboardList,
  LogOut,
  MapPin,
  Clock,
  Phone,
  RefreshCw,
  Eye,
  Edit,
  X,
  CheckCircle,
} from "lucide-react";

function ProviderDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [businessError, setBusinessError] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [editingBusiness, setEditingBusiness] = useState(null);

  const emptyForm = {
    service_name: "",
    category_id: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    opening_hours: "",
    service_days: "",
    assistance_instructions: "",
    required_documents: "",
  };

  const [formData, setFormData] = useState(emptyForm);

  const categories = {
    1: "Food & Restaurants",
    2: "Medical Stores",
    3: "Hospitals",
    4: "Clinics",
    5: "Service Centres",
    6: "Other Services",
    7: "Urgent Help",
  };

  // NORMALIZE OPENING HOURS
  const normalizeOpeningHours = (value) => {
    if (!value.trim()) return "";

    return value
      .trim()
      .replace(/\s*(AM|PM)\b/gi, (_, period) => period.toUpperCase())
      .replace(/\s*-\s*/g, " - ")
      .replace(/(\d)(AM|PM)/gi, "$1$2");
  };

  // VALIDATE OPENING HOURS
  const isValidOpeningHours = (value) => {
    if (!value) return true;

    return /^\d{1,2}(AM|PM)\s*-\s*\d{1,2}(AM|PM)$/i.test(value);
  };

  // FETCH PROVIDER BUSINESSES
  const fetchBusinesses = useCallback(async () => {
    if (!token) {
      setBusinessError("Please log in as a provider.");
      setLoadingBusinesses(false);
      return;
    }

    try {
      setBusinessError("");

      const response = await fetch(
        "/api/services/my",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load businesses");
      }

      setBusinesses(data);
    } catch (error) {
      setBusinessError(error.message);
    } finally {
      setLoadingBusinesses(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  // HANDLE INPUTS
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // VALIDATE FORM
  const validateForm = () => {
    if (!formData.service_name.trim()) {
      setMessage("Please enter your business name.");
      return false;
    }

    if (!formData.category_id) {
      setMessage("Please select a business category.");
      return false;
    }

    if (!formData.address.trim()) {
      setMessage("Please enter your business address.");
      return false;
    }

    const phone = formData.phone.trim();

    if (phone && !/^\d{10}$/.test(phone)) {
      setMessage("Please enter a valid 10-digit phone number.");
      return false;
    }

    const openingHours = normalizeOpeningHours(formData.opening_hours);

    if (!isValidOpeningHours(openingHours)) {
      setMessage("Use opening hours like 9AM - 10PM.");
      return false;
    }

    return true;
  };

  // PREPARE FORM DATA
  const prepareFormData = () => ({
    ...formData,
    service_name: formData.service_name.trim(),
    address: formData.address.trim(),
    city: formData.city.trim(),
    phone: formData.phone.trim(),
    opening_hours: normalizeOpeningHours(formData.opening_hours),
    service_days: formData.service_days.trim(),
    assistance_instructions: formData.assistance_instructions.trim(),
    required_documents: formData.required_documents.trim(),
    category_id: Number(formData.category_id),
  });

  // ADD BUSINESS
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        "/api/services",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(prepareFormData()),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Business registration failed");
      }

      setMessage(
        "Business submitted successfully! Waiting for admin approval."
      );

      setFormData(emptyForm);

      await fetchBusinesses();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // OPEN EDIT FORM
  const handleEdit = (business) => {
    setSelectedBusiness(null);
    setEditingBusiness(business);

    setFormData({
      service_name: business.service_name || "",
      category_id: String(business.category_id || ""),
      description: business.description || "",
      address: business.address || "",
      city: business.city || "",
      phone: business.phone || "",
      opening_hours: business.opening_hours || "",
      service_days: business.service_days || "",
      assistance_instructions: business.assistance_instructions || "",
      required_documents: business.required_documents || "",
    });

    setMessage("");

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // UPDATE BUSINESS
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingBusiness || !validateForm()) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/services/${editingBusiness.service_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(prepareFormData()),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update business");
      }

      setMessage(
        "Business updated successfully! Waiting for admin approval."
      );

      setEditingBusiness(null);
      setFormData(emptyForm);

      await fetchBusinesses();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // CANCEL EDITING
  const cancelEdit = () => {
    setEditingBusiness(null);
    setFormData(emptyForm);
    setMessage("");
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // STATISTICS
  const totalBusinesses = businesses.length;

  const pendingBusinesses = businesses.filter(
    (b) => b.approval_status === "pending"
  ).length;

  const approvedBusinesses = businesses.filter(
    (b) => b.approval_status === "approved"
  ).length;

  const rejectedBusinesses = businesses.filter(
    (b) => b.approval_status === "rejected"
  ).length;

  // INPUT STYLE
  const inputStyle = {
    width: "100%",
    padding: "13px",
    marginTop: "7px",
    marginBottom: "18px",
    border: "1px solid #dce1eb",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "15px",
    fontFamily: "inherit",
  };

  // STATUS BADGES
  const getStatusStyle = (status) => {
    const styles = {
      pending: {
        background: "#fff4d6",
        color: "#a16207",
      },
      approved: {
        background: "#dcfce7",
        color: "#15803d",
      },
      rejected: {
        background: "#fee2e2",
        color: "#b91c1c",
      },
    };

    return {
      display: "inline-block",
      padding: "7px 13px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "700",
      textTransform: "capitalize",
      ...(styles[status] || {}),
    };
  };

  const getVerificationStyle = (status) => {
    const styles = {
      pending: {
        background: "#fff4d6",
        color: "#a16207",
      },
      verified: {
        background: "#dcfce7",
        color: "#15803d",
      },
      "needs updating": {
        background: "#fee2e2",
        color: "#b91c1c",
      },
    };

    return {
      display: "inline-block",
      padding: "7px 13px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "700",
      textTransform: "capitalize",
      ...(styles[status] || styles.pending),
    };
  };

  // BUSINESS FORM
  const renderBusinessForm = () => (
    <form
      onSubmit={editingBusiness ? handleUpdate : handleSubmit}
      noValidate
    >
      <label>Business Name *</label>

      <input
        style={inputStyle}
        name="service_name"
        value={formData.service_name}
        onChange={handleChange}
        placeholder="Enter business name"
        required
      />

      <label>Business Category *</label>

      <select
        style={inputStyle}
        name="category_id"
        value={formData.category_id}
        onChange={handleChange}
        required
      >
        <option value="">Select a category</option>

        {Object.entries(categories).map(([id, name]) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>

      <label>Description</label>

      <textarea
        style={inputStyle}
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Describe your business"
        rows="4"
      />

      <label>Business Address *</label>

      <input
        style={inputStyle}
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Enter complete address"
        required
      />

      <label>City</label>

      <input
        style={inputStyle}
        name="city"
        value={formData.city}
        onChange={handleChange}
        placeholder="Enter city"
      />

      <label>Business Phone Number</label>

      <input
        style={inputStyle}
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="10-digit contact number"
        inputMode="numeric"
        maxLength={10}
      />

      <label>Opening Hours</label>

      <input
        style={inputStyle}
        type="text"
        name="opening_hours"
        value={formData.opening_hours}
        onChange={handleChange}
        placeholder="Example: 9AM - 10PM or 24 Hours"
      />

      <label>Service Days</label>

      <input
        style={inputStyle}
        name="service_days"
        value={formData.service_days}
        onChange={handleChange}
        placeholder="Example: Monday - Saturday"
      />

      <label>Assistance Instructions</label>

      <textarea
        style={inputStyle}
        name="assistance_instructions"
        value={formData.assistance_instructions}
        onChange={handleChange}
        placeholder="Explain how users can request assistance or contact your organisation"
        rows="4"
      />

      <label>Required Documents</label>

      <textarea
        style={inputStyle}
        name="required_documents"
        value={formData.required_documents}
        onChange={handleChange}
        placeholder="Example: ID proof, prescription, application form"
        rows="3"
      />

      <div
        style={{
          padding: "15px",
          background: "#eff6ff",
          borderRadius: "10px",
          marginBottom: "18px",
        }}
      >
        <strong>Organisation Verification</strong>

        <p style={{ fontSize: "13px", color: "#475569" }}>
          New organisations start with Pending verification.
          The NearNest admin will review their information.
        </p>
      </div>

      {message && (
        <p
          role="status"
          style={{
            color: message.includes("successfully")
              ? "#15803d"
              : "#dc2626",
            marginBottom: "15px",
          }}
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        className="auth-submit"
        disabled={loading}
      >
        {loading
          ? "Please wait..."
          : editingBusiness
          ? "Update Business"
          : "Submit Business"}
      </button>

      {editingBusiness && (
        <button
          type="button"
          onClick={cancelEdit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "white",
            cursor: "pointer",
          }}
        >
          Cancel Editing
        </button>
      )}
    </form>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fc",
        padding: "35px",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "35px",
        }}
      >
        <h2 style={{ color: "#2563eb" }}>
          NearNest Provider
        </h2>

        <button onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      {/* WELCOME */}
      <h1>Welcome, {user.name || "Provider"}!</h1>

      <p>
        Manage your business listings and track their approval status.
      </p>

      {/* STATISTICS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginTop: "30px",
        }}
      >
        {[
          ["Total Businesses", totalBusinesses, "#2563eb", Store],
          ["Pending", pendingBusinesses, "#d97706", ClipboardList],
          ["Approved", approvedBusinesses, "#16a34a", CheckCircle],
          ["Rejected", rejectedBusinesses, "#dc2626", Store],
        ].map(([title, count, color, Icon]) => (
          <div className="auth-card" key={title}>
            <Icon size={30} color={color} />
            <h3>{title}</h3>
            <h2>{count}</h2>
          </div>
        ))}
      </div>

      {/* MY BUSINESSES */}
      <div className="auth-card" style={{ marginTop: "35px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <h2>
            <Store size={23} /> My Businesses
          </h2>

          <button
            type="button"
            onClick={fetchBusinesses}
            disabled={loadingBusinesses}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {loadingBusinesses ? (
          <p>Loading your businesses...</p>
        ) : businessError ? (
          <p style={{ color: "#dc2626" }}>{businessError}</p>
        ) : businesses.length === 0 ? (
          <p>You haven't submitted any businesses yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "20px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Business",
                    "Category",
                    "Location",
                    "Approval",
                    "Verification",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "14px",
                        borderBottom: "1px solid #e5e7eb",
                        color: "#64748b",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {businesses.map((business) => (
                  <tr key={business.service_id}>
                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>
                      <strong>{business.service_name}</strong>
                      <br />
                      <small>ID: #{business.service_id}</small>
                    </td>

                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>
                      {categories[business.category_id] || "Other Services"}
                    </td>

                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>
                      <MapPin size={14} />
                      {business.city || business.address}
                    </td>

                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={getStatusStyle(business.approval_status)}>
                        {business.approval_status}
                      </span>
                    </td>

                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={getVerificationStyle(business.verification_status)}>
                        {business.verification_status || "pending"}
                      </span>
                    </td>

                    <td style={{ padding: "14px", borderBottom: "1px solid #e5e7eb" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedBusiness(business)}
                        >
                          <Eye size={16} /> View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(business)}
                        >
                          <Edit size={16} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT BUSINESS FORM */}
      <div
        className="auth-card"
        style={{
          marginTop: "35px",
          maxWidth: "650px",
        }}
      >
        <h2>
          {editingBusiness ? (
            <>
              <Edit size={23} /> Edit Business
            </>
          ) : (
            <>
              <PlusCircle size={23} /> Add Your Business
            </>
          )}
        </h2>

        <p>
          {editingBusiness
            ? "Update your business information. Changes will be reviewed by the admin."
            : "Provide your business information. Your listing will be reviewed by the NearNest admin."}
        </p>

        {renderBusinessForm()}

        {!editingBusiness && (
          <p style={{ marginTop: "15px" }}>
            <MapPin size={15} />
            Your business will be submitted for admin approval.
          </p>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedBusiness && (
        <div
          onClick={() => setSelectedBusiness(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              width: "100%",
              maxWidth: "550px",
              padding: "30px",
              borderRadius: "18px",
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2>Business Details</h2>

              <button onClick={() => setSelectedBusiness(null)}>
                <X />
              </button>
            </div>

            <h2 style={{ color: "#2563eb", marginTop: "20px" }}>
              {selectedBusiness.service_name}
            </h2>

            <p>
              <strong>Business ID:</strong> #{selectedBusiness.service_id}
            </p>

            <p>
              <strong>Category:</strong>{" "}
              {categories[selectedBusiness.category_id] || "Other Services"}
            </p>

            <p>
              <strong>Description:</strong>{" "}
              {selectedBusiness.description || "Not provided"}
            </p>

            <p>
              <MapPin size={16} />{" "}
              <strong>Address:</strong> {selectedBusiness.address}
            </p>

            <p>
              <strong>City:</strong> {selectedBusiness.city || "Not provided"}
            </p>

            <p>
              <Phone size={16} />{" "}
              <strong>Phone:</strong> {selectedBusiness.phone || "Not provided"}
            </p>

            <p>
              <Clock size={16} />{" "}
              <strong>Opening Hours:</strong>{" "}
              {selectedBusiness.opening_hours || "Not provided"}
            </p>

            <p>
              <strong>Service Days:</strong>{" "}
              {selectedBusiness.service_days || "Not provided"}
            </p>

            <p>
              <strong>Assistance Instructions:</strong>
              <br />
              {selectedBusiness.assistance_instructions || "Not provided"}
            </p>

            <p>
              <strong>Required Documents:</strong>
              <br />
              {selectedBusiness.required_documents || "Not provided"}
            </p>

            <p>
              <strong>Last Updated:</strong>{" "}
              {selectedBusiness.last_updated
                ? String(selectedBusiness.last_updated).slice(0, 10)
                : "Not recorded"}
            </p>

            <p>
              <strong>Approval Status:</strong>{" "}
              <span style={getStatusStyle(selectedBusiness.approval_status)}>
                {selectedBusiness.approval_status}
              </span>
            </p>

            <p>
              <strong>Verification Status:</strong>{" "}
              <span style={getVerificationStyle(selectedBusiness.verification_status)}>
                {selectedBusiness.verification_status || "pending"}
              </span>
            </p>

            <button
              className="auth-submit"
              style={{ marginTop: "20px" }}
              onClick={() => handleEdit(selectedBusiness)}
            >
              <Edit size={16} /> Edit Business
            </button>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <p style={{ marginTop: "30px" }}>
        <Link to="/">← Back to NearNest</Link>
      </p>
    </div>
  );
}

export default ProviderDashboard;