import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import Signup from "./Signup";
import "./App.css";


// ============================================================
// AWS API CONFIGURATION
// ============================================================

const API_URL =
  "https://ccciuksuuk.execute-api.ap-southeast-2.amazonaws.com";


// ============================================================
// COGNITO CONFIGURATION
// ============================================================

const cognitoAuthConfig = {
  authority:
    "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_TcN2PfyZG",

  client_id:
    "2ccooos6njocfrr07h9g99lc7u",

  redirect_uri:
    window.location.origin + "/",

  response_type: "code",

  scope: "openid email",

  automaticSilentRenew: true
};


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getStatusClass(status) {
  if (!status) {
    return "";
  }

  return status.toLowerCase();
}


function formatDate(date) {
  if (!date) {
    return "";
  }

  const d = new Date(date + "T00:00:00");

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


// ============================================================
// APP COMPONENT
// ============================================================

export default function App() {

  const auth = useAuth();


  // ==========================================================
  // STATE
  // ==========================================================

  const [resources, setResources] = useState([]);

  const [bookings, setBookings] = useState([]);

  const [selectedResource, setSelectedResource] =
    useState(null);

  const [activePage, setActivePage] =
    useState("dashboard");

  const [selectedDate, setSelectedDate] =
    useState("");

  const [startTime, setStartTime] =
    useState("");

  const [endTime, setEndTime] =
    useState("");

  const [purpose, setPurpose] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [adminRemarks, setAdminRemarks] =
    useState({});

  const [loading, setLoading] =
    useState(false);

  const [showSignup, setShowSignup] =
    useState(false);


  // ==========================================================
  // USER INFORMATION
  // ==========================================================

  const userEmail =
    auth.user?.profile?.email || "";

  const userName =
    auth.user?.profile?.name ||
    auth.user?.profile?.email ||
    "User";


  // ==========================================================
  // ROLE DETECTION
  // ==========================================================

  const groups =
    auth.user?.profile?.["cognito:groups"] ||
    [];

  const isAdmin = groups.includes("Admins");
  const isFaculty = groups.includes("Faculty");
  const isStudent = groups.includes("Students");


  // ==========================================================
  // LOAD RESOURCES
  // ==========================================================

  async function loadResources() {

    try {

      const response =
        await fetch(
          `${API_URL}/resources`
        );

      const data =
        await response.json();

      if (response.ok) {

        setResources(
          data.resources || []
        );

      }

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load resources."
      );
    }
  }


  // ==========================================================
  // LOAD BOOKINGS
  // ==========================================================

  async function loadBookings() {

    try {

      const response =
        await fetch(
          `${API_URL}/bookings`
        );

      const data =
        await response.json();

      if (response.ok) {

        setBookings(
          data.bookings || []
        );

      }

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load bookings."
      );
    }
  }


  // ==========================================================
  // INITIAL DATA LOAD
  // ==========================================================

  useEffect(() => {

    if (!auth.isAuthenticated) {
      return;
    }

    loadResources();
    loadBookings();

  }, [auth.isAuthenticated]);


  // ==========================================================
  // CLEAR MESSAGES
  // ==========================================================

  function clearMessages() {

    setMessage("");
    setError("");

  }


  // ==========================================================
  // CREATE BOOKING
  // ==========================================================

  async function createBooking(event) {

    event.preventDefault();

    clearMessages();

    if (!selectedResource) {

      setError(
        "Please select a resource."
      );

      return;
    }

    if (!selectedDate) {

      setError(
        "Please select a date."
      );

      return;
    }

    if (!startTime || !endTime) {

      setError(
        "Please select start and end time."
      );

      return;
    }

    if (startTime >= endTime) {

      setError(
        "End time must be later than start time."
      );

      return;
    }

    if (!purpose.trim()) {

      setError(
        "Please enter the purpose."
      );

      return;
    }


    setLoading(true);

    try {

      const response =
        await fetch(
          `${API_URL}/bookings`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              resource_id:
                selectedResource.id,

              user_name:
                userName,

              user_email:
                userEmail,

              date:
                selectedDate,

              start_time:
                startTime,

              end_time:
                endTime,

              purpose:
                purpose.trim()
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.message ||
          "Unable to create booking."
        );

        return;
      }


      setMessage(
        "Booking request submitted successfully."
      );


      // Reset form
      setSelectedResource(null);
      setSelectedDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");


      // Refresh bookings
      await loadBookings();

    } catch (err) {

      console.error(err);

      setError(
        "Unable to create booking."
      );

    } finally {

      setLoading(false);
    }
  }


  // ==========================================================
  // APPROVE BOOKING
  // ==========================================================

  async function approveBooking(id) {
    clearMessages();

    const remark =
      (adminRemarks[id] || "").trim();

    try {
      const response = await fetch(
        `${API_URL}/bookings/${id}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            admin_remark: remark
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          "Unable to approve booking."
        );
        return;
      }

      setMessage(
        "Booking approved successfully."
      );

      setAdminRemarks(previous => {
        const updated = {
          ...previous
        };

        delete updated[id];

        return updated;
      });

      await loadBookings();

    } catch (err) {
      console.error(err);

      setError(
        "Unable to approve booking."
      );
    }
  }



  // ==========================================================
  // REJECT BOOKING
  // ==========================================================

  async function rejectBooking(id) {
    clearMessages();

    const remark =
      (adminRemarks[id] || "").trim();

    try {
      const response = await fetch(
        `${API_URL}/bookings/${id}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            admin_remark: remark
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          "Unable to reject booking."
        );
        return;
      }

      setMessage(
        "Booking rejected successfully."
      );

      setAdminRemarks(previous => {
        const updated = {
          ...previous
        };

        delete updated[id];

        return updated;
      });

      await loadBookings();

    } catch (err) {
      console.error(err);

      setError(
        "Unable to reject booking."
      );
    }
  }



  // ==========================================================
  // WITHDRAW BOOKING
  // ==========================================================

  async function withdrawBooking(id) {

    clearMessages();


    // --------------------------------------------------------
    // Make sure the logged-in student has an email
    // --------------------------------------------------------

    const currentUserEmail =
      auth.user?.profile?.email;


    if (!currentUserEmail) {

      setError(
        "Unable to identify your account."
      );

      return;
    }


    try {

      const response =
        await fetch(
          `${API_URL}/bookings/${id}/withdraw`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              user_email:
                currentUserEmail

            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        setError(
          data.message ||
          "Unable to withdraw booking."
        );

        return;
      }


      setMessage(
        "Booking withdrawn successfully."
      );


      // Refresh booking list
      await loadBookings();

    } catch (err) {

      console.error(err);

      setError(
        "Unable to withdraw booking."
      );
    }
  }


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function logout() {
    const clientId =
      "2ccooos6njocfrr07h9g99lc7u";

    const cognitoDomain =
      "https://ap-southeast-2tcn2pfyzg.auth.ap-southeast-2.amazoncognito.com";

    const logoutUri =
      `${window.location.origin}/`;

    // Clear the local OIDC session first
    auth.removeUser();

    // Then log out from Cognito
    const logoutUrl =
      `${cognitoDomain}/logout` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&logout_uri=${encodeURIComponent(logoutUri)}`;

    window.location.replace(logoutUrl);
  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  if (auth.isLoading) {

    return (
      <div className="loading-screen">

        <div className="loading-card">

          <h2>
            SmartCampus
          </h2>

          <p>
            Loading...
          </p>

        </div>

      </div>
    );
  }


  if (auth.error) {

    return (
      <div className="loading-screen">

        <div className="loading-card">

          <h2>
            Authentication Error
          </h2>

          <p>
            {auth.error.message}
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // PUBLIC WELCOME PAGE
  // ==========================================================

  if (!auth.isAuthenticated) {
    if(showSignup){
      return(
        <Signup
          onBackToLogin={() =>
            setShowSignup(false)
          }
        />
      );
    }

    return (
      <div className="welcome-page">

        <div className="welcome-card">

          <div className="brand-mark">
            SC
          </div>

          <h1>
            SmartCampus
          </h1>

          <p>
            Smart Resource Booking &
            Allocation System
          </p>

          <button
            className="primary-button"
            onClick={() =>
              auth.signinRedirect()
            }
          >
            Sign in with Cognito
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              setShowSignup(true)
            }
          >
            Create an Account
          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ROLE VALIDATION
  // ==========================================================

  if (!isStudent && !isFaculty && !isAdmin) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <h2>SmartCampus</h2>
          <p>
            Your account is authenticated, but no SmartCampus role
            is assigned. Please contact the administrator.
          </p>
          <button className="primary-button" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }


  // ==========================================================
  // CALCULATED BOOKING DATA
  // ==========================================================

  const myBookings =
    bookings.filter(
      booking =>
        booking.user_email ===
        userEmail
    );


  const pendingBookings =
    bookings.filter(
      booking =>
        booking.status === "PENDING"
    );


  const approvedBookings =
    bookings.filter(
      booking =>
        booking.status === "APPROVED"
    );


  const rejectedBookings =
    bookings.filter(
      booking =>
        booking.status === "REJECTED"
    );


  const withdrawnBookings =
    bookings.filter(
      booking =>
        booking.status === "WITHDRAWN"
    );


  // ==========================================================
  // RESOURCE NAME HELPER
  // ==========================================================

  function getResourceName(resourceId) {

    const resource =
      resources.find(
        item =>
          item.id === resourceId
      );

    return resource
      ? resource.name
      : resourceId;
  }


  // ==========================================================
  // STUDENT DASHBOARD
  // ==========================================================

  function renderStudentDashboard() {

    return (
      <>

        <div className="page-header">

          <div>

            <h1>
              Welcome back,
              {" "}
              {userName}
            </h1>

            <p>
              {isFaculty
                ? "Book campus resources and track your faculty booking requests."
                : "Manage your campus resource bookings."}
            </p>

          </div>

        </div>


        <div className="stats-grid">

          <div className="stat-card">

            <span>
              My Bookings
            </span>

            <strong>
              {myBookings.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Pending
            </span>

            <strong>
              {
                myBookings.filter(
                  b =>
                    b.status ===
                    "PENDING"
                ).length
              }
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Approved
            </span>

            <strong>
              {
                myBookings.filter(
                  b =>
                    b.status ===
                    "APPROVED"
                ).length
              }
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Available Resources
            </span>

            <strong>
              {resources.length}
            </strong>

          </div>

        </div>


        <div className="dashboard-grid">

          <div className="dashboard-card">

            <div className="card-heading">

              <div>

                <h2>
                  Quick Booking
                </h2>

                <p>
                  {isFaculty
                  ? "Reserve a campus resource for academic activities."
                  : "Reserve a campus resource."}
                </p>

              </div>

              <button
                className="secondary-button"
                onClick={() =>
                  setActivePage(
                    "resources"
                  )
                }
              >
                View Resources
              </button>

            </div>

          </div>


          <div className="dashboard-card">

            <div className="card-heading">

              <div>

                <h2>
                  Recent Bookings
                </h2>

                <p>
                  Your latest requests.
                </p>

              </div>

              <button
                className="secondary-button"
                onClick={() =>
                  setActivePage(
                    "bookings"
                  )
                }
              >
                View All
              </button>

            </div>


            {myBookings.length === 0 ? (

              <div className="empty-state">

                <p>
                  No bookings yet.
                </p>

              </div>

            ) : (

              <div className="booking-list">

                {myBookings
                  .slice(-3)
                  .reverse()
                  .map(booking => (

                    <div
                      className="booking-row"
                      key={booking.id}
                    >

                      <div>

                        <strong>
                          {
                            getResourceName(
                              booking.resource_id
                            )
                          }
                        </strong>

                        <span>
                          {formatDate(
                            booking.date
                          )}
                          {" • "}
                          {
                            booking.start_time
                          }
                          {" - "}
                          {
                            booking.end_time
                          }
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

          </div>

        </div>

      </>
    );
  }


  // ==========================================================
  // RESOURCE PAGE
  // ==========================================================

  function renderResources() {

    return (
      <>

        <div className="page-header">

          <div>

            <h1>
              Select a Resource
            </h1>

            <p>
              {isFaculty
                ? "Choose a campus resource you want to reserve."
                : "Choose the resource you want to reserve."}
            </p>

          </div>

        </div>


        <div className="resource-grid">

          {resources.map(resource => (

            <div
              className={`resource-card ${
                selectedResource?.id ===
                resource.id
                  ? "selected"
                  : ""
              }`}
              key={resource.id}
              onClick={() =>
                setSelectedResource(
                  resource
                )
              }
            >

              <div className="resource-icon">
                {resource.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>


              <div className="resource-content">

                <h3>
                  {resource.name}
                </h3>

                <p>
                  {resource.type}
                </p>

                <span>
                  {resource.location}
                  {" • "}
                  Capacity:
                  {" "}
                  {resource.capacity}
                </span>

              </div>


              <div className="resource-availability">

                <span className="available-dot"></span>

                Available

              </div>

            </div>

          ))}

        </div>


        {selectedResource && (

          <div className="booking-form-card">

            <div className="card-heading">

              <div>

                <h2>
                  Booking Details
                </h2>

                <p>
                  {
                    selectedResource.name
                  }
                </p>

              </div>

            </div>


            <form
              onSubmit={
                createBooking
              }
            >

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Date
                  </label>

                  <input
                    type="date"
                    value={
                      selectedDate
                    }
                    onChange={event =>
                      setSelectedDate(
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    Start Time
                  </label>

                  <input
                    type="time"
                    value={
                      startTime
                    }
                    onChange={event =>
                      setStartTime(
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group">

                  <label>
                    End Time
                  </label>

                  <input
                    type="time"
                    value={
                      endTime
                    }
                    onChange={event =>
                      setEndTime(
                        event.target.value
                      )
                    }
                  />

                </div>


                <div className="form-group full-width">

                  <label>
                    Purpose
                  </label>

                  <textarea
                    value={
                      purpose
                    }
                    onChange={event =>
                      setPurpose(
                        event.target.value
                      )
                    }
                    placeholder="Enter the purpose of your booking"
                    rows="4"
                  />

                </div>

              </div>


              <div className="form-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setSelectedResource(
                      null
                    )
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading
                    ? "Submitting..."
                    : "Submit Booking"}
                </button>

              </div>

            </form>

          </div>

        )}

      </>
    );
  }


  // ==========================================================
  // STUDENT BOOKINGS PAGE
  // ==========================================================

  function renderStudentBookings() {

    return (
      <>

        <div className="page-header">

          <div>

            <h1>
              My Bookings
            </h1>

            <p>
              {isFaculty
                ? "Track the status of your faculty booking requests."
                : "Track the status of your booking requests."}
            </p>

          </div>

        </div>


        <div className="dashboard-card">

          {myBookings.length === 0 ? (

            <div className="empty-state">

              <h3>
                No bookings found
              </h3>

              <p>
                You have not submitted
                any booking requests yet.
              </p>

            </div>

          ) : (

            <div className="booking-list">

              {myBookings
                .slice()
                .reverse()
                .map(booking => (

                  <div
                    className="booking-row"
                    key={booking.id}
                  >

                    <div className="booking-info">

                      <strong>
                        {
                          getResourceName(
                            booking.resource_id
                          )
                        }
                      </strong>

                      <span>
                        {formatDate(
                          booking.date
                        )}
                        {" • "}
                        {
                          booking.start_time
                        }
                        {" - "}
                        {
                          booking.end_time
                        }
                      </span>

                      <span>
                        Purpose:
                        {" "}
                        {booking.purpose}
                      </span>

                      {booking.admin_remark && (
                        <span className="booking-admin-remark">
                          Admin Remark:
                          {" "}
                          {booking.admin_remark}
                        </span>
                      )}

                      <small>
                        Booking ID:
                        {" "}
                        {booking.id}
                      </small>

                    </div>


                    {/* =================================================
                        STATUS + WITHDRAW BUTTON
                       ================================================= */}

                    <div className="booking-status-area">

                      <span
                        className={`status ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>


                      {/* -------------------------------------------------
                          WITHDRAW IS ONLY SHOWN FOR:
                          1. PENDING BOOKING
                          2. CURRENT USER'S BOOKING
                         ------------------------------------------------- */}

                      {booking.status ===
                        "PENDING" &&

                        booking.user_email ===
                          auth.user?.profile
                            ?.email && (

                        <button
                          className="withdraw-button"
                          onClick={() =>
                            withdrawBooking(
                              booking.id
                            )
                          }
                        >
                          Withdraw
                        </button>

                      )}

                    </div>

                  </div>

                ))}

            </div>

          )}

        </div>

      </>
    );
  }


  // ==========================================================
  // ADMIN DASHBOARD
  // ==========================================================

  function renderAdminDashboard() {

    return (
      <>

        <div className="page-header">

          <div>

            <h1>
              Admin Dashboard
            </h1>

            <p>
              Manage campus resource
              booking requests.
            </p>

          </div>

        </div>


        <div className="stats-grid">

          <div className="stat-card">

            <span>
              Resources
            </span>

            <strong>
              {resources.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Pending Requests
            </span>

            <strong>
              {pendingBookings.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Approved
            </span>

            <strong>
              {approvedBookings.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Rejected
            </span>

            <strong>
              {rejectedBookings.length}
            </strong>

          </div>

        </div>


        <div className="dashboard-card">

          <div className="card-heading">

            <div>

              <h2>
                Booking Requests
              </h2>

              <p>
                Review and manage
                campus booking requests.
              </p>

            </div>

          </div>


          {bookings.length === 0 ? (

            <div className="empty-state">

              <h3>
                No booking requests
              </h3>

              <p>
                There are currently
                no booking requests.
              </p>

            </div>

          ) : (

            <div className="admin-booking-list">

              {bookings
                .slice()
                .reverse()
                .map(booking => (

                  <div
                    className="admin-booking-card"
                    key={booking.id}
                  >

                    <div className="admin-booking-main">

                      <div>

                        <h3>
                          {
                            getResourceName(
                              booking.resource_id
                            )
                          }
                        </h3>

                        <p>
                          Student:
                          {" "}
                          {
                            booking.user_name
                          }
                        </p>

                        <p>
                          Email:
                          {" "}
                          {
                            booking.user_email
                          }
                        </p>

                      </div>


                      <span
                        className={`status ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>

                    </div>


                    <div className="admin-booking-details">

                      <span>
                        Date:
                        {" "}
                        {formatDate(
                          booking.date
                        )}
                      </span>

                      <span>
                        Time:
                        {" "}
                        {
                          booking.start_time
                        }
                        {" - "}
                        {
                          booking.end_time
                        }
                      </span>

                      <span>
                        Purpose:
                        {" "}
                        {
                          booking.purpose
                        }
                      </span>

                      <span>
                        ID:
                        {" "}
                        {booking.id}
                      </span>

                    </div>


                    {/* =================================================
                        ADMIN ACTIONS
                       ================================================= */}

                    {booking.admin_remark && (
                      <div className="admin-remark-display">
                        <strong>
                          Admin Remark:
                        </strong>
                        {" "}
                        {booking.admin_remark}
                      </div>
                    )}

                    {booking.status ===
                      "PENDING" && (
                      <>
                        <textarea
                          className="admin-remark-input"
                          placeholder="Add an optional remark..."
                          value={
                            adminRemarks[booking.id] || ""
                          }
                          onChange={event =>
                            setAdminRemarks(previous => ({
                              ...previous,
                              [booking.id]:
                                event.target.value
                            }))
                          }
                          rows="2"
                        />

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
                      </>
                    )}

                  </div>

                ))}

            </div>

          )}

        </div>

      </>
    );
  }


  // ==========================================================
  // MAIN APPLICATION LAYOUT
  // ==========================================================

  return (

    <div className="app-shell">


      {/* ======================================================
          SIDEBAR
         ====================================================== */}

      <aside className="sidebar">

        <div className="sidebar-brand">

          <div className="brand-mark">
            SC
          </div>

          <div>

            <h2>
              SmartCampus
            </h2>

            <span>
              Resource Management
            </span>

          </div>

        </div>


        <nav className="sidebar-nav">

          {!isAdmin && (

            <>

              <button
                className={
                  activePage ===
                  "dashboard"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActivePage(
                    "dashboard"
                  )
                }
              >
                <span>
                  Dashboard
                </span>
              </button>


              <button
                className={
                  activePage ===
                  "resources"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActivePage(
                    "resources"
                  )
                }
              >
                <span>
                  Resources
                </span>
              </button>


              <button
                className={
                  activePage ===
                  "bookings"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActivePage(
                    "bookings"
                  )
                }
              >
                <span>
                  My Bookings
                </span>
              </button>

            </>

          )}


          {isAdmin && (

            <button
              className={
                activePage ===
                "admin"
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                setActivePage(
                  "admin"
                )
              }
            >
              <span>
                Booking Requests
              </span>
            </button>

          )}

        </nav>


        <div className="sidebar-footer">

          <div className="user-profile">

            <div className="user-avatar">

              {
                userName
                  ?.charAt(0)
                  ?.toUpperCase()
              }

            </div>


            <div className="user-details">

              <strong>
                {userName}
              </strong>

              <span>
                {isAdmin
                  ? "Admin"
                  : isFaculty
                  ? "Faculty"
                  : "Student"}
              </span>

            </div>

          </div>


          <button
            className="logout-button"
            onClick={logout}
          >
            Sign Out
          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN CONTENT
         ====================================================== */}

      <main className="main-content">


        {/* ====================================================
            TOP BAR
           ==================================================== */}

        <header className="topbar">

          <div>

            <span className="topbar-label">
              Campus Resource Portal
            </span>

          </div>


          <div className="topbar-user">

            <span>
              {userEmail}
            </span>

            <span className="role-badge">

              {isAdmin
                ? "Admin"
                : isFaculty
                ? "Faculty"
                : "Student"}

            </span>

          </div>

        </header>


        {/* ====================================================
            ALERT MESSAGES
           ==================================================== */}

        {message && (

          <div className="success-message">

            {message}

          </div>

        )}


        {error && (

          <div className="error-message">

            {error}

          </div>

        )}


        {/* ====================================================
            PAGE CONTENT
           ==================================================== */}

        <section className="content-area">

          {!isAdmin &&
            activePage ===
              "dashboard" &&
            renderStudentDashboard()}


          {!isAdmin &&
            activePage ===
              "resources" &&
            renderResources()}


          {!isAdmin &&
            activePage ===
              "bookings" &&
            renderStudentBookings()}


          {isAdmin &&
            activePage ===
              "admin" &&
            renderAdminDashboard()}

        </section>

      </main>

    </div>

  );
}