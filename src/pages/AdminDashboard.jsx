import React, { useEffect, useState, useCallback } from "react";
import "./AdminDashboard.css";

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [businesses, setBusinesses] = useState([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);

  // FETCH BUSINESSES
  const fetchBusinesses = useCallback(async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/businesses",
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
      console.error("Fetch businesses error:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchBusinesses();
    } else {
      setMessage("Please log in as an administrator.");
      setLoading(false);
    }
  }, [token, fetchBusinesses]);

  // APPROVE OR REJECT BUSINESS
  const updateStatus = async (serviceId, status) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${status} this business?`
    );

    if (!confirmed) return;

    setUpdatingId(serviceId);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/businesses/${serviceId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update status");
      }

      setMessage(data.message);
      await fetchBusinesses();
    } catch (error) {
      console.error("Approval update error:", error);
      setMessage(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // UPDATE ORGANISATION VERIFICATION STATUS
  const updateVerification = async (serviceId, verification_status) => {
    const readableStatus = verification_status.replace("_", " ");

    const confirmed = window.confirm(
      `Are you sure you want to change verification status to ${readableStatus}?`
    );

    if (!confirmed) return;

    setUpdatingId(serviceId);
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/businesses/${serviceId}/verification`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            verification_status: verification_status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update verification status"
        );
      }

      // Show success message
      setMessage(data.message || "Verification updated successfully.");

      // Refresh records from the database
      await fetchBusinesses();

      // Close the review modal
      setSelectedVerification(null);
    } catch (error) {
      console.error("Verification update error:", error);
      setMessage(error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // STATISTICS
  const total = businesses.length;

  const pending = businesses.filter(
    (b) => b.approval_status === "pending"
  ).length;

  const approved = businesses.filter(
    (b) => b.approval_status === "approved"
  ).length;

  const rejected = businesses.filter(
    (b) => b.approval_status === "rejected"
  ).length;

  const verificationPending = businesses.filter(
    (b) =>
      !b.verification_status ||
      b.verification_status === "pending"
  ).length;

  const verified = businesses.filter(
    (b) => b.verification_status === "verified"
  ).length;

  const needsUpdating = businesses.filter(
    (b) => b.verification_status === "needs_updating"
  ).length;

  const stats = [
    {
      title: "Total Businesses",
      value: total,
      icon: "🏢",
      color: "blue",
    },
    {
      title: "Pending Approvals",
      value: pending,
      icon: "⏳",
      color: "orange",
    },
    {
      title: "Approved",
      value: approved,
      icon: "✓",
      color: "green",
    },
    {
      title: "Rejected",
      value: rejected,
      icon: "✕",
      color: "red",
    },
  ];

  const verificationStats = [
    {
      title: "Pending Verification",
      value: verificationPending,
      icon: "⏳",
      color: "orange",
    },
    {
      title: "Verified Organisations",
      value: verified,
      icon: "✓",
      color: "green",
    },
    {
      title: "Needs Updating",
      value: needsUpdating,
      icon: "⚠",
      color: "red",
    },
  ];

  // FILTER BUSINESSES
  const filteredBusinesses = businesses.filter((business) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      (business.service_name || "")
        .toLowerCase()
        .includes(searchText) ||
      (business.city || "")
        .toLowerCase()
        .includes(searchText) ||
      (business.provider_name || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      business.approval_status === statusFilter.toLowerCase();

    const matchesTab =
      activeTab === "Overview" ||
      activeTab === "Businesses" ||
      activeTab === "Verification" ||
      (activeTab === "Approvals" &&
        business.approval_status === "pending") ||
      (activeTab === "Providers" && business.provider_name);

    return matchesSearch && matchesStatus && matchesTab;
  });

  // VERIFICATION STATUS STYLE
  const getVerificationClass = (status) => {
    if (status === "verified") return "approved";

    if (status === "needs_updating") return "rejected";

    return "pending";
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-brand">
          <div className="brand-icon">N</div>

          <div>
            <h2>NearNest</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        {[
          "Overview",
          "Businesses",
          "Approvals",
          "Providers",
          "Verification",
        ].map((item) => (
          <button
            key={item}
            className={`sidebar-link ${
              activeTab === item ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab(item);
              setStatusFilter("All");
              setSearch("");
            }}
          >
            <span>
              {item === "Overview" && "▦"}
              {item === "Businesses" && "🏢"}
              {item === "Approvals" && "✓"}
              {item === "Providers" && "👥"}
              {item === "Verification" && "🛡️"}
            </span>

            {item}
          </button>
        ))}

        <div className="sidebar-bottom">

          <div className="admin-profile">
            <div className="profile-avatar">
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user.name || "Administrator"}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            ↪ Log out
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">

        <header className="admin-topbar">

          <div>
            <h1>{activeTab}</h1>
            <p>Manage and monitor your NearNest platform.</p>
          </div>

          <div className="admin-top-right">

            <span className="admin-live">
              <span></span> System Active
            </span>

            <div className="top-avatar">
              {(user.name || "A").charAt(0).toUpperCase()}
            </div>

          </div>
        </header>

        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <>
            <section className="welcome-banner">

              <div>
                <span className="welcome-tag">
                  ADMIN OVERVIEW
                </span>

                <h2>
                  Welcome back, {user.name || "Admin"} 👋
                </h2>

                <p>
                  Here's what's happening with your NearNest platform.
                </p>
              </div>

              <div className="welcome-decoration">✦</div>

            </section>

            <section className="stats-grid">

              {stats.map((stat) => (
                <div className="stat-card" key={stat.title}>

                  <div className={`stat-icon ${stat.color}`}>
                    {stat.icon}
                  </div>

                  <p>{stat.title}</p>
                  <h2>{stat.value}</h2>

                </div>
              ))}

            </section>
          </>
        )}

        {/* VERIFICATION OVERVIEW */}
        {activeTab === "Verification" && (
          <section className="stats-grid">

            {verificationStats.map((stat) => (
              <div className="stat-card" key={stat.title}>

                <div className={`stat-icon ${stat.color}`}>
                  {stat.icon}
                </div>

                <p>{stat.title}</p>
                <h2>{stat.value}</h2>

              </div>
            ))}

          </section>
        )}

        {/* BUSINESS TABLE */}
        <section className="business-section">

          <div className="section-heading">

            <div>
              <h2>
                {activeTab === "Overview"
                  ? "Recent Business Submissions"
                  : activeTab === "Verification"
                  ? "Organisation Verification"
                  : activeTab}
              </h2>

              <p>
                {activeTab === "Verification"
                  ? "Review organisation information and verification status."
                  : "Review and manage business listings."}
              </p>
            </div>

            <span className="listing-count">
              {filteredBusinesses.length} Listings
            </span>

          </div>

          {message && (
            <div className="admin-message">
              {message}
            </div>
          )}

          <div className="table-controls">

            <input
              type="search"
              placeholder="Search business, city or provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {activeTab !== "Verification" && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            )}

            <button
              type="button"
              onClick={fetchBusinesses}
              disabled={loading}
            >
              Refresh
            </button>

          </div>

          <div className="table-wrapper">

            <table className="business-table">

              <thead>
                <tr>
                  <th>BUSINESS</th>
                  <th>CATEGORY</th>
                  <th>LOCATION</th>
                  <th>PROVIDER</th>

                  {activeTab === "Verification" ? (
                    <>
                      <th>VERIFICATION</th>
                      <th>ACTION</th>
                    </>
                  ) : (
                    <>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      Loading businesses...
                    </td>
                  </tr>
                ) : filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No businesses found.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((business) => (

                    <tr key={business.service_id}>

                      <td>
                        <strong>{business.service_name}</strong>

                        <small>
                          Business ID: #{business.service_id}
                        </small>
                      </td>

                      <td>
                        {business.category_name || "Uncategorized"}
                      </td>

                      <td>
                        {business.city || business.address || "Not provided"}
                      </td>

                      <td>
                        {business.provider_name || "Unknown"}
                      </td>

                      {activeTab === "Verification" ? (
                        <>
                          <td>
                            <span
                              className={`status-badge ${getVerificationClass(
                                business.verification_status
                              )}`}
                            >
                              {(business.verification_status || "pending")
                                .replace("_", " ")}
                            </span>
                          </td>

                          <td>
                            <button
                              className="approve-btn"
                              onClick={() =>
                                setSelectedVerification(business)
                              }
                            >
                              Review Details
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span
                              className={`status-badge ${business.approval_status}`}
                            >
                              {business.approval_status}
                            </span>
                          </td>

                          <td>
                            {business.approval_status === "pending" ? (
                              <div className="action-buttons">

                                <button
                                  className="approve-btn"
                                  disabled={updatingId === business.service_id}
                                  onClick={() =>
                                    updateStatus(
                                      business.service_id,
                                      "approved"
                                    )
                                  }
                                >
                                  Approve
                                </button>

                                <button
                                  className="reject-btn"
                                  disabled={updatingId === business.service_id}
                                  onClick={() =>
                                    updateStatus(
                                      business.service_id,
                                      "rejected"
                                    )
                                  }
                                >
                                  Reject
                                </button>

                              </div>
                            ) : (
                              <span className="reviewed-text">
                                Reviewed
                              </span>
                            )}
                          </td>
                        </>
                      )}

                    </tr>

                  ))
                )}

              </tbody>
            </table>

          </div>

          <p className="demo-notice">
            Live business records from the NearNest database.
          </p>

        </section>

        {/* ORGANISATION VERIFICATION MODAL */}
        {selectedVerification && (
          <div
            className="verification-overlay"
            onClick={() => setSelectedVerification(null)}
          >

            <div
              className="verification-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                className="verification-close"
                onClick={() => setSelectedVerification(null)}
              >
                ✕
              </button>

              <h2>Organisation Review</h2>

              <h3>{selectedVerification.service_name}</h3>

              <p>
                <strong>Business ID:</strong>{" "}
                #{selectedVerification.service_id}
              </p>

              <p>
                <strong>Category:</strong>{" "}
                {selectedVerification.category_name || "Not provided"}
              </p>

              <p>
                <strong>Provider:</strong>{" "}
                {selectedVerification.provider_name || "Unknown"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {selectedVerification.provider_email || "Not provided"}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {selectedVerification.phone ||
                  selectedVerification.provider_mobile ||
                  "Not provided"}
              </p>

              <p>
                <strong>Address:</strong>{" "}
                {selectedVerification.address || "Not provided"}
              </p>

              <p>
                <strong>City:</strong>{" "}
                {selectedVerification.city || "Not provided"}
              </p>

              <p>
                <strong>Opening Hours:</strong>{" "}
                {selectedVerification.opening_hours || "Not provided"}
              </p>

              <p>
                <strong>Service Days:</strong>{" "}
                {selectedVerification.service_days || "Not provided"}
              </p>

              <p>
                <strong>Assistance Instructions:</strong>
                <br />
                {selectedVerification.assistance_instructions ||
                  "Not provided"}
              </p>

              <p>
                <strong>Required Documents:</strong>
                <br />
                {selectedVerification.required_documents ||
                  "Not provided"}
              </p>

              <p>
                <strong>Last Updated:</strong>{" "}
                {selectedVerification.last_updated
                  ? String(selectedVerification.last_updated).slice(0, 10)
                  : "Not recorded"}
              </p>

              <p>
                <strong>Approval Status:</strong>{" "}
                {selectedVerification.approval_status}
              </p>

              <p>
                <strong>Verification Status:</strong>{" "}
                {(selectedVerification.verification_status || "pending")
                  .replace("_", " ")}
              </p>

              <div className="verification-actions">

                <button
                  className="approve-btn"
                  disabled={updatingId === selectedVerification.service_id}
                  onClick={() =>
                    updateVerification(
                      selectedVerification.service_id,
                      "verified"
                    )
                  }
                >
                  {updatingId === selectedVerification.service_id
                    ? "Updating..."
                    : "Mark Verified"}
                </button>

                <button
                  className="reject-btn"
                  disabled={updatingId === selectedVerification.service_id}
                  onClick={() =>
                    updateVerification(
                      selectedVerification.service_id,
                      "needs_updating"
                    )
                  }
                >
                  Needs Updating
                </button>

                <button
                  disabled={updatingId === selectedVerification.service_id}
                  onClick={() =>
                    updateVerification(
                      selectedVerification.service_id,
                      "pending"
                    )
                  }
                >
                  Reset to Pending
                </button>

              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;