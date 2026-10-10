import { useState } from "react";
import "./Signup.css";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const REGION = "ap-southeast-2";
const CLIENT_ID = "2ccooos6njocfrr07h9g99lc7u";

const cognitoClient = new CognitoIdentityProviderClient({
  region: REGION,
});

function Signup({ onBackToLogin }) {
  const [step, setStep] = useState("signup");

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [confirmationCode, setConfirmationCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.password) {
      setError("Please enter a password.");
      return;
    }

    setLoading(true);

    try {
      const command = new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: form.email.trim(),
        Password: form.password,

        UserAttributes: [
          {
            Name: "email",
            Value: form.email.trim(),
          },
          {
            Name: "custom:role",
            Value: form.role,
          },
        ],
      });

      const response = await cognitoClient.send(command);

      console.log("Signup response:", response);

      setMessage(
        "Account created successfully. Check your email for the confirmation code."
      );

      setStep("confirm");
    } catch (err) {
      console.error("Signup error:", err);

      if (err.name === "UsernameExistsException") {
        setError(
          "An account with this email already exists. Try logging in instead."
        );
      } else if (err.name === "InvalidPasswordException") {
        setError(
          "Password does not meet the Cognito password requirements."
        );
      } else if (err.name === "InvalidParameterException") {
        setError(
          err.message || "Some signup information is invalid."
        );
      } else {
        setError(
          err.message || "Unable to create the account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!confirmationCode.trim()) {
      setError("Please enter the confirmation code.");
      return;
    }

    setLoading(true);

    try {
      const command = new ConfirmSignUpCommand({
        ClientId: CLIENT_ID,
        Username: form.email.trim(),
        ConfirmationCode: confirmationCode.trim(),
      });

      await cognitoClient.send(command);

      setMessage(
        "Your account has been confirmed successfully. You can now log in."
      );

      setStep("confirmed");
    } catch (err) {
      console.error("Confirmation error:", err);

      if (err.name === "CodeMismatchException") {
        setError("Incorrect confirmation code.");
      } else if (err.name === "ExpiredCodeException") {
        setError("The confirmation code has expired.");
      } else {
        setError(
          err.message || "Unable to confirm the account."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: CLIENT_ID,
        Username: form.email.trim(),
      });

      await cognitoClient.send(command);

      setMessage("A new confirmation code has been sent to your email.");
    } catch (err) {
      console.error("Resend code error:", err);

      setError(
        err.message || "Unable to resend the confirmation code."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">

        {step === "signup" && (
          <>
            <h1>Create Account</h1>

            <p className="signup-subtitle">
              Create your SmartCampus account
            </p>

            {error && (
              <div className="signup-error">
                {error}
              </div>
            )}

            {message && (
              <div className="signup-success">
                {message}
              </div>
            )}

            <form onSubmit={handleSignup}>

              <div className="form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>

                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Type</label>

                <div className="role-options">

                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="student"
                      checked={form.role === "student"}
                      onChange={handleChange}
                    />

                    <span>Student</span>
                  </label>

                  <label className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value="faculty"
                      checked={form.role === "faculty"}
                      onChange={handleChange}
                    />

                    <span>Faculty</span>
                  </label>

                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="signup-button"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

            </form>

            <div className="login-link">
              Already have an account?

              <button
                type="button"
                onClick={onBackToLogin}
              >
                Login
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <h1>Confirm Your Account</h1>

            <p className="signup-subtitle">
              We sent a confirmation code to:
            </p>

            <strong>{form.email}</strong>

            {error && (
              <div className="signup-error">
                {error}
              </div>
            )}

            {message && (
              <div className="signup-success">
                {message}
              </div>
            )}

            <form onSubmit={handleConfirmation}>

              <div className="form-group">
                <label>Confirmation Code</label>

                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) =>
                    setConfirmationCode(e.target.value)
                  }
                  placeholder="Enter confirmation code"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="signup-button"
              >
                {loading
                  ? "Confirming..."
                  : "Confirm Account"}
              </button>

            </form>

            <button
              type="button"
              className="resend-button"
              onClick={resendCode}
              disabled={loading}
            >
              Resend Confirmation Code
            </button>

            <button
              type="button"
              className="back-button"
              onClick={() => setStep("signup")}
            >
              Back
            </button>
          </>
        )}

        {step === "confirmed" && (
          <>
            <h1>Account Confirmed ✓</h1>

            <div className="signup-success">
              Your SmartCampus account has been confirmed successfully.
            </div>

            <p>
              You can now log in using your email and password.
            </p>

            <button
              type="button"
              className="signup-button"
              onClick={onBackToLogin}
            >
              Go to Login
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default Signup;