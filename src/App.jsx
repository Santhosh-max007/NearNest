import { useState, useEffect, useCallback } from "react";
import {
  Link,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import Register from "./pages/Register.jsx";
import Login from "./pages/Login.jsx";
import ProviderDashboard from "./pages/ProviderDashboard.jsx";

import {
  Search,
  MapPin,
  Utensils,
  Pill,
  Hospital,
  Stethoscope,
  Wrench,
  ShoppingBag,
  ArrowRight,
  Navigation,
  Clock,
  Star,
  Phone,
  Menu,
  X,
  SlidersHorizontal,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CalendarDays,
  Info,
} from "lucide-react";

import "./App.css";

// ==========================================
// CATEGORIES
// ==========================================

const categories = [
  { name: "Food & Restaurants", icon: Utensils },
  { name: "Medical Stores", icon: Pill },
  { name: "Hospitals", icon: Hospital },
  { name: "Clinics", icon: Stethoscope },
  { name: "Service Centres", icon: Wrench },
  { name: "Other Services", icon: ShoppingBag },
  { name: "Urgent Help", icon: AlertTriangle },
];

const categoryNames = {
  1: "Food & Restaurants",
  2: "Medical Stores",
  3: "Hospitals",
  4: "Clinics",
  5: "Service Centres",
  6: "Other Services",
  7: "Urgent Help",
};

// ==========================================
// PREMIUM CATEGORY IMAGES
// ==========================================

const categoryImages = {
  "Food & Restaurants":
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=90",

  "Medical Stores":
    "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1000&auto=format&fit=crop&q=90",

  Hospitals:
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1000&auto=format&fit=crop&q=90",

  Clinics:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1000&auto=format&fit=crop&q=90",

  "Service Centres":
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1000&auto=format&fit=crop&q=90",

  "Other Services":
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=90",

  "Urgent Help":
    "https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=1000&auto=format&fit=crop&q=90",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=85";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

const formatVerification = (status) => {
  if (status === "verified") return "Verified";

  if (status === "needs_updating") {
    return "Needs Updating";
  }

  return "Verification Pending";
};

const formatDate = (date) => {
  if (!date) return "Not recorded";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date).slice(0, 10);
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// PROTECTED ROUTES
// ==========================================

function RequireRole({ role, children }) {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    user = null;
  }

  // User must be logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // User must have the correct role
  if (user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ==========================================
// HOMEPAGE
// ==========================================

function HomePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [selectedService, setSelectedService] = useState(null);

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState("");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  // ========================================
  // FETCH APPROVED SERVICES
  // ========================================

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    setServiceError("");

    try {
      const response = await fetch(
        "/api/services"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load services"
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid services response");
      }

      const formattedServices = data.map((item) => {
        const category =
          item.category_name ||
          categoryNames[item.category_id] ||
          "Other Services";

        return {
          id: item.service_id,

          name: item.service_name || "Unnamed Business",

          category,

          image:
            item.image_url ||
            categoryImages[category] ||
            FALLBACK_IMAGE,

          address: [item.address, item.city]
            .filter(Boolean)
            .join(", "),

          rating: null,

          timing:
            item.opening_hours || "Hours not provided",

          serviceDays:
            item.service_days || "Days not provided",

          phone: item.phone || "",

          description:
            item.description || "No description available.",

          verificationStatus:
            item.verification_status || "pending",

          approvalStatus:
            item.approval_status || "pending",

          lastUpdated: item.last_updated || null,

          assistanceInstructions:
            item.assistance_instructions || "",

          requiredDocuments:
            item.required_documents || "",
        };
      });

      setServices(formattedServices);
    } catch (error) {
      console.error("Homepage services error:", error);
      setServiceError(error.message);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ========================================
  // IMAGE FALLBACK
  // ========================================

  const handleImageError = (event) => {
    const image = event.currentTarget;

    if (image.src !== FALLBACK_IMAGE) {
      image.src = FALLBACK_IMAGE;
    } else {
      image.style.display = "none";
    }
  };

  // ========================================
  // LOGOUT
  // ========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);

    window.location.href = "/login";
  };

  // ========================================
  // SEARCH AND FILTER
  // ========================================

  const filteredServices = services
    .filter((service) => {
      const query = search.toLowerCase().trim();

      const searchableText = [
        service.name,
        service.category,
        service.address,
        service.description,
        service.phone,
        service.serviceDays,
        service.assistanceInstructions,
        service.requiredDocuments,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(query);

      const matchesCategory =
        activeCategory === "All" ||
        service.category === activeCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }

      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      return 0;
    });

  // ========================================
  // RESET FILTERS
  // ========================================

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setSortBy("default");
  };

  // ========================================
  // CATEGORY SELECTION
  // ========================================

  const selectCategory = (category) => {
    setActiveCategory(category);

    document.getElementById("explore")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // ========================================
  // GOOGLE MAPS LINK
  // ========================================

  const getMapLink = (service) => {
    const query = encodeURIComponent(
      `${service.name} ${service.address}`
    );

    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  // ========================================
  // HOMEPAGE UI
  // ========================================

  return (
    <div className="app">

      {/* NAVBAR */}

      <nav className="navbar">

        <a href="#home" className="brand">
          <span className="brand-icon">N</span>
          NearNest<span className="brand-dot">.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#categories">Categories</a>
          <a href="#explore">Explore</a>
          <a href="#about">About</a>
        </div>

        <div className="nav-actions">

          {user ? (
            <>
              <span className="welcome-user">
                Welcome, {user.name}
              </span>

              <button
                className="login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn">
                Log in
              </Link>

              <Link to="/register" className="signup-btn">
                Get Started
              </Link>
            </>
          )}

        </div>

        <button
          className="mobile-menu"
          aria-label="Menu"
          type="button"
        >
          <Menu />
        </button>

      </nav>

      <main>

        {/* HERO SECTION */}

        <section className="hero" id="home">

          <div className="hero-content">

            <span className="eyebrow">
              <MapPin size={15} />
              YOUR LOCAL DISCOVERY PLATFORM
            </span>

            <h1>
              Everything you need,
              <br />
              <span>just around the corner.</span>
            </h1>

            <p>
              Discover nearby restaurants, hospitals, pharmacies
              and essential services — all in one place.
            </p>

            <div className="search-box">

              <Search size={21} />

              <input
                type="text"
                placeholder="What are you looking for?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    document
                      .getElementById("explore")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      });
                  }
                }}
              />

              <button
                onClick={() =>
                  document
                    .getElementById("explore")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                Search <ArrowRight size={17} />
              </button>

            </div>

            <div className="location-note">
              <Navigation size={15} />
              Explore services in your area
            </div>

          </div>

          <div className="hero-decoration">

            <div className="hero-circle">
              <MapPin size={65} strokeWidth={1.2} />
              <span>Discover nearby</span>
            </div>

            <div className="floating-card">
              <span className="live-dot"></span>
              Find what you need, faster.
            </div>

          </div>

        </section>

        {/* CATEGORIES */}

        <section
          className="categories section"
          id="categories"
        >

          <div className="section-heading">

            <div>
              <span className="section-label">
                EXPLORE
              </span>

              <h2>What are you looking for?</h2>

              <p>
                Find the right service for your everyday needs.
              </p>
            </div>

          </div>

          <div className="category-grid">

            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  className={`category-card ${
                    activeCategory === category.name
                      ? "selected"
                      : ""
                  } ${
                    category.name === "Urgent Help"
                      ? "urgent-category"
                      : ""
                  }`}
                  key={category.name}
                  onClick={() =>
                    selectCategory(category.name)
                  }
                >

                  <span className="category-icon">
                    <Icon size={25} />
                  </span>

                  <span>{category.name}</span>

                  <ArrowRight
                    size={16}
                    className="category-arrow"
                  />

                </button>
              );
            })}

          </div>

        </section>

        {/* EXPLORE SERVICES */}

        <section
          className="explore section"
          id="explore"
        >

          <div className="section-heading explore-heading">

            <div>
              <span className="section-label">
                DISCOVER NEAR YOU
              </span>

              <h2>Explore local services</h2>

              <p>
                Find useful places and essential services.
              </p>
            </div>

            <button
              className="view-all"
              onClick={resetFilters}
            >
              View all <ArrowRight size={16} />
            </button>

          </div>

          {/* CATEGORY FILTERS */}

          <div className="filter-row">

            {[
              "All",
              ...categories.map((item) => item.name),
            ].map((item) => (
              <button
                key={item}
                className={`filter-btn ${
                  activeCategory === item ? "active" : ""
                }`}
                onClick={() => setActiveCategory(item)}
              >
                {item}
              </button>
            ))}

          </div>

          {/* URGENT HELP DISCLAIMER */}

          {activeCategory === "Urgent Help" && (
            <div className="urgent-disclaimer">

              <AlertTriangle size={21} />

              <div>
                <strong>
                  Important emergency information
                </strong>

                <p>
                  NearNest is a service discovery platform,
                  not an emergency response service.
                  For immediate danger or life-threatening
                  emergencies, contact official emergency services.
                  Do not rely on NearNest for emergency assistance.
                </p>
              </div>

            </div>
          )}

          {/* RESULTS TOOLBAR */}

          <div className="results-toolbar">

            <p>
              Showing{" "}
              <strong>{filteredServices.length}</strong> of{" "}
              <strong>{services.length}</strong> services
            </p>

            <label className="sort-control">

              <SlidersHorizontal size={16} />

              <span>Sort by:</span>

              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value)
                }
              >
                <option value="default">Recommended</option>
                <option value="rating">Highest Rated</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
              </select>

            </label>

          </div>

          {/* SERVICE CARDS */}

          <div className="service-grid">

            {loadingServices ? (

              <div className="empty-state">
                <RefreshCw size={30} />
                <h3>Loading services...</h3>
              </div>

            ) : serviceError ? (

              <div className="empty-state">

                <h3>Unable to load services</h3>

                <p>{serviceError}</p>

                <button
                  className="signup-btn"
                  onClick={fetchServices}
                >
                  Try again
                </button>

              </div>

            ) : filteredServices.length > 0 ? (

              filteredServices.map((service) => (

                <article
                  className="service-card"
                  key={service.id}
                >

                  {/* SERVICE IMAGE */}

                  <div className="service-image">

                    <img
                      src={service.image}
                      alt={service.name}
                      loading="lazy"
                      onError={handleImageError}
                    />

                    <span className="image-badge">
                      APPROVED LISTING
                    </span>

                  </div>

                  <div className="service-info">

                    <div className="service-category">
                      {service.category}
                    </div>

                    <h3>{service.name}</h3>

                    <p className="service-address">
                      <MapPin size={15} />
                      {service.address || "Address not provided"}
                    </p>

                    <div className="service-meta">

                      <span>
                        <Star size={15} />
                        No ratings yet
                      </span>

                      <span>
                        <Clock size={15} />
                        {service.timing}
                      </span>

                    </div>

                    {/* VERIFICATION BADGE */}

                    <div
                      className={`verification-label ${
                        service.verificationStatus
                      }`}
                    >

                      {service.verificationStatus === "verified" ? (
                        <ShieldCheck size={15} />
                      ) : (
                        <Info size={15} />
                      )}

                      {formatVerification(
                        service.verificationStatus
                      )}

                    </div>

                    {/* ACTION BUTTONS */}

                    <div className="service-actions">

                      {service.phone && (
                        <a
                          href={`tel:${service.phone}`}
                          className="call-btn"
                        >
                          <Phone size={15} />
                          Call
                        </a>
                      )}

                      <a
                        href={getMapLink(service)}
                        target="_blank"
                        rel="noreferrer"
                        className="direction-btn"
                      >
                        Directions <ArrowRight size={15} />
                      </a>

                    </div>

                    <button
                      className="details-btn"
                      onClick={() =>
                        setSelectedService(service)
                      }
                    >
                      View Details <ArrowRight size={15} />
                    </button>

                  </div>

                </article>

              ))

            ) : (

              <div className="empty-state">

                <Search size={35} />

                <h3>No services found</h3>

                <p>
                  We couldn't find any matching services.
                  Try another search or category.
                </p>

                <button
                  className="signup-btn"
                  onClick={resetFilters}
                >
                  Clear filters
                </button>

              </div>

            )}

          </div>

          {/* REFRESH LISTINGS */}

          <button
            type="button"
            className="refresh-listings-btn"
            onClick={fetchServices}
            disabled={loadingServices}
          >
            <RefreshCw
              size={16}
              className={
                loadingServices ? "refresh-spinning" : ""
              }
            />

            {loadingServices
              ? "Refreshing..."
              : "Refresh listings"}
          </button>

        </section>

        {/* BUSINESS CTA */}

        <section className="cta-section" id="about">

          <div>

            <span>GROW WITH NEARNEST</span>

            <h2>Own a local business?</h2>

            <p>
              Help people discover your business in their neighbourhood.
            </p>

          </div>

          <Link to="/register" className="signup-btn">
            List your business <ArrowRight size={17} />
          </Link>

        </section>

      </main>

      {/* FOOTER */}

      <footer className="footer">

        <a href="#home" className="brand">
          <span className="brand-icon">N</span>
          NearNest<span className="brand-dot">.</span>
        </a>

        <p>
          Discover more. Live better. Stay connected.
        </p>

        <span>
          © 2026 NearNest. All rights reserved.
        </span>

      </footer>

      {/* SERVICE DETAILS MODAL */}

      {selectedService && (

        <div
          className="modal-overlay"
          onClick={() => setSelectedService(null)}
        >

          <div
            className="service-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="modal-close"
              aria-label="Close details"
              onClick={() => setSelectedService(null)}
            >
              <X size={21} />
            </button>

            {/* MODAL IMAGE */}

            <div className="modal-image">

              <img
                src={selectedService.image}
                alt={selectedService.name}
                onError={handleImageError}
              />

              <span className="image-badge">
                APPROVED LISTING
              </span>

            </div>

            <div className="modal-content">

              <span className="service-category">
                {selectedService.category}
              </span>

              <h2 id="service-modal-title">
                {selectedService.name}
              </h2>

              <p>
                {selectedService.description}
              </p>

              {/* ADDRESS */}

              <div className="modal-detail">
                <MapPin size={18} />
                <span>
                  {selectedService.address || "Address not provided"}
                </span>
              </div>

              {/* OPENING HOURS */}

              <div className="modal-detail">
                <Clock size={18} />
                <span>
                  Opening Hours: {selectedService.timing}
                </span>
              </div>

              {/* SERVICE DAYS */}

              <div className="modal-detail">
                <CalendarDays size={18} />
                <span>
                  Service Days: {selectedService.serviceDays}
                </span>
              </div>

              {/* PHONE */}

              {selectedService.phone && (
                <div className="modal-detail">
                  <Phone size={18} />
                  <span>{selectedService.phone}</span>
                </div>
              )}

              {/* RATINGS */}

              <div className="modal-detail">
                <Star size={18} />
                <span>No ratings yet</span>
              </div>

              {/* VERIFICATION */}

              <div className="modal-information-box">

                <h3>
                  <ShieldCheck size={18} />
                  Organisation Verification
                </h3>

                <div
                  className={`verification-label ${
                    selectedService.verificationStatus
                  }`}
                >
                  {formatVerification(
                    selectedService.verificationStatus
                  )}
                </div>

                <p>
                  Verification status is based on the
                  organisation review recorded by NearNest.
                </p>

              </div>

              {/* LAST UPDATED */}

              <div className="modal-detail">
                <Clock size={18} />

                <span>
                  Last Updated:{" "}
                  {formatDate(selectedService.lastUpdated)}
                </span>
              </div>

              {/* ASSISTANCE INSTRUCTIONS */}

              <div className="modal-information-box">

                <h3>
                  <Info size={18} />
                  How to Get Assistance
                </h3>

                <p>
                  {selectedService.assistanceInstructions ||
                    "Contact the organisation directly for assistance instructions."}
                </p>

              </div>

              {/* REQUIRED DOCUMENTS */}

              <div className="modal-information-box">

                <h3>
                  <FileText size={18} />
                  Required Documents
                </h3>

                <p>
                  {selectedService.requiredDocuments ||
                    "Please contact the organisation to confirm which documents are required."}
                </p>

              </div>

              {/* EMERGENCY DISCLAIMER */}

              {selectedService.category === "Urgent Help" && (

                <div className="urgent-disclaimer">

                  <AlertTriangle size={20} />

                  <p>
                    NearNest is not an emergency response service.
                    Contact official emergency services in an
                    immediate emergency.
                  </p>

                </div>

              )}

              {/* MODAL ACTIONS */}

              <div className="modal-actions">

                {selectedService.phone && (
                  <a
                    href={`tel:${selectedService.phone}`}
                    className="signup-btn"
                  >
                    <Phone size={16} />
                    Call Business
                  </a>
                )}

                <a
                  href={getMapLink(selectedService)}
                  target="_blank"
                  rel="noreferrer"
                  className="modal-map-btn"
                >
                  <Navigation size={16} />
                  Get Directions
                </a>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// ==========================================
// APPLICATION ROUTES
// ==========================================

function App() {
  return (
    <Routes>

      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* PROVIDER ROUTE */}

      <Route
        path="/provider"
        element={
          <RequireRole role="provider">
            <ProviderDashboard />
          </RequireRole>
        }
      />

      {/* ADMIN ROUTE */}

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        }
      />

      {/* UNKNOWN ROUTES */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

export default App;