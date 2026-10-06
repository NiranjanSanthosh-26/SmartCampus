import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import "./App.css";

const API_URL =
  "https://ccciuksuuk.execute-api.ap-southeast-2.amazonaws.com";

const COGNITO_DOMAIN =
  "https://ap-southeast-2tcn2pfyzg.auth.ap-southeast-2.amazoncognito.com";

const COGNITO_CLIENT_ID =
  "2ccooos6njocfrr07h9g99lc7u";

const LOGOUT_URI = "http://localhost:5173/";

function App() {
  const auth = useAuth();

  // --------------------------------------------------
  // COGNITO SIGN OUT
  // --------------------------------------------------
  // Cognito managed login expects client_id + logout_uri
  // on its /logout endpoint. Clear the local OIDC user
  // first, then terminate the Cognito managed-login session.
  async function handleSignOut() {
    const params = new URLSearchParams({
      client_id: COGNITO_CLIENT_ID,
      logout_uri: LOGOUT_URI,
    });

    const logoutUrl = `${COGNITO_DOMAIN}/logout?${params.toString()}`;

    try {
      await auth.removeUser();
    } catch (err) {
      console.error("Unable to clear local authentication state:", err);
    } finally {
      window.location.replace(logoutUrl);
    }
  }

  // --------------------------------------------------
  // COGNITO USER / ROLE INFORMATION
  // --------------------------------------------------

  const groups = auth.user?.profile?.["cognito:groups"] || [];

  const isAdmin = groups.includes("Admins");
  const isStudent = groups.includes("Students");

  const displayName =
    auth.user?.profile?.name ||
    auth.user?.profile?.preferred_username ||
    auth.user?.profile?.email ||
    "User";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  // --------------------------------------------------
  // APPLICATION STATE
  // --------------------------------------------------

  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [selectedResource, setSelectedResource] = useState("");
  const [userName, setUserName] = useState("Niranjan");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // LOAD DATA AFTER AUTHENTICATION
  // --------------------------------------------------

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadResources();
      loadBookings();

      const email = auth.user?.profile?.email;

      if (email) {
        setUserName(email);
      }
    }
  }, [auth.isAuthenticated, auth.user]);

  // --------------------------------------------------
  // LOAD RESOURCES
  // --------------------------------------------------

  async function loadResources() {
    try {
      const response = await fetch(`${API_URL}/resources`);
      const data = await response.json();

      setResources(
        Array.isArray(data.resources) ? data.resources : []
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load resources.");
    }
  }

  // --------------------------------------------------
  // LOAD BOOKINGS
  // --------------------------------------------------

  async function loadBookings() {
    try {
      const response = await fetch(`${API_URL}/bookings`);
      const data = await response.json();

      setBookings(
        Array.isArray(data.bookings) ? data.bookings : []
      );
    } catch (err) {
      console.error(err);
      setError("Unable to load bookings.");
    }
  }

  // --------------------------------------------------
  // CLEAR MESSAGES
  // --------------------------------------------------

  function clearMessages() {
    setMessage("");
    setError("");
  }

  // --------------------------------------------------
  // CREATE BOOKING
  // --------------------------------------------------

  async function handleBookingSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (!selectedResource) {
      setError("Please select a resource.");
      return;
    }

    if (!date || !startTime || !endTime || !purpose) {
      setError("Please fill in all booking details.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resource_id: selectedResource,
          user_name: userName,
          date,
          start_time: startTime,
          end_time: endTime,
          purpose,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Booking could not be created.");
        return;
      }

      setMessage("Booking request submitted successfully.");

      setSelectedResource("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");

      await loadBookings();
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the booking service.");
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // APPROVE BOOKING
  // --------------------------------------------------

  async function approveBooking(id) {
    clearMessages();

    try {
      const response = await fetch(
        `${API_URL}/bookings/${id}/approve`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to approve booking.");
        return;
      }

      setMessage("Booking approved successfully.");
      await loadBookings();
    } catch (err) {
      console.error(err);
      setError("Unable to approve booking.");
    }
  }

  // --------------------------------------------------
  // REJECT BOOKING
  // --------------------------------------------------

  async function rejectBooking(id) {
    clearMessages();

    try {
      const response = await fetch(
        `${API_URL}/bookings/${id}/reject`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to reject booking.");
        return;
      }

      setMessage("Booking rejected successfully.");
      await loadBookings();
    } catch (err) {
      console.error(err);
      setError("Unable to reject booking.");
    }
  }

  // --------------------------------------------------
  // HELPER FUNCTIONS
  // --------------------------------------------------

  function getResourceName(resourceId) {
    const resource = resources.find(
      (item) => item.id === resourceId
    );

    return resource ? resource.name : resourceId;
  }

  function getStatusClass(status) {
    return status?.toLowerCase() || "";
  }

  const pendingCount = bookings.filter(
    (booking) => booking.status === "PENDING"
  ).length;

  const approvedCount = bookings.filter(
    (booking) => booking.status === "APPROVED"
  ).length;

  // --------------------------------------------------
  // AUTHENTICATION LOADING SCREEN
  // --------------------------------------------------

  if (auth.isLoading) {
    return (
      <div className="app">
        <main className="main-container">
          <section className="section-card">
            <div className="empty-state">
              <div>🔐</div>
              <h4>Checking your login...</h4>
              <p>
                Please wait while SmartCampus verifies your
                account.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --------------------------------------------------
  // AUTHENTICATION ERROR
  // --------------------------------------------------

  if (auth.error) {
    return (
      <div className="app">
        <main className="main-container">
          <section className="section-card">
            <div className="empty-state">
              <div>⚠️</div>

              <h4>Authentication Error</h4>

              <p>{auth.error.message}</p>

              <button
                className="primary-button"
                onClick={() => auth.signinRedirect()}
              >
                Try Again
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --------------------------------------------------
  // LOGIN SCREEN
  // --------------------------------------------------

  if (!auth.isAuthenticated) {
    return (
      <div className="app">
        <main className="main-container">
          <section className="hero">
            <div>
              <p className="eyebrow">SMART CAMPUS</p>

              <h2>Welcome to SmartCampus.</h2>

              <p className="hero-text">
                Sign in to book campus resources and manage your
                booking requests.
              </p>

              <button
                className="primary-button"
                onClick={() => auth.signinRedirect()}
              >
                Sign in with Cognito →
              </button>
            </div>

            <div className="hero-icon">
              🔐
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>SmartCampus Resource Booking System</p>

          <span>
            AWS Powered • Secure • Scalable
          </span>
        </footer>
      </div>
    );
  }

  // --------------------------------------------------
  // AUTHENTICATED USER WITHOUT A ROLE
  // --------------------------------------------------

  if (!isStudent && !isAdmin) {
    return (
      <div className="app">
        <main className="main-container">
          <section className="section-card">
            <div className="empty-state">
              <div>🚫</div>

              <h4>No SmartCampus role assigned</h4>

              <p>
                Your Cognito account is authenticated, but it is
                not assigned to the Students or Admins group.
              </p>

              <button
                className="primary-button"
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN APPLICATION
  // --------------------------------------------------

  return (
    <div className="app">

      {/* HEADER */}
      <header className="topbar">

        <div className="brand">

          <div className="brand-icon">
            🏫
          </div>

          <div>
            <h1>SmartCampus</h1>

            <p>
              Resource Booking System
            </p>
          </div>

        </div>

        <div className="topbar-right">

          {/* LOGGED-IN USER */}
          <div className="user-info">

            <span className="user-avatar">
              {avatarLetter}
            </span>

            <div>

              <strong>
                {displayName}
              </strong>

              <span>
                {isAdmin ? "Admin" : "Student"}
              </span>

            </div>

          </div>

          {/* ROLE + SIGN OUT */}
          <div className="mode-switch">

            <span
              style={{
                padding: "10px 14px",
                fontWeight: "600",
                color: "#1f3c88",
              }}
            >
              {isAdmin ? "Admin" : "Student"}
            </span>

            <button
              onClick={handleSignOut}
            >
              Sign Out
            </button>

          </div>

        </div>

      </header>

      {/* MAIN CONTENT */}
      <main className="main-container">

        {/* NOTIFICATIONS */}

        {message && (
          <div className="alert success-alert">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="alert error-alert">
            ⚠ {error}
          </div>
        )}

        {/* ==================================================
            STUDENT VIEW
        ================================================== */}

        {isStudent && (
          <>

            {/* HERO */}

            <section className="hero">

              <div>

                <p className="eyebrow">
                  CAMPUS RESOURCE MANAGEMENT
                </p>

                <h2>
                  Book the resources you need.
                </h2>

                <p className="hero-text">
                  Find available campus facilities and submit
                  booking requests in just a few clicks.
                </p>

              </div>

              <div className="hero-icon">
                📅
              </div>

            </section>

            {/* BOOKING SECTION */}

            <section className="section-card booking-section">

              <div className="section-heading">

                <div>

                  <span className="section-number">
                    01
                  </span>

                  <div>

                    <h3>
                      Booking Details
                    </h3>

                    <p>
                      Select when you need the resource.
                    </p>

                  </div>

                </div>

              </div>

              <form
                className="booking-form"
                onSubmit={handleBookingSubmit}
              >

                <div className="form-grid">

                  {/* DATE */}

                  <div className="form-group">

                    <label>
                      Date
                    </label>

                    <input
                      type="date"
                      value={date}
                      onChange={(e) =>
                        setDate(e.target.value)
                      }
                    />

                  </div>

                  {/* START TIME */}

                  <div className="form-group">

                    <label>
                      Start Time
                    </label>

                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) =>
                        setStartTime(e.target.value)
                      }
                    />

                  </div>

                  {/* END TIME */}

                  <div className="form-group">

                    <label>
                      End Time
                    </label>

                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) =>
                        setEndTime(e.target.value)
                      }
                    />

                  </div>

                </div>

                {/* PURPOSE */}

                <div className="form-group full-width">

                  <label>
                    Purpose of Booking
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Software Engineering Project"
                    value={purpose}
                    onChange={(e) =>
                      setPurpose(e.target.value)
                    }
                  />

                </div>

                {/* RESOURCE SELECTION */}

                <div className="resource-selection">

                  <div className="selection-title">

                    <div>

                      <span className="section-number">
                        02
                      </span>

                      <div>

                        <h3>
                          Select a Resource
                        </h3>

                        <p>
                          Choose the facility you want to book.
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="resource-grid">

                    {resources.map((resource) => (

                      <button
                        type="button"
                        key={resource.id}
                        className={`resource-card ${
                          selectedResource === resource.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedResource(resource.id)
                        }
                      >

                        <div className="resource-icon">

                          {resource.type === "Laboratory"
                            ? "💻"
                            : resource.type === "Seminar Hall"
                            ? "🎤"
                            : "🏟️"}

                        </div>

                        <div className="resource-info">

                          <span className="resource-type">
                            {resource.type}
                          </span>

                          <h4>
                            {resource.name}
                          </h4>

                          <p>
                            📍 {resource.location}
                          </p>

                          <p>
                            👥 Capacity: {resource.capacity}
                          </p>

                        </div>

                        <div className="resource-status">

                          <span className="available-dot"></span>

                          Available

                        </div>

                        {selectedResource === resource.id && (
                          <div className="selected-check">
                            ✓
                          </div>
                        )}

                      </button>

                    ))}

                  </div>

                </div>

                {/* SUBMIT */}

                <div className="submit-row">

                  <div className="selection-summary">

                    {selectedResource ? (
                      <>
                        <span>
                          Selected resource
                        </span>

                        <strong>
                          {getResourceName(
                            selectedResource
                          )}
                        </strong>
                      </>
                    ) : (
                      <span>
                        Select a resource to continue
                      </span>
                    )}

                  </div>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={loading}
                  >
                    {loading
                      ? "Submitting..."
                      : "Submit Booking Request →"}
                  </button>

                </div>

              </form>

            </section>

            {/* MY BOOKINGS */}

            <section className="section-card">

              <div className="section-heading">

                <div>

                  <span className="section-number">
                    03
                  </span>

                  <div>

                    <h3>
                      My Bookings
                    </h3>

                    <p>
                      Track your resource booking requests.
                    </p>

                  </div>

                </div>

              </div>

              {bookings.length === 0 ? (

                <div className="empty-state">

                  <div>
                    📋
                  </div>

                  <h4>
                    No bookings yet
                  </h4>

                  <p>
                    Your booking requests will appear here.
                  </p>

                </div>

              ) : (

                <div className="booking-list">

                  {bookings.map((booking) => (

                    <div
                      className="booking-item"
                      key={booking.id}
                    >

                      <div className="booking-icon">
                        📅
                      </div>

                      <div className="booking-details">

                        <h4>
                          {getResourceName(
                            booking.resource_id
                          )}
                        </h4>

                        <p>
                          {booking.date} &nbsp;•&nbsp;
                          {booking.start_time} –
                          {booking.end_time}
                        </p>

                        <span>
                          {booking.purpose}
                        </span>

                      </div>

                      <span
                        className={`status ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>

                    </div>

                  ))}

                </div>

              )}

            </section>

          </>
        )}

        {/* ==================================================
            ADMIN VIEW
        ================================================== */}

        {isAdmin && (
          <>

            {/* ADMIN HERO */}

            <section className="hero admin-hero">

              <div>

                <p className="eyebrow">
                  ADMINISTRATION
                </p>

                <h2>
                  Manage campus bookings.
                </h2>

                <p className="hero-text">
                  Review, approve and reject resource booking
                  requests from students.
                </p>

              </div>

              <div className="hero-icon">
                ⚙️
              </div>

            </section>

            {/* ADMIN STATS */}

            <section className="stats-grid">

              <div className="stat-card">

                <span className="stat-icon">
                  🏫
                </span>

                <div>

                  <strong>
                    {resources.length}
                  </strong>

                  <span>
                    Resources
                  </span>

                </div>

              </div>

              <div className="stat-card">

                <span className="stat-icon">
                  ⏳
                </span>

                <div>

                  <strong>
                    {pendingCount}
                  </strong>

                  <span>
                    Pending Requests
                  </span>

                </div>

              </div>

              <div className="stat-card">

                <span className="stat-icon">
                  ✓
                </span>

                <div>

                  <strong>
                    {approvedCount}
                  </strong>

                  <span>
                    Approved
                  </span>

                </div>

              </div>

            </section>

            {/* ADMIN BOOKINGS */}

            <section className="section-card">

              <div className="section-heading">

                <div>

                  <span className="section-number">
                    01
                  </span>

                  <div>

                    <h3>
                      Booking Requests
                    </h3>

                    <p>
                      Review and manage all booking requests.
                    </p>

                  </div>

                </div>

              </div>

              {bookings.length === 0 ? (

                <div className="empty-state">

                  <div>
                    📋
                  </div>

                  <h4>
                    No booking requests
                  </h4>

                  <p>
                    New requests will appear here.
                  </p>

                </div>

              ) : (

                <div className="admin-booking-list">

                  {bookings.map((booking) => (

                    <div
                      className="admin-booking"
                      key={booking.id}
                    >

                      <div className="admin-booking-main">

                        <div className="booking-icon large">
                          📅
                        </div>

                        <div>

                          <h4>
                            {getResourceName(
                              booking.resource_id
                            )}
                          </h4>

                          <p className="booking-user">

                            Requested by{" "}

                            <strong>
                              {booking.user_name}
                            </strong>

                          </p>

                          <p>
                            {booking.date} &nbsp;•&nbsp;
                            {booking.start_time} –
                            {booking.end_time}
                          </p>

                          <span className="booking-purpose">
                            {booking.purpose}
                          </span>

                        </div>

                      </div>

                      <div className="admin-booking-actions">

                        <span
                          className={`status ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>

                        {booking.status === "PENDING" && (

                          <div className="action-buttons">

                            <button
                              className="approve-button"
                              onClick={() =>
                                approveBooking(
                                  booking.id
                                )
                              }
                            >
                              ✓ Approve
                            </button>

                            <button
                              className="reject-button"
                              onClick={() =>
                                rejectBooking(
                                  booking.id
                                )
                              }
                            >
                              ✕ Reject
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </section>

          </>
        )}

      </main>

      {/* FOOTER */}

      <footer className="footer">

        <p>
          SmartCampus Resource Booking System
        </p>

        <span>
          AWS Powered • Secure • Scalable
        </span>

      </footer>

    </div>
  );
}

export default App; 