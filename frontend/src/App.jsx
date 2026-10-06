import { useEffect, useState } from "react";
import "./App.css";

const API_URL =
  "https://ccciuksuuk.execute-api.ap-southeast-2.amazonaws.com";

function App() {
  const [mode, setMode] = useState("student");

  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [resourceError, setResourceError] = useState("");
  const [bookingError, setBookingError] = useState("");

  const [formData, setFormData] = useState({
    resource_id: "",
    user_name: "",
    date: "",
    start_time: "",
    end_time: "",
    purpose: "",
  });

  const [message, setMessage] = useState("");

  // -----------------------------------------
  // Load resources from AWS
  // -----------------------------------------
  const loadResources = async () => {
    try {
      setLoadingResources(true);
      setResourceError("");

      const response = await fetch(`${API_URL}/resources`);

      if (!response.ok) {
        throw new Error(`Failed to load resources (${response.status})`);
      }

      const data = await response.json();

      // AWS returns:
      // { resources: [...] }
      setResources(Array.isArray(data.resources) ? data.resources : []);
    } catch (error) {
      console.error("Error loading resources:", error);
      setResourceError("Unable to load resources.");
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  // -----------------------------------------
  // Load bookings from AWS
  // -----------------------------------------
  const loadBookings = async () => {
    try {
      setLoadingBookings(true);
      setBookingError("");

      const response = await fetch(`${API_URL}/bookings`);

      if (!response.ok) {
        throw new Error(`Failed to load bookings (${response.status})`);
      }

      const data = await response.json();

      // AWS returns:
      // { bookings: [...] }
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookingError("Unable to load bookings.");
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // -----------------------------------------
  // Load data when application starts
  // -----------------------------------------
  useEffect(() => {
    loadResources();
    loadBookings();
  }, []);

  // -----------------------------------------
  // Handle form changes
  // -----------------------------------------
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // -----------------------------------------
  // Create booking
  // -----------------------------------------
  const handleBookingSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setBookingError("");

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create booking.");
      }

      setMessage("Booking request submitted successfully.");

      // Clear form
      setFormData({
        resource_id: "",
        user_name: "",
        date: "",
        start_time: "",
        end_time: "",
        purpose: "",
      });

      // Refresh bookings
      await loadBookings();
    } catch (error) {
      console.error("Booking error:", error);
      setBookingError(error.message || "Unable to create booking.");
    }
  };

  // -----------------------------------------
  // Approve booking
  // -----------------------------------------
  const approveBooking = async (bookingId) => {
    setMessage("");
    setBookingError("");

    try {
      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/approve`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to approve booking.");
      }

      setMessage("Booking approved successfully.");

      await loadBookings();
    } catch (error) {
      console.error("Approval error:", error);
      setBookingError(error.message || "Unable to approve booking.");
    }
  };

  // -----------------------------------------
  // Reject booking
  // -----------------------------------------
  const rejectBooking = async (bookingId) => {
    setMessage("");
    setBookingError("");

    try {
      const response = await fetch(
        `${API_URL}/bookings/${bookingId}/reject`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to reject booking.");
      }

      setMessage("Booking rejected successfully.");

      await loadBookings();
    } catch (error) {
      console.error("Rejection error:", error);
      setBookingError(error.message || "Unable to reject booking.");
    }
  };

  // -----------------------------------------
  // Find resource name
  // -----------------------------------------
  const getResourceName = (resourceId) => {
    const resource = resources.find(
      (item) => item.id === resourceId
    );

    return resource ? resource.name : resourceId;
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1>Smart Campus</h1>
          <p>Resource Booking & Allocation System</p>
        </div>

        <div className="mode-buttons">
          <button
            className={mode === "student" ? "active" : ""}
            onClick={() => {
              setMode("student");
              setMessage("");
              setBookingError("");
            }}
          >
            Student
          </button>

          <button
            className={mode === "admin" ? "active" : ""}
            onClick={() => {
              setMode("admin");
              setMessage("");
              setBookingError("");
            }}
          >
            Admin
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Messages */}
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {resourceError && (
          <div className="error-message">
            {resourceError}
          </div>
        )}

        {bookingError && (
          <div className="error-message">
            {bookingError}
          </div>
        )}

        {/* ============================
            STUDENT DASHBOARD
        ============================ */}
        {mode === "student" && (
          <>
            <section className="dashboard-heading">
              <h2>Student Dashboard</h2>
              <p>
                View campus resources and submit booking requests.
              </p>
            </section>

            {/* Resources */}
            <section className="resources-section">
              <h2>Available Resources</h2>

              {loadingResources ? (
                <p className="loading-text">
                  Loading resources...
                </p>
              ) : resources.length === 0 ? (
                <p className="loading-text">
                  No resources available.
                </p>
              ) : (
                <div className="resource-grid">
                  {resources.map((resource) => (
                    <div
                      className="resource-card"
                      key={resource.id}
                    >
                      <h3>{resource.name}</h3>

                      <p>
                        <strong>Type:</strong>{" "}
                        {resource.type}
                      </p>

                      <p>
                        <strong>Location:</strong>{" "}
                        {resource.location}
                      </p>

                      <p>
                        <strong>Capacity:</strong>{" "}
                        {resource.capacity}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Booking Form */}
            <section className="booking-section">
              <h2>Book a Resource</h2>

              <form onSubmit={handleBookingSubmit}>
                <div className="form-group">
                  <label htmlFor="resource_id">
                    Resource
                  </label>

                  <select
                    id="resource_id"
                    name="resource_id"
                    value={formData.resource_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select a resource
                    </option>

                    {resources.map((resource) => (
                      <option
                        key={resource.id}
                        value={resource.id}
                      >
                        {resource.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="user_name">
                    Your Name
                  </label>

                  <input
                    id="user_name"
                    name="user_name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.user_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">
                    Date
                  </label>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="time-row">
                  <div className="form-group">
                    <label htmlFor="start_time">
                      Start Time
                    </label>

                    <input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_time">
                      End Time
                    </label>

                    <input
                      id="end_time"
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="purpose">
                    Purpose
                  </label>

                  <input
                    id="purpose"
                    name="purpose"
                    type="text"
                    placeholder="Enter purpose of booking"
                    value={formData.purpose}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  className="submit-button"
                  type="submit"
                >
                  Submit Booking Request
                </button>
              </form>
            </section>

            {/* Student Bookings */}
            <section className="bookings-section">
              <h2>Bookings</h2>

              {loadingBookings ? (
                <p className="loading-text">
                  Loading bookings...
                </p>
              ) : bookings.length === 0 ? (
                <p className="loading-text">
                  No bookings found.
                </p>
              ) : (
                <div className="booking-list">
                  {bookings.map((booking) => (
                    <div
                      className="booking-card"
                      key={booking.id}
                    >
                      <div>
                        <h3>
                          {getResourceName(
                            booking.resource_id
                          )}
                        </h3>

                        <p>
                          <strong>Booking ID:</strong>{" "}
                          {booking.id}
                        </p>

                        <p>
                          <strong>Name:</strong>{" "}
                          {booking.user_name}
                        </p>

                        <p>
                          <strong>Date:</strong>{" "}
                          {booking.date}
                        </p>

                        <p>
                          <strong>Time:</strong>{" "}
                          {booking.start_time} -{" "}
                          {booking.end_time}
                        </p>

                        <p>
                          <strong>Purpose:</strong>{" "}
                          {booking.purpose}
                        </p>
                      </div>

                      <span
                        className={`status ${String(
                          booking.status
                        ).toLowerCase()}`}
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

        {/* ============================
            ADMIN DASHBOARD
        ============================ */}
        {mode === "admin" && (
          <>
            <section className="dashboard-heading">
              <h2>Admin Dashboard</h2>
              <p>
                Manage campus resource booking requests.
              </p>
            </section>

            <section className="admin-section">
              <h2>Booking Requests</h2>

              {loadingBookings ? (
                <p className="loading-text">
                  Loading booking requests...
                </p>
              ) : bookings.length === 0 ? (
                <p className="loading-text">
                  No booking requests found.
                </p>
              ) : (
                <div className="admin-booking-list">
                  {bookings.map((booking) => (
                    <div
                      className="admin-booking-card"
                      key={booking.id}
                    >
                      <div className="booking-details">
                        <h3>
                          {getResourceName(
                            booking.resource_id
                          )}
                        </h3>

                        <p>
                          <strong>Booking ID:</strong>{" "}
                          {booking.id}
                        </p>

                        <p>
                          <strong>User:</strong>{" "}
                          {booking.user_name}
                        </p>

                        <p>
                          <strong>Date:</strong>{" "}
                          {booking.date}
                        </p>

                        <p>
                          <strong>Time:</strong>{" "}
                          {booking.start_time} -{" "}
                          {booking.end_time}
                        </p>

                        <p>
                          <strong>Purpose:</strong>{" "}
                          {booking.purpose}
                        </p>

                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`status ${String(
                              booking.status
                            ).toLowerCase()}`}
                          >
                            {booking.status}
                          </span>
                        </p>
                      </div>

                      {booking.status === "PENDING" && (
                        <div className="admin-actions">
                          <button
                            className="approve-button"
                            onClick={() =>
                              approveBooking(
                                booking.id
                              )
                            }
                          >
                            Approve
                          </button>

                          <button
                            className="reject-button"
                            onClick={() =>
                              rejectBooking(
                                booking.id
                              )
                            }
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;