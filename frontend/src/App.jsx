import React, { useEffect, useState } from "react";
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

function formatDateTime(dateTime) {
  if (!dateTime) {
    return "—";
  }

  // Cognito timestamps can contain six fractional-second digits.
  // JavaScript Date parsing is more reliable after normalizing them.
  const normalized = String(dateTime)
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1");

  const d = new Date(normalized);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

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
  // ADMIN FILTER STATE
  // ==========================================================

  const [adminSearch, setAdminSearch] =
    useState("");

  const [adminStatusFilter, setAdminStatusFilter] =
    useState("ALL");

  const [adminResourceFilter, setAdminResourceFilter] =
    useState("ALL");

  // ==========================================================
  // ADMIN RESOURCE MANAGEMENT STATE
  // ==========================================================

  const [resourceForm, setResourceForm] = useState({
    name: "",
    type: "",
    location: "",
    capacity: "",
    status: "ACTIVE"
  });

  const [editingResourceId, setEditingResourceId] =
    useState(null);

  const [resourceSaving, setResourceSaving] =
    useState(false);

  // ==========================================================
  // ADMIN USER OVERVIEW STATE
  // ==========================================================

  const [adminUsers, setAdminUsers] =
    useState([]);

  const [adminUserSearch, setAdminUserSearch] =
    useState("");

  const [adminUserRoleFilter, setAdminUserRoleFilter] =
    useState("ALL");

  const [adminUserStatusFilter, setAdminUserStatusFilter] =
    useState("ALL");

  const [adminUsersLoading, setAdminUsersLoading] =
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

  const isAdmin =
    groups.includes("Admins");

  const isFaculty =
    groups.includes("Faculty");

  const isStudent =
    groups.includes("Students");

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
  // LOAD ADMIN USERS
  // ==========================================================

  async function loadAdminUsers() {
    if (!isAdmin) {
      return;
    }

    setAdminUsersLoading(true);

    try {
      const response =
        await fetch(
          `${API_URL}/users`
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          "Unable to load users."
        );
        return;
      }

      setAdminUsers(
        data.users || []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load users."
      );
    } finally {
      setAdminUsersLoading(false);
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

    if (isAdmin) {
      loadAdminUsers();
    }
  }, [auth.isAuthenticated, isAdmin]);

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

      setSelectedResource(null);
      setSelectedDate("");
      setStartTime("");
      setEndTime("");
      setPurpose("");

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
      const response =
        await fetch(
          `${API_URL}/bookings/${id}/approve`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              admin_remark:
                remark
            })
          }
        );

      const data =
        await response.json();

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
      const response =
        await fetch(
          `${API_URL}/bookings/${id}/reject`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              admin_remark:
                remark
            })
          }
        );

      const data =
        await response.json();

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

      await loadBookings();

    } catch (err) {
      console.error(err);

      setError(
        "Unable to withdraw booking."
      );
    }
  }

  // ==========================================================
  // ADMIN RESOURCE MANAGEMENT
  // ==========================================================

  function resetResourceForm() {
    setResourceForm({
      name: "",
      type: "",
      location: "",
      capacity: "",
      status: "ACTIVE"
    });
    setEditingResourceId(null);
  }

  function startAddResource() {
    clearMessages();
    resetResourceForm();
  }

  function startEditResource(resource) {
    clearMessages();
    setEditingResourceId(resource.id);
    setResourceForm({
      name: resource.name || "",
      type: resource.type || "",
      location: resource.location || "",
      capacity: String(resource.capacity ?? ""),
      status: resource.status || "ACTIVE"
    });
  }

  async function saveResource(event) {
    event.preventDefault();
    clearMessages();

    const name = resourceForm.name.trim();
    const type = resourceForm.type.trim();
    const location = resourceForm.location.trim();
    const capacity = Number(resourceForm.capacity);

    if (!name || !type || !location) {
      setError("Please fill in all resource fields.");
      return;
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      setError("Capacity must be a positive whole number.");
      return;
    }

    setResourceSaving(true);

    try {
      const isEditing = Boolean(editingResourceId);
      const endpoint = isEditing
        ? `${API_URL}/resources/${editingResourceId}`
        : `${API_URL}/resources`;

      const response = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          type,
          location,
          capacity,
          status: resourceForm.status || "ACTIVE"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          (isEditing
            ? "Unable to update resource."
            : "Unable to create resource.")
        );
        return;
      }

      setMessage(
        isEditing
          ? "Resource updated successfully."
          : "Resource created successfully."
      );

      resetResourceForm();
      await loadResources();
    } catch (err) {
      console.error(err);
      setError("Unable to save resource. Please try again.");
    } finally {
      setResourceSaving(false);
    }
  }

  async function toggleResourceStatus(resource) {
    clearMessages();

    const currentStatus = resource.status || "ACTIVE";
    const newStatus =
      currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const action =
      newStatus === "ACTIVE" ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${resource.name}?`
      )
    ) {
      return;
    }

    setResourceSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/resources/${resource.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: resource.name,
            type: resource.type,
            location: resource.location,
            capacity: Number(resource.capacity),
            status: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
          "Unable to change resource status."
        );
        return;
      }

      setMessage(
        newStatus === "ACTIVE"
          ? "Resource activated successfully."
          : "Resource deactivated successfully."
      );

      if (editingResourceId === resource.id) {
        resetResourceForm();
      }

      await loadResources();
    } catch (err) {
      console.error(err);
      setError("Unable to change resource status.");
    } finally {
      setResourceSaving(false);
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

    auth.removeUser();

    const logoutUrl =
      `${cognitoDomain}/logout` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&logout_uri=${encodeURIComponent(logoutUri)}`;

    window.location.replace(
      logoutUrl
    );
  }

  // ==========================================================
  // LOADING SCREEN
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

  // ==========================================================
  // AUTHENTICATION ERROR
  // ==========================================================

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

    if (showSignup) {
      return (
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

  if (
    !isStudent &&
    !isFaculty &&
    !isAdmin
  ) {
    return (
      <div className="loading-screen">

        <div className="loading-card">

          <h2>
            SmartCampus
          </h2>

          <p>
            Your account is authenticated,
            but no SmartCampus role is assigned.
            Please contact the administrator.
          </p>

          <button
            className="primary-button"
            onClick={logout}
          >
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
        booking.status ===
        "PENDING"
    );

  const approvedBookings =
    bookings.filter(
      booking =>
        booking.status ===
        "APPROVED"
    );

  const rejectedBookings =
    bookings.filter(
      booking =>
        booking.status ===
        "REJECTED"
    );

  const withdrawnBookings =
    bookings.filter(
      booking =>
        booking.status ===
        "WITHDRAWN"
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
  // ADMIN FILTERED BOOKINGS
  // ==========================================================

  const filteredAdminBookings =
    bookings.filter(booking => {

      const search =
        adminSearch
          .trim()
          .toLowerCase();

      const resourceName =
        getResourceName(
          booking.resource_id
        );

      const matchesSearch =
        !search ||
        (booking.user_name || "")
          .toLowerCase()
          .includes(search) ||
        (booking.user_email || "")
          .toLowerCase()
          .includes(search) ||
        (resourceName || "")
          .toLowerCase()
          .includes(search) ||
        (booking.purpose || "")
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        adminStatusFilter ===
          "ALL" ||
        booking.status ===
          adminStatusFilter;

      const matchesResource =
        adminResourceFilter ===
          "ALL" ||
        booking.resource_id ===
          adminResourceFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesResource
      );
    });

  // ==========================================================
  // ADMIN FILTERED USERS
  // ==========================================================

  const filteredAdminUsers =
    adminUsers.filter(user => {
      const search =
        adminUserSearch
          .trim()
          .toLowerCase();

      const matchesSearch =
        !search ||
        (user.name || "")
          .toLowerCase()
          .includes(search) ||
        (user.email || "")
          .toLowerCase()
          .includes(search) ||
        (user.username || "")
          .toLowerCase()
          .includes(search);

      const matchesRole =
        adminUserRoleFilter ===
          "ALL" ||
        (user.role || "")
          .toLowerCase() ===
          adminUserRoleFilter.toLowerCase();

      const matchesStatus =
        adminUserStatusFilter ===
          "ALL" ||
        (user.status || "") ===
          adminUserStatusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });

  // ==========================================================
  // STUDENT DASHBOARD
  // ==========================================================

  function renderStudentDashboard() {

    return (
      <>

        <div className="page-header">

          <div>

            <h1>
              Welcome back, {userName}
            </h1>

            <p>
              Manage your campus
              resource bookings.
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
                  Reserve a campus resource.
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
                          {booking.start_time}
                          {" - "}
                          {booking.end_time}
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
  // FACULTY DASHBOARD
  // ==========================================================

  function renderFacultyDashboard() {

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const upcomingBookings =
      myBookings
        .filter(
          booking =>
            booking.status ===
              "APPROVED" &&
            booking.date >=
              today
        )
        .slice()
        .sort(
          (a, b) => {

            const first =
              `${a.date} ${a.start_time}`;

            const second =
              `${b.date} ${b.start_time}`;

            return first.localeCompare(
              second
            );
          }
        );

    const recentBookings =
      myBookings
        .slice()
        .sort(
          (a, b) => {

            const first =
              `${a.date || ""} ${a.start_time || ""}`;

            const second =
              `${b.date || ""} ${b.start_time || ""}`;

            return second.localeCompare(
              first
            );
          }
        )
        .slice(0, 4);

    const pendingCount =
      myBookings.filter(
        booking =>
          booking.status ===
          "PENDING"
      ).length;

    const approvedCount =
      myBookings.filter(
        booking =>
          booking.status ===
          "APPROVED"
      ).length;

    return (
      <>

        <div className="page-header">

          <div>

            <h1>
              Faculty Dashboard
            </h1>

            <p>
              Welcome back, {userName}.
              Manage your campus resource
              bookings for academic activities
              and events.
            </p>

          </div>

        </div>


        <div className="stats-grid">

          <div className="stat-card">

            <span>
              Total Bookings
            </span>

            <strong>
              {myBookings.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Pending Requests
            </span>

            <strong>
              {pendingCount}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Approved Bookings
            </span>

            <strong>
              {approvedCount}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Upcoming
            </span>

            <strong>
              {upcomingBookings.length}
            </strong>

          </div>

        </div>


        <div className="dashboard-grid">

          <div className="dashboard-card">

            <div className="card-heading">

              <div>

                <h2>
                  Faculty Quick Booking
                </h2>

                <p>
                  Reserve a campus resource
                  for lectures, meetings,
                  workshops, events, or other
                  academic activities.
                </p>

              </div>

              <button
                className="primary-button"
                onClick={() =>
                  setActivePage(
                    "resources"
                  )
                }
              >
                Book a Resource
              </button>

            </div>

          </div>


          <div className="dashboard-card">

            <div className="card-heading">

              <div>

                <h2>
                  Upcoming Bookings
                </h2>

                <p>
                  Your approved faculty
                  reservations.
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


            {upcomingBookings.length === 0 ? (

              <div className="empty-state">

                <h3>
                  No upcoming bookings
                </h3>

                <p>
                  You do not have any
                  approved upcoming
                  resource reservations.
                </p>

              </div>

            ) : (

              <div className="booking-list">

                {upcomingBookings
                  .slice(0, 3)
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
                          {booking.start_time}
                          {" - "}
                          {booking.end_time}
                        </span>

                        <span>
                          {booking.purpose}
                        </span>

                      </div>

                      <span className="status approved">
                        APPROVED
                      </span>

                    </div>

                  ))}

              </div>

            )}

          </div>

        </div>


        <div className="dashboard-card">

          <div className="card-heading">

            <div>

              <h2>
                Recent Booking Activity
              </h2>

              <p>
                Latest faculty booking
                requests and their status.
              </p>

            </div>

          </div>


          {recentBookings.length === 0 ? (

            <div className="empty-state">

              <p>
                No booking activity yet.
              </p>

            </div>

          ) : (

            <div className="booking-list">

              {recentBookings.map(
                booking => (

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
                        {booking.start_time}
                        {" - "}
                        {booking.end_time}
                      </span>

                      <span>
                        Purpose:
                        {" "}
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

                )
              )}

            </div>

          )}

        </div>

      </>
    );
  }

  // ==========================================================
  // RESOURCE AVAILABILITY
  // ==========================================================

  function getResourceAvailability(
    resourceId
  ) {

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const approvedBookings =
      bookings
        .filter(
          booking =>
            booking.resource_id ===
              resourceId &&
            booking.status ===
              "APPROVED" &&
            booking.date >=
              today
        )
        .slice()
        .sort(
          (a, b) => {

            const first =
              `${a.date} ${a.start_time}`;

            const second =
              `${b.date} ${b.start_time}`;

            return first.localeCompare(
              second
            );
          }
        );

    if (
      approvedBookings.length ===
      0
    ) {

      return {
        status:
          "available",

        label:
          "Available",

        detail:
          "No upcoming approved bookings"
      };

    }

    const currentTime =
      new Date()
        .toTimeString()
        .slice(0, 5);

    const todayBooking =
      approvedBookings.find(
        booking =>
          booking.date ===
            today &&
          booking.start_time <=
            currentTime &&
          currentTime <
            booking.end_time
      );

    if (todayBooking) {

      return {
        status:
          "booked",

        label:
          "Booked",

        detail:
          `Booked today • ${todayBooking.start_time} - ${todayBooking.end_time}`
      };

    }

    const nextBooking =
      approvedBookings[0];

    if (
      nextBooking.date ===
      today
    ) {

      return {
        status:
          "available",

        label:
          "Available",

        detail:
          `Next booking today • ${nextBooking.start_time} - ${nextBooking.end_time}`
      };

    }

    return {
      status:
        "available",

      label:
        "Available",

      detail:
        `Next booking • ${formatDate(
          nextBooking.date
        )} • ${nextBooking.start_time} - ${nextBooking.end_time}`
    };
  }

  // ==========================================================
  // RESOURCE PAGE
  // ==========================================================

  function renderResources() {

    const activeResources = resources.filter(
      resource =>
        (resource.status || "ACTIVE") === "ACTIVE"
    );

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

          {activeResources.length === 0 ? (
            <div className="dashboard-card">
              <div className="empty-state">
                <h3>No resources available</h3>
                <p>There are currently no active campus resources.</p>
              </div>
            </div>
          ) : (
            activeResources.map(
              resource => (

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

                  {(() => {

                    const availability =
                      getResourceAvailability(
                        resource.id
                      );

                    return (

                      <div className="resource-availability-info">

                        <div className="resource-availability-status">

                          <span
                            className={
                              availability.status ===
                              "booked"
                                ? "booked-dot"
                                : "available-dot"
                            }
                          >
                          </span>

                          {availability.label}

                        </div>

                        <small>
                          {availability.detail}
                        </small>

                      </div>

                    );

                  })()}

                </div>

              </div>

            )
            )
          )}

        </div>


        {selectedResource && (

          <div className="booking-form-card">

            <div className="card-heading">

              <div>

                <h2>
                  Booking Details
                </h2>

                <p>
                  {selectedResource.name}
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
  // STUDENT / FACULTY BOOKINGS PAGE
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
                .map(
                  booking => (

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
                          {booking.start_time}
                          {" - "}
                          {booking.end_time}
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


                      <div className="booking-status-area">

                        <span
                          className={`status ${getStatusClass(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>


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

                  )
                )}

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
              Manage campus resources,
              bookings, and allocation
              requests.
            </p>

          </div>

        </div>


        {/* ====================================================
            ADMIN OVERVIEW
           ==================================================== */}

        <div className="stats-grid">

          <div className="stat-card">

            <span>
              Total Resources
            </span>

            <strong>
              {resources.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Total Bookings
            </span>

            <strong>
              {bookings.length}
            </strong>

          </div>


          <div className="stat-card">

            <span>
              Pending
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


          <div className="stat-card">

            <span>
              Withdrawn
            </span>

            <strong>
              {withdrawnBookings.length}
            </strong>

          </div>

        </div>


        {/* ====================================================
            BOOKING MANAGEMENT
           ==================================================== */}

        <div className="dashboard-card">

          <div className="card-heading">

            <div>

              <h2>
                Booking Management
              </h2>

              <p>
                Search, filter, and manage
                campus resource booking
                requests.
              </p>

            </div>

          </div>


          {/* ==================================================
              FILTERS
             ================================================== */}

          <div className="admin-filters">

            <div className="form-group">

              <label>
                Search
              </label>

              <input
                type="text"
                placeholder="Search student, email, resource..."
                value={
                  adminSearch
                }
                onChange={
                  event =>
                    setAdminSearch(
                      event.target.value
                    )
                }
              />

            </div>


            <div className="form-group">

              <label>
                Status
              </label>

              <select
                value={
                  adminStatusFilter
                }
                onChange={
                  event =>
                    setAdminStatusFilter(
                      event.target.value
                    )
                }
              >

                <option value="ALL">
                  All Statuses
                </option>

                <option value="PENDING">
                  Pending
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="WITHDRAWN">
                  Withdrawn
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                Resource
              </label>

              <select
                value={
                  adminResourceFilter
                }
                onChange={
                  event =>
                    setAdminResourceFilter(
                      event.target.value
                    )
                }
              >

                <option value="ALL">
                  All Resources
                </option>

                {resources.map(
                  resource => (

                    <option
                      key={resource.id}
                      value={resource.id}
                    >
                      {resource.name}
                    </option>

                  )
                )}

              </select>

            </div>


            <div className="admin-filter-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => {

                  setAdminSearch("");

                  setAdminStatusFilter(
                    "ALL"
                  );

                  setAdminResourceFilter(
                    "ALL"
                  );

                }}
              >
                Clear Filters
              </button>

            </div>

          </div>


          {/* ==================================================
              RESULT COUNT
             ================================================== */}

          <div className="admin-result-count">

            Showing{" "}

            <strong>
              {
                filteredAdminBookings.length
              }
            </strong>

            {" "}of{" "}

            <strong>
              {bookings.length}
            </strong>

            {" "}bookings

          </div>


          {/* ==================================================
              BOOKING LIST
             ================================================== */}

          {filteredAdminBookings.length ===
          0 ? (

            <div className="empty-state">

              <h3>
                No bookings found
              </h3>

              <p>
                No bookings match the
                selected filters.
              </p>

            </div>

          ) : (

            <div className="admin-booking-list">

              {filteredAdminBookings
                .slice()
                .reverse()
                .map(
                  booking => (

                    <div
                      className="admin-booking-card"
                      key={booking.id}
                    >

                      {/* ======================================
                          BOOKING HEADER
                         ====================================== */}

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
                            User:
                            {" "}
                            {booking.user_name}
                          </p>

                          <p>
                            Email:
                            {" "}
                            {booking.user_email}
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


                      {/* ======================================
                          BOOKING DETAILS
                         ====================================== */}

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
                          {booking.start_time}
                          {" - "}
                          {booking.end_time}
                        </span>

                        <span>
                          Purpose:
                          {" "}
                          {booking.purpose}
                        </span>

                        <span>
                          ID:
                          {" "}
                          {booking.id}
                        </span>

                      </div>


                      {/* ======================================
                          ADMIN REMARK
                         ====================================== */}

                      {booking.admin_remark && (

                        <div className="admin-remark-display">

                          <strong>
                            Admin Remark:
                          </strong>

                          {" "}

                          {booking.admin_remark}

                        </div>

                      )}


                      {/* ======================================
                          ADMIN ACTIONS
                         ====================================== */}

                      {booking.status ===
                        "PENDING" && (

                        <>

                          <textarea
                            className="admin-remark-input"
                            placeholder="Add an optional remark..."
                            value={
                              adminRemarks[
                                booking.id
                              ] || ""
                            }
                            onChange={
                              event =>
                                setAdminRemarks(
                                  previous => ({
                                    ...previous,

                                    [booking.id]:
                                      event.target.value
                                  })
                                )
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

                  )
                )}

            </div>

          )}

        </div>

      </>
    );
  }

  // ==========================================================
  // ADMIN RESOURCE MANAGEMENT
  // ==========================================================

  function renderAdminResources() {

    const activeCount = resources.filter(
      resource =>
        (resource.status || "ACTIVE") === "ACTIVE"
    ).length;

    const inactiveCount =
      resources.length - activeCount;

    return (
      <>
        <div className="page-header admin-resource-header">
          <div>
            <h1>Resource Management</h1>
            <p>
              Add, edit, activate, and deactivate campus resources.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={startAddResource}
          >
            + Add Resource
          </button>
        </div>

        <div className="stats-grid admin-resource-stats">
          <div className="stat-card">
            <span>Total Resources</span>
            <strong>{resources.length}</strong>
          </div>

          <div className="stat-card">
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>

          <div className="stat-card">
            <span>Inactive</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <h2>Campus Resources</h2>
              <p>Manage the resources available for booking.</p>
            </div>
          </div>

          <div className="admin-resource-grid">
            {resources.map(resource => {
              const status = resource.status || "ACTIVE";

              return (
                <div className="admin-resource-card" key={resource.id}>
                  <div className="admin-resource-card-header">
                    <div>
                      <h3>{resource.name}</h3>
                      <span
                        className={`status ${status.toLowerCase()}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="admin-resource-details">
                    <p><strong>Type:</strong> {resource.type}</p>
                    <p><strong>Location:</strong> {resource.location}</p>
                    <p><strong>Capacity:</strong> {resource.capacity}</p>
                    <small>ID: {resource.id}</small>
                  </div>

                  <div className="admin-resource-actions">
                    <button
                      className="secondary-button"
                      onClick={() => startEditResource(resource)}
                    >
                      Edit
                    </button>

                    <button
                      className={
                        status === "ACTIVE"
                          ? "reject-button"
                          : "approve-button"
                      }
                      disabled={resourceSaving}
                      onClick={() => toggleResourceStatus(resource)}
                    >
                      {status === "ACTIVE"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-card resource-form-card">
          <div className="card-heading">
            <div>
              <h2>
                {editingResourceId ? "Edit Resource" : "Add Resource"}
              </h2>
              <p>
                {editingResourceId
                  ? "Update the selected campus resource."
                  : "Create a new campus resource."}
              </p>
            </div>

            {editingResourceId && (
              <button
                className="secondary-button"
                type="button"
                onClick={resetResourceForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={saveResource}>
            <div className="form-grid">
              <div className="form-group">
                <label>Resource Name</label>
                <input
                  type="text"
                  value={resourceForm.name}
                  onChange={event =>
                    setResourceForm(previous => ({
                      ...previous,
                      name: event.target.value
                    }))
                  }
                  placeholder="e.g. Computer Lab 2"
                />
              </div>

              <div className="form-group">
                <label>Resource Type</label>
                <input
                  type="text"
                  value={resourceForm.type}
                  onChange={event =>
                    setResourceForm(previous => ({
                      ...previous,
                      type: event.target.value
                    }))
                  }
                  placeholder="e.g. Laboratory"
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={resourceForm.location}
                  onChange={event =>
                    setResourceForm(previous => ({
                      ...previous,
                      location: event.target.value
                    }))
                  }
                  placeholder="e.g. Block A"
                />
              </div>

              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={resourceForm.capacity}
                  onChange={event =>
                    setResourceForm(previous => ({
                      ...previous,
                      capacity: event.target.value
                    }))
                  }
                  placeholder="e.g. 60"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={resourceForm.status}
                  onChange={event =>
                    setResourceForm(previous => ({
                      ...previous,
                      status: event.target.value
                    }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={resetResourceForm}
              >
                Clear
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={resourceSaving}
              >
                {resourceSaving
                  ? "Saving..."
                  : editingResourceId
                  ? "Save Resource"
                  : "Create Resource"}
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }

  // ==========================================================
  // ADMIN USER OVERVIEW
  // ==========================================================

  function renderAdminUsers() {
    const totalUsers =
      adminUsers.length;

    const studentCount =
      adminUsers.filter(
        user =>
          (user.role || "")
            .toLowerCase() ===
          "student"
      ).length;

    const facultyCount =
      adminUsers.filter(
        user =>
          (user.role || "")
            .toLowerCase() ===
          "faculty"
      ).length;

    const adminCount =
      adminUsers.filter(
        user =>
          (user.role || "")
            .toLowerCase() ===
          "admin"
      ).length;

    const confirmedCount =
      adminUsers.filter(
        user =>
          user.status ===
          "CONFIRMED"
      ).length;

    return (
      <>
        <div className="page-header admin-user-header">
          <div>
            <h1>User Overview</h1>
            <p>
              View registered SmartCampus users,
              roles, and account status.
            </p>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={loadAdminUsers}
            disabled={adminUsersLoading}
          >
            {adminUsersLoading
              ? "Refreshing..."
              : "Refresh Users"}
          </button>
        </div>

        <div className="stats-grid admin-user-stats">
          <div className="stat-card">
            <span>Total Users</span>
            <strong>{totalUsers}</strong>
          </div>

          <div className="stat-card">
            <span>Students</span>
            <strong>{studentCount}</strong>
          </div>

          <div className="stat-card">
            <span>Faculty</span>
            <strong>{facultyCount}</strong>
          </div>

          <div className="stat-card">
            <span>Admins</span>
            <strong>{adminCount}</strong>
          </div>

          <div className="stat-card">
            <span>Confirmed</span>
            <strong>{confirmedCount}</strong>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <h2>Registered Users</h2>
              <p>
                Search and filter users registered
                through Cognito.
              </p>
            </div>
          </div>

          <div className="admin-filters admin-user-filters">
            <div className="form-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search name, email, username..."
                value={adminUserSearch}
                onChange={event =>
                  setAdminUserSearch(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={adminUserRoleFilter}
                onChange={event =>
                  setAdminUserRoleFilter(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Roles
                </option>
                <option value="student">
                  Student
                </option>
                <option value="faculty">
                  Faculty
                </option>
                <option value="admin">
                  Admin
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={adminUserStatusFilter}
                onChange={event =>
                  setAdminUserStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="ALL">
                  All Statuses
                </option>
                <option value="CONFIRMED">
                  Confirmed
                </option>
                <option value="UNCONFIRMED">
                  Unconfirmed
                </option>
                <option value="ARCHIVED">
                  Archived
                </option>
                <option value="COMPROMISED">
                  Compromised
                </option>
                <option value="UNKNOWN">
                  Unknown
                </option>
              </select>
            </div>

            <div className="admin-filter-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setAdminUserSearch("");
                  setAdminUserRoleFilter("ALL");
                  setAdminUserStatusFilter("ALL");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="admin-result-count">
            Showing{" "}
            <strong>
              {filteredAdminUsers.length}
            </strong>
            {" "}of{" "}
            <strong>
              {adminUsers.length}
            </strong>
            {" "}users
          </div>

          {adminUsersLoading ? (
            <div className="empty-state">
              <h3>Loading users...</h3>
              <p>
                Fetching the latest users from
                Cognito.
              </p>
            </div>
          ) : filteredAdminUsers.length === 0 ? (
            <div className="empty-state">
              <h3>No users found</h3>
              <p>
                No users match the selected
                filters.
              </p>
            </div>
          ) : (
            <div className="admin-user-list">
              {filteredAdminUsers.map(user => {
                const role =
                  (user.role || "unknown")
                    .toLowerCase();

                const roleLabel =
                  role === "student"
                    ? "Student"
                    : role === "faculty"
                    ? "Faculty"
                    : role === "admin"
                    ? "Admin"
                    : "Unknown";

                const status =
                  user.status || "UNKNOWN";

                return (
                  <div
                    className="admin-user-card"
                    key={user.username}
                  >
                    <div className="admin-user-main">
                      <div className="admin-user-avatar">
                        {(user.name ||
                          user.email ||
                          "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="admin-user-info">
                        <h3>
                          {user.name ||
                            "Unnamed User"}
                        </h3>

                        <p>
                          {user.email ||
                            "No email available"}
                        </p>

                        <small>
                          Username:{" "}
                          {user.username}
                        </small>
                      </div>
                    </div>

                    <div className="admin-user-meta">
                      <span
                        className={`user-role-badge ${role}`}
                      >
                        {roleLabel}
                      </span>

                      <span
                        className={`status ${getStatusClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>

                      <span
                        className={
                          user.enabled
                            ? "user-enabled"
                            : "user-disabled"
                        }
                      >
                        {user.enabled
                          ? "Enabled"
                          : "Disabled"}
                      </span>
                    </div>

                    <div className="admin-user-dates">
                      <span>
                        Created:{" "}
                        {formatDateTime(
                          user.created_at
                        )}
                      </span>

                      <span>
                        Updated:{" "}
                        {formatDateTime(
                          user.updated_at
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  // ==========================================================
  // ADMIN PLACEHOLDER PAGE
  // ==========================================================

  function renderAdminPlaceholder(
    title,
    description
  ) {

    return (
      <>
        <div className="page-header">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="empty-state">
            <h3>Coming Next</h3>
            <p>
              This Admin module will be implemented in the next development step.
            </p>
            <button
              className="secondary-button"
              onClick={() => setActivePage("admin")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  // ==========================================================
  // MAIN APPLICATION LAYOUT
  // ==========================================================

  return (

    <div className="app-shell">

      <style>{`
        .admin-user-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .admin-user-filters {
          margin-bottom: 18px;
        }

        .admin-user-list {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }

        .admin-user-card {
          display: grid;
          grid-template-columns: minmax(240px, 1.5fr) minmax(220px, 1fr) minmax(180px, 0.8fr);
          align-items: center;
          gap: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 18px;
          background: #fff;
        }

        .admin-user-main {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .admin-user-avatar {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #eef2ff;
          color: #3730a3;
          font-weight: 700;
        }

        .admin-user-info {
          min-width: 0;
        }

        .admin-user-info h3 {
          margin: 0 0 5px;
        }

        .admin-user-info p {
          margin: 0 0 5px;
          overflow-wrap: anywhere;
        }

        .admin-user-info small {
          color: #6b7280;
          overflow-wrap: anywhere;
        }

        .admin-user-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .user-role-badge {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.82rem;
          font-weight: 600;
          background: #f3f4f6;
          color: #374151;
        }

        .user-role-badge.student {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .user-role-badge.faculty {
          background: #f5f3ff;
          color: #6d28d9;
        }

        .user-role-badge.admin {
          background: #fff7ed;
          color: #c2410c;
        }

        .user-enabled,
        .user-disabled {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .user-enabled {
          background: #ecfdf5;
          color: #047857;
        }

        .user-disabled {
          background: #fef2f2;
          color: #b91c1c;
        }

        .admin-user-dates {
          display: flex;
          flex-direction: column;
          gap: 7px;
          color: #6b7280;
          font-size: 0.85rem;
        }

        @media (max-width: 900px) {
          .admin-user-card {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .admin-user-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        .admin-resource-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .admin-resource-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
        }

        .admin-resource-card {
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 20px;
          background: #fff;
        }

        .admin-resource-card-header h3 {
          margin: 0 0 10px;
        }

        .admin-resource-details p {
          margin: 8px 0;
        }

        .admin-resource-details small {
          display: block;
          margin-top: 12px;
          color: #6b7280;
        }

        .admin-resource-actions {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .admin-resource-actions button {
          flex: 1;
        }

        .resource-form-card {
          margin-top: 20px;
        }

        @media (max-width: 700px) {
          .admin-resource-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

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

          {/* ==================================================
              STUDENT / FACULTY NAVIGATION
             ================================================== */}

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


          {/* ==================================================
              ADMIN NAVIGATION
             ================================================== */}

          {isAdmin && (

            <>

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
                  Dashboard
                </span>

              </button>


              <button
                className={
                  activePage ===
                  "admin-bookings"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActivePage(
                    "admin-bookings"
                  )
                }
              >

                <span>
                  Booking Requests
                </span>

              </button>


              <button
                className={
                  activePage ===
                  "admin-resources"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActivePage(
                    "admin-resources"
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
                  "admin-users"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActivePage(
                    "admin-users"
                  )
                }
              >

                <span>
                  Users
                </span>

              </button>


              <button
                className={
                  activePage ===
                  "admin-analytics"
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActivePage(
                    "admin-analytics"
                  )
                }
              >

                <span>
                  Analytics
                </span>

              </button>

            </>

          )}

        </nav>


        {/* ====================================================
            SIDEBAR FOOTER
           ==================================================== */}

        <div className="sidebar-footer">

          <div className="user-profile">

            <div className="user-avatar">

              {userName
                ?.charAt(0)
                ?.toUpperCase()}

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

          {/* STUDENT / FACULTY DASHBOARD */}

          {!isAdmin &&
            activePage ===
              "dashboard" &&
            (
              isFaculty
                ? renderFacultyDashboard()
                : renderStudentDashboard()
            )}


          {/* RESOURCES */}

          {!isAdmin &&
            activePage ===
              "resources" &&
            renderResources()}


          {/* BOOKINGS */}

          {!isAdmin &&
            activePage ===
              "bookings" &&
            renderStudentBookings()}


          {/* ADMIN DASHBOARD */}

          {isAdmin &&
            activePage ===
              "admin" &&
            renderAdminDashboard()}


          {/* ADMIN BOOKING REQUESTS */}

          {isAdmin &&
            activePage ===
              "admin-bookings" &&
            renderAdminDashboard()}


          {/* ADMIN RESOURCES */}

          {isAdmin &&
            activePage ===
              "admin-resources" &&
            renderAdminResources()}


          {/* ADMIN USERS */}

          {isAdmin &&
            activePage ===
              "admin-users" &&
            renderAdminUsers()}


          {/* ADMIN ANALYTICS */}

          {isAdmin &&
            activePage ===
              "admin-analytics" &&
            renderAdminPlaceholder(
              "Analytics",
              "View booking activity and resource utilization."
            )}

        </section>

      </main>

    </div>

  );
}