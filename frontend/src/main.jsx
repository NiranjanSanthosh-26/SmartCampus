import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "react-oidc-context";
import "./index.css";
import App from "./App.jsx";

const cognitoAuthConfig = {
  authority:
    "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_TcN2PfyZG",

  client_id: "2ccooos6njocfrr07h9g99lc7u",

  redirect_uri: "http://localhost:5173/",

  post_logout_redirect_uri: "http://localhost:5173/",

  response_type: "code",

  scope: "openid email",

  metadata: {
    issuer:
      "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_TcN2PfyZG",

    authorization_endpoint:
      "https://ap-southeast-2tcn2pfyzg.auth.ap-southeast-2.amazoncognito.com/oauth2/authorize",

    token_endpoint:
      "https://ap-southeast-2tcn2pfyzg.auth.ap-southeast-2.amazoncognito.com/oauth2/token",

    userinfo_endpoint:
      "https://ap-southeast-2tcn2pfyzg.auth.ap-southeast-2.amazoncognito.com/oauth2/userInfo",

    end_session_endpoint:
      "https://ap-southeast-2tcn2pfyzg.auth.ap-southeast-2.amazoncognito.com/logout",

    jwks_uri:
      "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_TcN2PfyZG/.well-known/jwks.json",
  },
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
);